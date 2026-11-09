-- Public task board policies for the `task-backgrounds` bucket.
-- The app stores objects at backgrounds/<uuid>.<jpg|png|webp|gif>.
-- Public reads are provided by the bucket's public setting; policies below
-- allow anonymous clients to create and delete objects in that namespace.

CREATE POLICY "Public can upload task backgrounds"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'task-backgrounds'
  AND LOWER((storage.foldername(name))[1]) = 'backgrounds'
  AND storage.extension(name) IN ('jpg', 'png', 'webp', 'gif')
);

CREATE POLICY "Public can delete task backgrounds"
ON storage.objects
FOR DELETE
TO anon
USING (
  bucket_id = 'task-backgrounds'
  AND LOWER((storage.foldername(name))[1]) = 'backgrounds'
  AND storage.extension(name) IN ('jpg', 'png', 'webp', 'gif')
);
