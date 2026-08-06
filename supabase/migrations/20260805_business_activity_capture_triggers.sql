-- Business Activity Log - Step 6 (Migration C)
--
-- Triggers are what light up admin, vendor and system events WITHOUT editing
-- anything under app/admin/** or app/vendor/**. They also catch a write that
-- bypasses every route entirely: 20260721_business_role_rls.sql documents that
-- an owner holding their anon key can PATCH business_accounts straight through
-- PostgREST, and only a trigger sees that.
--
-- Actor attribution caveat, verified rather than assumed: every admin booking
-- and business action uses createAdminClient(), so auth.uid() is NULL inside
-- the resulting trigger. Threading a "last modified by" column would mean
-- editing the admin module, which is out of scope. The triggers therefore
-- guarantee that the EVENT is recorded, and fall back to 'Platform admin' for
-- the actor. That matches the agreed redaction level, where the business never
-- sees an admin's name anyway.

-- ============================================================================
-- Shared actor resolution
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_business_actor(
  p_business_account_id uuid,
  OUT actor_type text,
  OUT actor_name text,
  OUT actor_business_user_id uuid,
  OUT actor_auth_user_id uuid,
  OUT actor_role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  actor_auth_user_id := v_uid;

  IF v_uid IS NOT NULL THEN
    SELECT bu.id, COALESCE(bu.full_name, bu.email), bu.role
    INTO actor_business_user_id, actor_name, actor_role
    FROM business_users bu
    WHERE bu.auth_user_id = v_uid
      AND bu.business_account_id = p_business_account_id;

    IF FOUND THEN
      actor_type := 'business_user';
      RETURN;
    END IF;

    -- profiles has id and role. It does NOT have auth_user_id or user_role,
    -- whatever 20250107_add_admin_wallet_controls.sql assumes.
    IF EXISTS (SELECT 1 FROM profiles p WHERE p.id = v_uid AND p.role = 'admin') THEN
      actor_type := 'admin';
      actor_name := 'Platform admin';
      actor_role := 'admin';
      actor_auth_user_id := v_uid;
      RETURN;
    END IF;
  END IF;

  -- Service-role write: the actor is unknowable from inside the database.
  actor_type := 'admin';
  actor_name := 'Platform admin';
  actor_auth_user_id := NULL;
END;
$function$;

-- ============================================================================
-- business_bookings: status changes
--
-- Nine functions across the admin and vendor modules write this column. A
-- trigger is the only way to cover them all without editing either module, and
-- it keeps covering anything added later.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  a RECORD;
  v_action text;
  v_severity text;
  v_vendor_name text;
BEGIN
  IF NEW.booking_status IS NOT DISTINCT FROM OLD.booking_status THEN
    RETURN NEW;
  END IF;

  -- cancel_business_booking_with_refund sets this before its own UPDATE,
  -- because it writes a richer booking.cancelled row itself. Without the guard
  -- every business cancellation would also emit a bogus
  -- "Platform admin changed booking ... to cancelled" beside it.
  IF COALESCE(current_setting('app.skip_activity_status_log', true), '') = '1' THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT * INTO a FROM resolve_business_actor(NEW.business_account_id);

    -- A status the vendor drives: attribute it to the vendor named on the
    -- assignment, which is knowable from the row even when auth.uid() is not.
    IF NEW.booking_status IN ('completed', 'in_progress', 'assigned') THEN
      SELECT va.business_name INTO v_vendor_name
      FROM booking_assignments ba
      JOIN vendor_applications va ON va.id = ba.vendor_id
      WHERE ba.business_booking_id = NEW.id
        AND ba.status NOT IN ('rejected', 'cancelled')
      ORDER BY ba.created_at DESC
      LIMIT 1;

      IF v_vendor_name IS NOT NULL AND a.actor_type = 'admin' THEN
        a.actor_type := 'vendor';
        a.actor_name := v_vendor_name;
      END IF;
    END IF;

    IF NEW.booking_status = 'completed' THEN
      v_action := 'booking.completed';
      v_severity := 'important';
    ELSIF NEW.booking_status = 'cancelled' THEN
      -- Reached only when something other than the business cancel path did
      -- this, and that path does not refund. Say so plainly.
      v_action := 'booking.cancelled_by_admin';
      v_severity := 'critical';
    ELSE
      v_action := 'booking.status_changed_by_admin';
      v_severity := 'important';
    END IF;

    PERFORM log_business_activity(
      p_business_account_id    => NEW.business_account_id,
      p_action                 => v_action,
      p_category               => 'booking',
      p_actor_type             => a.actor_type,
      p_actor_name             => a.actor_name,
      p_actor_auth_user_id     => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id,
      p_actor_role             => a.actor_role,
      p_severity               => v_severity,
      p_entity_type            => 'business_booking',
      p_entity_id              => NEW.id,
      p_entity_label           => NEW.booking_number,
      p_changes                => jsonb_build_object(
        'booking_status', jsonb_build_object('from', OLD.booking_status, 'to', NEW.booking_status)
      ),
      p_amount                 => NEW.total_price,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'previous_status', OLD.booking_status,
        'new_status', NEW.booking_status,
        'vendor_name', v_vendor_name,
        'refund_issued', CASE WHEN NEW.booking_status = 'cancelled' THEN false ELSE NULL END
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    -- Auditing must never abort the write it describes.
    RAISE WARNING 'booking status activity log failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_booking_status ON public.business_bookings;
CREATE TRIGGER trg_log_business_booking_status
  AFTER UPDATE OF booking_status ON public.business_bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_business_booking_status_change();

-- ============================================================================
-- business_bookings: deletes
--
-- Safety net only. Both business delete routes use the service-role client, so
-- auth.uid() is NULL and the trigger cannot tell an owner from an admin. The
-- routes therefore log explicitly (with the right actor and, for bulk, a shared
-- batch id) BEFORE deleting, and this trigger skips when such a row already
-- exists. What it does catch is an admin-side delete, which is a critical event
-- the owner would otherwise never see.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_booking_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  a RECORD;
BEGIN
  BEGIN
    IF EXISTS (
      SELECT 1 FROM business_activity_logs
      WHERE entity_id = OLD.id
        AND action IN ('booking.deleted', 'booking.bulk_deleted')
    ) THEN
      RETURN OLD;
    END IF;

    SELECT * INTO a FROM resolve_business_actor(OLD.business_account_id);

    PERFORM log_business_activity(
      p_business_account_id    => OLD.business_account_id,
      p_action                 => 'booking.deleted',
      p_category               => 'booking',
      p_actor_type             => a.actor_type,
      p_actor_name             => a.actor_name,
      p_actor_auth_user_id     => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id,
      p_actor_role             => a.actor_role,
      p_severity               => 'critical',
      p_entity_type            => 'business_booking',
      p_entity_id              => OLD.id,
      p_entity_label           => OLD.booking_number,
      p_amount                 => OLD.total_price,
      p_currency               => 'AED',
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'previous_status', OLD.booking_status,
        'pickup_at', OLD.pickup_datetime,
        'customer_name', OLD.customer_name,
        -- Deleting a business booking has never issued a refund. State it.
        'refund_issued', false
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'booking delete activity log failed: %', SQLERRM;
  END;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_booking_deleted ON public.business_bookings;
CREATE TRIGGER trg_log_business_booking_deleted
  AFTER DELETE ON public.business_bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_business_booking_deleted();

-- ============================================================================
-- booking_assignments: vendor lifecycle
--
-- booking_assignments is polymorphic (business_booking_id XOR booking_id) and
-- already carries eight triggers. The WHEN clause keeps this one off customer
-- bookings entirely.
--
-- Completion is deliberately NOT logged here: the booking_status trigger owns
-- it, so the two cannot double count.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_assignment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account uuid;
  v_label text;
  v_total numeric;
  v_vendor_name text;
  v_action text;
  v_severity text;
  v_driver_name text;
BEGIN
  BEGIN
    SELECT bb.business_account_id, bb.booking_number, bb.total_price
    INTO v_account, v_label, v_total
    FROM business_bookings bb WHERE bb.id = NEW.business_booking_id;

    IF v_account IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT va.business_name INTO v_vendor_name
    FROM vendor_applications va WHERE va.id = NEW.vendor_id;

    IF TG_OP = 'INSERT' THEN
      v_action := 'booking.assigned_to_vendor';
      v_severity := 'info';
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'accepted' THEN
      v_action := 'booking.accepted_by_vendor';
      v_severity := 'important';
    ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'rejected' THEN
      v_action := 'booking.rejected_by_vendor';
      v_severity := 'important';
    ELSIF NEW.driver_id IS DISTINCT FROM OLD.driver_id AND NEW.driver_id IS NOT NULL THEN
      v_action := 'booking.driver_assigned';
      v_severity := 'info';
    ELSE
      RETURN NEW;
    END IF;

    IF v_action = 'booking.driver_assigned' THEN
      SELECT vd.full_name INTO v_driver_name
      FROM vendor_drivers vd WHERE vd.id = NEW.driver_id;
    END IF;

    PERFORM log_business_activity(
      p_business_account_id => v_account,
      p_action              => v_action,
      p_category            => 'booking',
      -- An assignment INSERT is the platform allocating work; the vendor's own
      -- responses are the vendor acting.
      p_actor_type          => CASE WHEN TG_OP = 'INSERT' THEN 'admin' ELSE 'vendor' END,
      p_actor_name          => CASE WHEN TG_OP = 'INSERT'
                                 THEN 'Platform admin'
                                 ELSE COALESCE(v_vendor_name, 'A vendor') END,
      p_severity            => v_severity,
      p_entity_type         => 'business_booking',
      p_entity_id           => NEW.business_booking_id,
      p_entity_label        => v_label,
      p_metadata            => jsonb_strip_nulls(jsonb_build_object(
        'vendor_name', v_vendor_name,
        'assignment_id', NEW.id,
        -- Driver name only. Phone and plate stay on the booking page: this log
        -- is exportable to CSV and must not become a contact database.
        'driver_name', v_driver_name,
        'reason_public', CASE WHEN v_action = 'booking.rejected_by_vendor'
                           THEN NEW.rejection_reason ELSE NULL END
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'assignment activity log failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_assignment ON public.booking_assignments;
CREATE TRIGGER trg_log_business_assignment
  AFTER INSERT OR UPDATE ON public.booking_assignments
  FOR EACH ROW
  WHEN (NEW.business_booking_id IS NOT NULL)
  EXECUTE FUNCTION public.log_business_assignment_activity();

-- ============================================================================
-- booking_datetime_modifications: reschedules
--
-- The purpose-built record already carries previous, new, actor and reason, and
-- modified_by_user_id is a real FK, so attribution here is exact. A trigger
-- covers any future reschedule path for free.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_booking_reschedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account uuid;
  v_label text;
  v_bu_id uuid;
  v_name text;
BEGIN
  BEGIN
    SELECT bb.business_account_id, bb.booking_number
    INTO v_account, v_label
    FROM business_bookings bb WHERE bb.id = NEW.booking_id;

    IF v_account IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT bu.id, COALESCE(bu.full_name, bu.email)
    INTO v_bu_id, v_name
    FROM business_users bu WHERE bu.auth_user_id = NEW.modified_by_user_id;

    PERFORM log_business_activity(
      p_business_account_id    => v_account,
      p_action                 => 'booking.datetime_changed',
      p_category               => 'booking',
      p_actor_type             => CASE WHEN v_bu_id IS NOT NULL
                                    THEN 'business_user' ELSE 'admin' END,
      p_actor_name             => COALESCE(v_name, 'Platform admin'),
      p_actor_auth_user_id     => NEW.modified_by_user_id,
      p_actor_business_user_id => v_bu_id,
      p_severity               => 'important',
      p_entity_type            => 'business_booking',
      p_entity_id              => NEW.booking_id,
      p_entity_label           => v_label,
      p_changes                => jsonb_build_object(
        'pickup_datetime', jsonb_build_object(
          'from', NEW.previous_datetime, 'to', NEW.new_datetime)
      ),
      p_metadata               => jsonb_strip_nulls(jsonb_build_object(
        'previous_datetime', to_char(NEW.previous_datetime, 'DD Mon YYYY at HH24:MI'),
        'new_datetime', to_char(NEW.new_datetime, 'DD Mon YYYY at HH24:MI'),
        'reason_public', NEW.modification_reason,
        'modification_id', NEW.id
      ))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'reschedule activity log failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_reschedule ON public.booking_datetime_modifications;
CREATE TRIGGER trg_log_business_reschedule
  AFTER INSERT ON public.booking_datetime_modifications
  FOR EACH ROW EXECUTE FUNCTION public.log_business_booking_reschedule();

-- ============================================================================
-- business_accounts: account lifecycle
--
-- A dozen admin write sites (single and bulk) drive this one column. One
-- trigger covers all of them and everything added later.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_account_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_action := CASE NEW.status
      WHEN 'active'    THEN CASE WHEN OLD.status = 'pending'
                              THEN 'account.approved' ELSE 'account.reactivated' END
      WHEN 'rejected'  THEN 'account.rejected'
      WHEN 'suspended' THEN 'account.suspended'
      WHEN 'inactive'  THEN 'account.suspended'
      ELSE NULL
    END;

    IF v_action IS NULL THEN
      RETURN NEW;
    END IF;

    PERFORM log_business_activity(
      p_business_account_id => NEW.id,
      p_action              => v_action,
      p_category            => 'account',
      p_actor_type          => 'admin',
      p_actor_name          => 'Platform admin',
      -- Suspension is the single highest value row in the whole log.
      p_severity            => 'critical',
      p_entity_type         => 'account',
      p_entity_id           => NEW.id,
      p_entity_label        => NEW.business_name,
      p_changes             => jsonb_build_object(
        'status', jsonb_build_object('from', OLD.status, 'to', NEW.status)
      ),
      p_metadata            => jsonb_build_object(
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'wallet_balance_at_change', NEW.wallet_balance
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'account status activity log failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_account_status ON public.business_accounts;
CREATE TRIGGER trg_log_business_account_status
  AFTER UPDATE OF status ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_business_account_status_change();

-- ============================================================================
-- business_accounts: settings, branding, domain, wallet controls
--
-- Column scoped on purpose. add_to_wallet and deduct_from_wallet write
-- wallet_balance and updated_at on every single booking; because neither column
-- is named in the UPDATE OF list, this trigger never fires for them.
--
-- The before/after diff is definitionally OLD vs NEW, which the trigger has for
-- free and which five separate routes would each have to hand-derive.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_business_account_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
-- Emits one row per logical group that actually changed, so "updated payment
-- settings" and "changed the portal colours" stay separate sentences rather
-- than collapsing into one vague "settings updated".
DECLARE
  a RECORD;
  v_changes jsonb;
BEGIN
  SELECT * INTO a FROM resolve_business_actor(NEW.id);

  -- Company profile ---------------------------------------------------------
  v_changes := '{}'::jsonb;
  IF NEW.business_name IS DISTINCT FROM OLD.business_name THEN
    v_changes := v_changes || jsonb_build_object('business_name',
      jsonb_build_object('from', OLD.business_name, 'to', NEW.business_name)); END IF;
  IF NEW.business_email IS DISTINCT FROM OLD.business_email THEN
    v_changes := v_changes || jsonb_build_object('business_email',
      jsonb_build_object('from', OLD.business_email, 'to', NEW.business_email)); END IF;
  IF NEW.business_phone IS DISTINCT FROM OLD.business_phone THEN
    v_changes := v_changes || jsonb_build_object('business_phone',
      jsonb_build_object('from', OLD.business_phone, 'to', NEW.business_phone)); END IF;
  IF NEW.contact_person_name IS DISTINCT FROM OLD.contact_person_name THEN
    v_changes := v_changes || jsonb_build_object('contact_person_name',
      jsonb_build_object('from', OLD.contact_person_name, 'to', NEW.contact_person_name)); END IF;
  IF NEW.address IS DISTINCT FROM OLD.address THEN
    v_changes := v_changes || jsonb_build_object('address',
      jsonb_build_object('from', OLD.address, 'to', NEW.address)); END IF;
  IF NEW.city IS DISTINCT FROM OLD.city THEN
    v_changes := v_changes || jsonb_build_object('city',
      jsonb_build_object('from', OLD.city, 'to', NEW.city)); END IF;
  IF NEW.country_code IS DISTINCT FROM OLD.country_code THEN
    v_changes := v_changes || jsonb_build_object('country_code',
      jsonb_build_object('from', OLD.country_code, 'to', NEW.country_code)); END IF;

  IF v_changes <> '{}'::jsonb THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.company_profile_updated',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'info', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_entity_label => NEW.business_name, p_changes => v_changes);
  END IF;

  -- Branding ----------------------------------------------------------------
  IF NEW.brand_name IS DISTINCT FROM OLD.brand_name THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.brand_name_changed',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'info', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_changes => jsonb_build_object('brand_name',
        jsonb_build_object('from', OLD.brand_name, 'to', NEW.brand_name)));
  END IF;

  IF NEW.theme_config IS DISTINCT FROM OLD.theme_config THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.theme_colors_changed',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'info', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_changes => jsonb_build_object('theme_config',
        jsonb_build_object('from', OLD.theme_config, 'to', NEW.theme_config)));
  END IF;

  -- Quotation prefix --------------------------------------------------------
  IF NEW.quotation_number_prefix IS DISTINCT FROM OLD.quotation_number_prefix THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.quotation_prefix_changed',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'important', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_changes => jsonb_build_object('quotation_number_prefix',
        jsonb_build_object('from', OLD.quotation_number_prefix, 'to', NEW.quotation_number_prefix)));
  END IF;

  -- Payment settings --------------------------------------------------------
  v_changes := '{}'::jsonb;
  IF NEW.preferred_currency IS DISTINCT FROM OLD.preferred_currency THEN
    v_changes := v_changes || jsonb_build_object('preferred_currency',
      jsonb_build_object('from', OLD.preferred_currency, 'to', NEW.preferred_currency)); END IF;
  IF NEW.payment_element_enabled IS DISTINCT FROM OLD.payment_element_enabled THEN
    v_changes := v_changes || jsonb_build_object('payment_element_enabled',
      jsonb_build_object('from', OLD.payment_element_enabled, 'to', NEW.payment_element_enabled)); END IF;
  IF NEW.save_payment_methods IS DISTINCT FROM OLD.save_payment_methods THEN
    v_changes := v_changes || jsonb_build_object('save_payment_methods',
      jsonb_build_object('from', OLD.save_payment_methods, 'to', NEW.save_payment_methods)); END IF;

  IF v_changes <> '{}'::jsonb THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.payment_settings_updated',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'important', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_changes => v_changes);
  END IF;

  -- Wallet alert preferences ------------------------------------------------
  IF NEW.notification_preferences IS DISTINCT FROM OLD.notification_preferences THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.wallet_alerts_updated',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'info', p_entity_type => 'setting', p_entity_id => NEW.id,
      p_changes => jsonb_build_object('notification_preferences',
        jsonb_build_object('from', OLD.notification_preferences, 'to', NEW.notification_preferences)));
  END IF;

  -- Domain ------------------------------------------------------------------
  IF NEW.custom_domain IS DISTINCT FROM OLD.custom_domain THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id,
      p_action => CASE WHEN NEW.custom_domain IS NULL
                    THEN 'settings.domain_removed' ELSE 'settings.domain_added' END,
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      p_severity => 'important', p_entity_type => 'domain', p_entity_id => NEW.id,
      p_entity_label => COALESCE(NEW.custom_domain, OLD.custom_domain),
      p_changes => jsonb_build_object('custom_domain',
        jsonb_build_object('from', OLD.custom_domain, 'to', NEW.custom_domain)),
      p_metadata => jsonb_strip_nulls(jsonb_build_object(
        'domain', COALESCE(NEW.custom_domain, OLD.custom_domain),
        'was_verified', OLD.custom_domain_verified)));
  END IF;

  IF NEW.subdomain IS DISTINCT FROM OLD.subdomain THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id, p_action => 'settings.subdomain_changed',
      p_category => 'settings', p_actor_type => a.actor_type, p_actor_name => a.actor_name,
      p_actor_auth_user_id => a.actor_auth_user_id,
      p_actor_business_user_id => a.actor_business_user_id, p_actor_role => a.actor_role,
      -- Every link using the old address stops working.
      p_severity => 'critical', p_entity_type => 'domain', p_entity_id => NEW.id,
      p_entity_label => NEW.subdomain,
      p_changes => jsonb_build_object('subdomain',
        jsonb_build_object('from', OLD.subdomain, 'to', NEW.subdomain)));
  END IF;

  -- Wallet freeze -----------------------------------------------------------
  IF NEW.wallet_frozen IS DISTINCT FROM OLD.wallet_frozen THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id,
      p_action => CASE WHEN NEW.wallet_frozen THEN 'wallet.frozen' ELSE 'wallet.unfrozen' END,
      p_category => 'wallet', p_actor_type => 'admin', p_actor_name => 'Platform admin',
      p_severity => 'critical', p_entity_type => 'wallet', p_entity_id => NEW.id,
      p_metadata => jsonb_strip_nulls(jsonb_build_object(
        'balance_at_freeze', NEW.wallet_balance,
        -- wallet_frozen_reason is written by an admin for the business, so it
        -- is safe to surface. Internal admin notes live elsewhere.
        'reason_public', NEW.wallet_frozen_reason)));
  END IF;

  -- Spending limits ---------------------------------------------------------
  v_changes := '{}'::jsonb;
  IF NEW.max_transaction_amount IS DISTINCT FROM OLD.max_transaction_amount THEN
    v_changes := v_changes || jsonb_build_object('max_transaction_amount',
      jsonb_build_object('from', OLD.max_transaction_amount, 'to', NEW.max_transaction_amount)); END IF;
  IF NEW.max_daily_spend IS DISTINCT FROM OLD.max_daily_spend THEN
    v_changes := v_changes || jsonb_build_object('max_daily_spend',
      jsonb_build_object('from', OLD.max_daily_spend, 'to', NEW.max_daily_spend)); END IF;
  IF NEW.max_monthly_spend IS DISTINCT FROM OLD.max_monthly_spend THEN
    v_changes := v_changes || jsonb_build_object('max_monthly_spend',
      jsonb_build_object('from', OLD.max_monthly_spend, 'to', NEW.max_monthly_spend)); END IF;
  IF NEW.spending_limits_enabled IS DISTINCT FROM OLD.spending_limits_enabled THEN
    v_changes := v_changes || jsonb_build_object('spending_limits_enabled',
      jsonb_build_object('from', OLD.spending_limits_enabled, 'to', NEW.spending_limits_enabled)); END IF;

  IF v_changes <> '{}'::jsonb THEN
    PERFORM log_business_activity(
      p_business_account_id => NEW.id,
      p_action => CASE WHEN COALESCE(NEW.spending_limits_enabled, false)
                    THEN 'wallet.spending_limit_set' ELSE 'wallet.spending_limit_removed' END,
      p_category => 'wallet', p_actor_type => 'admin', p_actor_name => 'Platform admin',
      p_severity => 'important', p_entity_type => 'wallet', p_entity_id => NEW.id,
      p_changes => v_changes);
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'account settings activity log failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_business_account_settings ON public.business_accounts;
CREATE TRIGGER trg_log_business_account_settings
  AFTER UPDATE OF
    business_name, business_email, business_phone, contact_person_name,
    address, city, country_code,
    brand_name, theme_config, quotation_number_prefix,
    preferred_currency, payment_element_enabled, save_payment_methods,
    notification_preferences,
    custom_domain, subdomain,
    wallet_frozen, max_transaction_amount, max_daily_spend, max_monthly_spend,
    spending_limits_enabled
  ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_business_account_settings_change();
