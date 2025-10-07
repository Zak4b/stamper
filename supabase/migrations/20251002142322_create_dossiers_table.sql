/*
  # Create dossiers table for PDF stamping

  1. New Tables
    - `dossiers`
      - `id` (uuid, primary key)
      - `numero_dossier` (text, unique) - Unique folder number
      - `valeur_tampon` (text) - Stamp value to apply to PDF
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on `dossiers` table
    - Add policy for authenticated users to read all dossiers
    - Add policy for authenticated users to insert new dossiers
    - Add policy for authenticated users to update dossiers
    - Add policy for authenticated users to delete dossiers
  
  3. Notes
    - The `numero_dossier` is unique to prevent duplicates
    - The `valeur_tampon` contains the text that will be stamped on the PDF
*/

CREATE TABLE IF NOT EXISTS dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_dossier text UNIQUE NOT NULL,
  valeur_tampon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all dossiers"
  ON dossiers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert dossiers"
  ON dossiers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update dossiers"
  ON dossiers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete dossiers"
  ON dossiers
  FOR DELETE
  TO authenticated
  USING (true);