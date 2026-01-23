-- Migration: Create scheme_images table for PDF scheme management
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create the table
CREATE TABLE IF NOT EXISTS scheme_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_number INTEGER NOT NULL UNIQUE CHECK (scheme_number BETWEEN 1 AND 10),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_by_name VARCHAR(255)
);

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scheme_images_number ON scheme_images(scheme_number);

-- 3. Enable Row Level Security
ALTER TABLE scheme_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can view scheme images
DROP POLICY IF EXISTS "Anyone can view scheme_images" ON scheme_images;
CREATE POLICY "Anyone can view scheme_images" ON scheme_images
    FOR SELECT USING (true);

-- Only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can modify scheme_images" ON scheme_images;
CREATE POLICY "Admins can modify scheme_images" ON scheme_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Seed data for 10 schemes
INSERT INTO scheme_images (scheme_number, name, description) VALUES
(1, 'Shema A - Ispitivanje okna', 'Shema za ispitivanje vodopropusnosti okna'),
(2, 'Shema C - Ispitivanje cijelovoda', 'Shema za ispitivanje cjelovitog voda'),
(3, 'Shema B - Ispitivanje okna i cijelovoda', 'Kombinirana shema za okno i cijelovod'),
(4, 'Shema D - Ispitivanje slivnika', 'Shema za ispitivanje slivnika'),
(5, 'Shema E - Ispitivanje slivnika i cijelovoda', 'Kombinirana shema za slivnik i cijelovod'),
(6, 'Shema 6', 'Dodatna shema 6'),
(7, 'Shema 7', 'Dodatna shema 7'),
(8, 'Shema 8', 'Dodatna shema 8'),
(9, 'Shema 9', 'Dodatna shema 9'),
(10, 'Shema 10', 'Dodatna shema 10')
ON CONFLICT (scheme_number) DO NOTHING;

-- 6. Create storage bucket for scheme images (run separately in Storage settings)
-- Bucket name: scheme-images
-- Public: true
-- Allowed MIME types: image/png, image/jpeg, image/webp
-- Max file size: 5MB

-- Storage policies (run in SQL Editor after creating bucket):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scheme-images', 'scheme-images', true);

-- Allow public read access
-- CREATE POLICY "Public read access for scheme-images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'scheme-images');

-- Allow admin upload/delete
-- CREATE POLICY "Admin upload for scheme-images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'scheme-images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- );

-- CREATE POLICY "Admin delete for scheme-images"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'scheme-images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- );
