-- Scope write access to the `vehicles` storage bucket.
--
-- Before this migration the three write policies were:
--   INSERT / UPDATE / DELETE  ...  USING (bucket_id = 'vehicles')
-- and nothing more, so ANY authenticated user -- any customer, any rival
-- vendor -- could overwrite or delete any vendor's vehicle images.
--
-- ============================================================================
-- DO NOT APPLY BEFORE COMMIT 4eb1c45 IS LIVE IN PRODUCTION.
--
-- The previous code uploaded vendor images through the *user's* client to
--   vehicles/{businessId}/{vehicleId}/primary-<ts>.jpeg
-- For that path (storage.foldername(name))[1] is the literal string
-- 'vehicles', not a vendor id, so the predicate below DENIES the insert.
-- That code also swallowed upload failures (console.error, then continue),
-- so vendors would keep "successfully" creating vehicles with no image.
--
-- After 4eb1c45 the browser uploads to `{businessId}/{uuid}.jpg`, which the
-- predicate accepts.
-- ============================================================================
--
-- Notes on the predicate:
--
--  * The vendor clause matches the folder against vendor_applications.id,
--    which is what vehicles.business_id references (NOT business_profiles).
--    `authenticated` already holds SELECT on vendor_applications, so the
--    subquery resolves under RLS.
--
--  * The admin clause is required, not defensive: the admin vehicle form
--    uploads into a *vendor's* {businessId}/ folder on that vendor's behalf.
--
--  * DELETE keeps the vendor clause rather than becoming admin-only. The
--    upload-rollback path `deleteVehicleImage` (lib/vehicles/image-upload.ts)
--    runs in the browser under the anon client, from both vehicle-form.tsx
--    and admin-vehicle-form.tsx. Admin-only DELETE would silently break that
--    rollback and reintroduce orphaned storage objects.
--
--  * Server-side deletes (`removeVehicleImage` in both actions.ts) use the
--    service-role client and bypass RLS, so legacy objects still sitting
--    under the doubled `vehicles/vehicles/...` prefix remain deletable.
--
--  * The public SELECT policy is intentionally left untouched: the bucket is
--    public and thumbnails are served straight from it.

DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle images" ON storage.objects;

CREATE POLICY "Vendors and admins can upload vehicle images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicles'
    AND (
      EXISTS (
        SELECT 1 FROM public.vendor_applications va
        WHERE va.id::text = (storage.foldername(name))[1]
          AND va.user_id = auth.uid()
          AND va.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Vendors and admins can update vehicle images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND (
      EXISTS (
        SELECT 1 FROM public.vendor_applications va
        WHERE va.id::text = (storage.foldername(name))[1]
          AND va.user_id = auth.uid()
          AND va.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'vehicles'
    AND (
      EXISTS (
        SELECT 1 FROM public.vendor_applications va
        WHERE va.id::text = (storage.foldername(name))[1]
          AND va.user_id = auth.uid()
          AND va.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "Vendors and admins can delete vehicle images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND (
      EXISTS (
        SELECT 1 FROM public.vendor_applications va
        WHERE va.id::text = (storage.foldername(name))[1]
          AND va.user_id = auth.uid()
          AND va.status = 'approved'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
  );
