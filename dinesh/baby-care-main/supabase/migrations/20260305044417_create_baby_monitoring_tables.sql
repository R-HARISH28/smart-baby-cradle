/*
  # Baby Monitoring System Database Schema

  1. New Tables
    - `cry_events`
      - `id` (uuid, primary key)
      - `detected_at` (timestamptz) - When the crying was detected
      - `duration` (integer) - Duration in seconds (nullable, can be updated later)
      - `intensity` (integer) - Sound intensity level (0-100)
      - `status` (text) - Status: 'crying', 'noise_detected', 'sleeping'
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `system_status`
      - `id` (uuid, primary key)
      - `current_status` (text) - Current baby status: 'sleeping', 'crying', 'noise_detected'
      - `last_cry_detected` (timestamptz) - Timestamp of last cry detection
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all data
    - Add policies for API access to insert cry events
    - Add policies to update system status
*/

-- Create cry_events table
CREATE TABLE IF NOT EXISTS cry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz DEFAULT now(),
  duration integer DEFAULT 0,
  intensity integer NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
  status text NOT NULL CHECK (status IN ('crying', 'noise_detected', 'sleeping')),
  created_at timestamptz DEFAULT now()
);

-- Create system_status table
CREATE TABLE IF NOT EXISTS system_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_status text NOT NULL DEFAULT 'sleeping' CHECK (current_status IN ('sleeping', 'crying', 'noise_detected')),
  last_cry_detected timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial system status if not exists
INSERT INTO system_status (current_status)
SELECT 'sleeping'
WHERE NOT EXISTS (SELECT 1 FROM system_status);

-- Enable Row Level Security
ALTER TABLE cry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;

-- Policies for cry_events table
CREATE POLICY "Allow public read access to cry events"
  ON cry_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert of cry events"
  ON cry_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policies for system_status table
CREATE POLICY "Allow public read access to system status"
  ON system_status
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update of system status"
  ON system_status
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cry_events_detected_at ON cry_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_cry_events_status ON cry_events(status);