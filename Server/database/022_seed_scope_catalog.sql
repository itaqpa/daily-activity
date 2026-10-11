-- Migration: Seed Katalog Scope of Work (Public / Default Catalog)
-- Tabel: scope_catalog

INSERT INTO scope_catalog (project_id, nama, urutan)
SELECT val.project_id, val.nama, val.urutan
FROM (
  VALUES
    (NULL::INTEGER, 'Mobilisasi Alat & Material', 1),
    (NULL::INTEGER, 'Marking & Layout', 2),
    (NULL::INTEGER, 'Fabrikasi Support / Bracket', 3),
    (NULL::INTEGER, 'Instalasi Metal Expansion Joint', 4),
    (NULL::INTEGER, 'Pengelasan (Welding)', 5),
    (NULL::INTEGER, 'Pemasangan Anchor / Bolting', 6),
    (NULL::INTEGER, 'Alignment & Leveling', 7),
    (NULL::INTEGER, 'Pressure / Leak Test', 8),
    (NULL::INTEGER, 'Painting & Coating', 9),
    (NULL::INTEGER, 'Inspection & Final Check', 10),
    (NULL::INTEGER, 'Cleaning & Demobilisasi', 11)
) AS val(project_id, nama, urutan)
WHERE NOT EXISTS (
  SELECT 1 FROM scope_catalog s 
  WHERE s.nama = val.nama AND s.project_id IS NULL
);
