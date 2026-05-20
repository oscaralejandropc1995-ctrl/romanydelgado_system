-- Enable UUID extension if not enabled yet
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert appointments (since it's a public form)
CREATE POLICY "Allow public inserts" ON appointments
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users (e.g. admins) to view all appointments
CREATE POLICY "Allow authenticated selects" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');
