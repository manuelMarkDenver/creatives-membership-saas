import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const signInWithProvider = async (provider: 'google' | 'github') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    }
  })
  return { data, error }
}

export const signIn = async ({ email, password }: { email: string; password: string }) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log('🔗 Signing in to:', `${backendUrl}/auth/login`);
    
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response text first to debug JSON parsing issues
    const responseText = await response.text();
    console.log('📡 Response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Response was:', responseText);
      return { data: null, error: new Error('Invalid JSON response from server') };
    }

    if (!response.ok) {
      return { data: null, error: new Error(result.message || 'Login failed') };
    }

    // Store token and user data in localStorage
    if (result.success && result.data) {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user_data', JSON.stringify(result.data.user));
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('❌ Network Error:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Network error') };
  }
}

export const signOut = async () => {
  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  
  // Also attempt Supabase signout for OAuth users
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export const getUser = async () => {
  // First try to get user from localStorage (for email/password users)
  const storedUser = localStorage.getItem('user_data');
  const storedToken = localStorage.getItem('auth_token');
  
  if (storedUser && storedToken) {
    try {
      const userData = JSON.parse(storedUser);
      return { user: userData, error: null };
    } catch (error) {
      // If parsing fails, fall back to Supabase
    }
  }
  
  // Fall back to Supabase for OAuth users
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}
