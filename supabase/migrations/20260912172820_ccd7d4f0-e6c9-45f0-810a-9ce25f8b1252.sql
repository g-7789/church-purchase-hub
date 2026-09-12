CREATE POLICY "anexos_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'anexos');
CREATE POLICY "anexos_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'anexos');
CREATE POLICY "anexos_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'anexos' AND owner = auth.uid());