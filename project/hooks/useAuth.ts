import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Auth session error:', error.message);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.warn('Auth connection error:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
    } catch (error) {
      console.warn('Sign in error:', error);
      return { data: null, error: { message: 'Connection failed. Please check your internet connection.' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, language: string) => {
    try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user && !error) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          email,
          preferred_language: language,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return { data, error };
    } catch (error) {
      console.warn('Sign up error:', error);
      return { data: null, error: { message: 'Connection failed. Please check your internet connection.' } };
    }
  };

  const signOut = async () => {
    try {
    const { error } = await supabase.auth.signOut();
    return { error };
    } catch (error) {
      console.warn('Sign out error:', error);
      return { error: { message: 'Connection failed' } };
    }
  };

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}