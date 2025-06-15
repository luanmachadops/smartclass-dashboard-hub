
-- Create bucket for student photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('alunos-fotos', 'alunos-fotos', true);

-- Create policy to allow users to upload student photos
CREATE POLICY "Users can upload student photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'alunos-fotos');

-- Create policy to allow users to view student photos
CREATE POLICY "Users can view student photos" ON storage.objects
FOR SELECT USING (bucket_id = 'alunos-fotos');

-- Create policy to allow users to update student photos
CREATE POLICY "Users can update student photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'alunos-fotos');

-- Create policy to allow users to delete student photos
CREATE POLICY "Users can delete student photos" ON storage.objects
FOR DELETE USING (bucket_id = 'alunos-fotos');
