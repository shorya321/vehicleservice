-- Normalize stored phone numbers and clear values that are not phone numbers.
--
-- Context: the customer registration forms accepted any text in the phone
-- field and capped it at 20 characters, so a browser-autofilled email address
-- was stored as e.g. 'anshul@fanaticcoders'. That value surfaced in the
-- "Customer Contact" box of the driver booking-assignment email.
--
-- A value is kept only if it normalizes to a plausible phone number:
--   * international: '+' then 8-15 digits, no leading zero
--   * national:      optional trunk zero, then 7-15 digits
-- Everything else (an email, free text, an empty string) becomes NULL.
-- This mirrors PHONE_REGEX / normalizePhone in lib/validation/phone.ts.

create or replace function pg_temp.normalize_phone(raw text)
returns text
language sql
immutable
as $$
  select case
    when raw is null then null
    when btrim(raw) like '+%' then nullif('+' || regexp_replace(raw, '\D', '', 'g'), '+')
    else nullif(regexp_replace(raw, '\D', '', 'g'), '')
  end;
$$;

create or replace function pg_temp.clean_phone(raw text)
returns text
language sql
immutable
as $$
  select case
    when pg_temp.normalize_phone(raw) ~ '^(\+[1-9][0-9]{7,14}|0?[1-9][0-9]{6,14})$'
      then pg_temp.normalize_phone(raw)
    else null
  end;
$$;

update public.profiles
   set phone = pg_temp.clean_phone(phone)
 where phone is not null
   and phone is distinct from pg_temp.clean_phone(phone);

update public.booking_passengers
   set phone = pg_temp.clean_phone(phone)
 where phone is not null
   and phone is distinct from pg_temp.clean_phone(phone);

-- Signup metadata reseeds profiles.phone on the checkout page, so it has to be
-- cleaned too. Drop the key entirely when the value is not a phone number.
update auth.users
   set raw_user_meta_data = case
         when pg_temp.clean_phone(raw_user_meta_data->>'phone') is null
           then raw_user_meta_data - 'phone'
         else jsonb_set(
                raw_user_meta_data,
                '{phone}',
                to_jsonb(pg_temp.clean_phone(raw_user_meta_data->>'phone'))
              )
       end
 where raw_user_meta_data->>'phone' is not null
   and raw_user_meta_data->>'phone'
       is distinct from pg_temp.clean_phone(raw_user_meta_data->>'phone');
