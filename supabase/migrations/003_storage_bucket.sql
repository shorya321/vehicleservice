-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'user-uploads', 
  'user-uploads', 
  true, 
  false,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  5242880 -- 5MB
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  file_size_limit = 5242880;

-- Create storage policies for the bucket
CREATE POLICY "Admin users can upload avatar images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can update avatar images" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'user-uploads' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete avatar images" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'user-uploads' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public users can view avatar images" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
  );