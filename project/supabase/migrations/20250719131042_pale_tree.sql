/*
# Fasal Rakshak Database Schema

## Overview
This migration creates the complete database schema for the Fasal Rakshak (Crop Protector) parametric crop insurance platform.

## Tables Created
1. **profiles** - User profile data with language preferences and gamification progress
2. **policies** - Crop insurance policy records with coverage details
3. **claims** - Automated claim records linked to blockchain transactions
4. **education_progress** - Quiz completion tracking for farmer education

## Security
- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Authenticated access required for all operations

## Features
- Multi-language support (Hindi, Marathi, English)
- Gamification with coins system
- Policy lifecycle management
- Automated claim processing with blockchain integration
- Educational progress tracking
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  preferred_language text NOT NULL DEFAULT 'hi' CHECK (preferred_language IN ('hi', 'mr', 'en')),
  coins_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  state text NOT NULL,
  district text NOT NULL,
  crop text NOT NULL,
  premium_amount integer NOT NULL,
  coverage_amount integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed')),
  created_at timestamptz DEFAULT now()
);

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trigger_event text NOT NULL,
  trigger_date date NOT NULL,
  payout_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered', 'processing', 'completed')),
  blockchain_tx_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create education_progress table
CREATE TABLE IF NOT EXISTS education_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  is_correct boolean NOT NULL,
  coins_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for policies
CREATE POLICY "Users can read own policies"
  ON policies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policies"
  ON policies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own policies"
  ON policies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for claims
CREATE POLICY "Users can read own claims"
  ON claims
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims"
  ON claims
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for education_progress
CREATE POLICY "Users can read own education progress"
  ON education_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress"
  ON education_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_user_id ON education_progress(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();