-- Report Types
INSERT INTO report_types (id, name) VALUES
(1, 'Water'),
(2, 'Air');

-- Report Drafts
INSERT INTO report_drafts (id, name) VALUES
(1, 'Ispitivanje okna'), -- Shaft only
(2, 'Ispitivanje cjevovoda'), -- Pipes only
(3, 'Ispitivanje cjevovoda i okna'), -- Shaft + Pipes
(4, 'Ispitivanje okna (bez cjevovoda)'); -- Shaft only (variant)

-- Examination Procedures
-- Based on Legacy Calculations (Method 1060)
INSERT INTO examination_procedures (id, name, allowed_loss, pressure) VALUES
(1, 'Metoda "LA"', 10.0, 10), -- Example pressure/loss, verify with standard
(2, 'Metoda "LB"', 2.0, 50),
(3, 'Metoda "LC"', 1.5, 100),
(4, 'Metoda "LD"', 1.0, 200);

-- Material Types
INSERT INTO material_types (id, name) VALUES
(1, 'Okruglo'), -- Round
(2, 'Pravokutno'); -- Rectangular

-- Materials (Example Seed)
INSERT INTO materials (material_type_id, name) VALUES
(1, 'Beton'),
(1, 'PVC'),
(1, 'Poliester'),
(2, 'Beton'),
(2, 'Cigla');

-- Storage Setup Instructions (Manual Step)
-- 1. Create a public bucket named 'templates'
-- 2. Upload 'method1610.docx' to this bucket
