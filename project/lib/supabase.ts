import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Use placeholder values that won't cause network errors
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'fasal-rakshak-app',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          preferred_language: 'hi' | 'mr' | 'en';
          coins_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          preferred_language: 'hi' | 'mr' | 'en';
          coins_earned?: number;
        };
        Update: {
          full_name?: string;
          preferred_language?: 'hi' | 'mr' | 'en';
          coins_earned?: number;
          updated_at?: string;
        };
      };
      policies: {
        Row: {
          id: string;
          user_id: string;
          state: string;
          district: string;
          crop: string;
          premium_amount: number;
          coverage_amount: number;
          start_date: string;
          end_date: string;
          status: 'active' | 'expired' | 'claimed';
          created_at: string;
        };
        Insert: {
          user_id: string;
          state: string;
          district: string;
          crop: string;
          premium_amount: number;
          coverage_amount: number;
          start_date: string;
          end_date: string;
          status?: 'active';
        };
        Update: {
          status?: 'active' | 'expired' | 'claimed';
        };
      };
      claims: {
        Row: {
          id: string;
          policy_id: string;
          user_id: string;
          trigger_event: string;
          trigger_date: string;
          payout_amount: number;
          status: 'triggered' | 'processing' | 'completed';
          blockchain_tx_hash?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          policy_id: string;
          user_id: string;
          trigger_event: string;
          trigger_date: string;
          payout_amount: number;
          status?: 'triggered';
          blockchain_tx_hash?: string;
        };
        Update: {
          status?: 'triggered' | 'processing' | 'completed';
          blockchain_tx_hash?: string;
          updated_at?: string;
        };
      };
      education_progress: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          is_correct: boolean;
          coins_earned: number;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          question_id: string;
          is_correct: boolean;
          coins_earned: number;
        };
      };
    };
  };
};