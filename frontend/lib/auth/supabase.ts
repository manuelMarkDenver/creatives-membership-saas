import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only initialize Supabase if environment variables are available
let supabaseClient: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true
    }
  })
} else {
  console.warn('Supabase environment variables not found - OAuth login will not be available')
}

export { supabaseClient as supabase }

// Auth helper functions
export const signInWithProvider = async (provider: 'google' | 'github') => {
  if (!supabaseClient) {
    return { data: null, error: new Error('Supabase not initialized - missing environment variables') }
  }
  
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
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
  
  // Also attempt Supabase signout for OAuth users (if available)
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut()
    return { error }
  }
  
  return { error: null }
}

export const getSession = async () => {
  if (!supabaseClient) {
    return { session: null, error: new Error('Supabase not initialized') }
  }
  
  const { data: { session }, error } = await supabaseClient.auth.getSession()
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
  
  // Fall back to Supabase for OAuth users (if available)
  if (supabaseClient) {
    const { data: { user }, error } = await supabaseClient.auth.getUser()
    return { user, error }
  }
  
  return { user: null, error: new Error('No authentication method available') }
}
