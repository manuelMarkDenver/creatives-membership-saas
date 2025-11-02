"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useTenantContext } from "@/lib/providers/tenant-context";
import { userKeys } from "@/lib/hooks/use-gym-users";
import { type BusinessCategory } from "@/types";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setCurrentTenant } = useTenantContext();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        const token = searchParams.get('token');
        const userId = searchParams.get('user_id');
        const email = searchParams.get('email');

        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Store auth data
        localStorage.setItem('auth_token', token);

        // For OAuth users, we need to fetch the full user data
        // The token should be valid for getting user info
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to get user information');
        }

        const userData = await response.json();

        if (userData.success && userData.user) {
          localStorage.setItem('user_data', JSON.stringify(userData.user));

          // Set tenant context
          if (userData.user.tenant) {
            setCurrentTenant(userData.user.tenant);
          } else if (userData.user.tenantId) {
            // Create basic tenant object if only ID is available
            const basicTenant = {
              id: userData.user.tenantId,
              name: "Your Business",
              category: "GYM" as BusinessCategory,
              slug: "your-business",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setCurrentTenant(basicTenant);
          }

          // Clear and invalidate queries
          queryClient.removeQueries({ queryKey: userKeys.profile() });
          queryClient.invalidateQueries({ queryKey: userKeys.profile() });

          setStatus('success');

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          throw new Error('Invalid user data received');
        }
      } catch (err: any) {
        console.error('Auth success error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthSuccess();
  }, [searchParams, queryClient, setCurrentTenant, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto" />
              <h2 className="text-xl font-semibold">Completing sign in...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Setting up your account and redirecting to dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Sign in failed</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600">Welcome!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Successfully signed in with Google. Redirecting to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto" />
              <h2 className="text-xl font-semibold">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}