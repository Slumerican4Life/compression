import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionEnd: string | null;
  isTrial: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  setupTwoFactor: () => Promise<{ secret: string; qrCode: string }>;
  enableTwoFactor: (token: string, secret: string) => Promise<{ error: any }>;
  verifyTwoFactor: (token: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setSubscribed(data.subscribed || false);
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionEnd(data.subscription_end || null);
        setIsTrial(data.is_trial || false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check subscription when user logs in
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
          }, 0);
        } else {
          setSubscribed(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setIsTrial(false);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: displayName ? { display_name: displayName } : {}
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const setupTwoFactor = async () => {
    const { data, error } = await supabase.functions.invoke('setup-2fa');
    if (error) throw error;
    return data;
  };

  const enableTwoFactor = async (token: string, secret: string) => {
    const { error } = await supabase.functions.invoke('enable-2fa', {
      body: { token, secret }
    });
    return { error };
  };

  const verifyTwoFactor = async (token: string) => {
    const { error } = await supabase.functions.invoke('verify-2fa', {
      body: { token }
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      isTrial,
      signUp,
      signIn,
      signOut,
      checkSubscription,
      setupTwoFactor,
      enableTwoFactor,
      verifyTwoFactor,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};