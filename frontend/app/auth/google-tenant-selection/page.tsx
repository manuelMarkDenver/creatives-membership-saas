"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api/client";

interface GoogleUser {
  google_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

function GoogleTenantSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Get Google user data from URL params
  const googleUser: GoogleUser | null = (() => {
    try {
      const googleId = searchParams.get('google_id');
      const email = searchParams.get('email');
      const firstName = searchParams.get('first_name');
      const lastName = searchParams.get('last_name');

      if (googleId && email && firstName && lastName) {
        return {
          google_id: googleId,
          email,
          first_name: firstName,
          last_name: lastName,
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  })();

  // Fetch available tenants for selection
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['public-tenants'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/public/list`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const result = await response.json();
      return result;
    },
    enabled: !!googleUser,
  });

  useEffect(() => {
    if (!googleUser) {
      // Invalid or missing Google user data
      router.push('/auth/login');
    }
  }, [googleUser, router]);

  const handleCreateAccount = async () => {
    if (!googleUser || !selectedTenantId) {
      setError('Please select a business to join');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.createGoogleUser({
        googleId: googleUser.google_id,
        email: googleUser.email,
        firstName: googleUser.first_name,
        lastName: googleUser.last_name,
        tenantId: selectedTenantId,
      });

      if (result.success && result.data?.token) {
        // Redirect to success page for proper auth data storage and LOGIN event logging

        // Redirect to success page with token for proper setup
        const params = new URLSearchParams({
          token: result.data.token,
          user_id: result.data.user.id,
          email: result.data.user.email,
        });
        router.push(`/auth/success?${params.toString()}`);
      } else {
        throw new Error('Failed to create account');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!googleUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to GymBossLab!</CardTitle>
          <CardDescription>
            Hi {googleUser.first_name}! We found your Google account but need to know which business you'd like to join.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {googleUser.first_name[0]}{googleUser.last_name[0]}
                </span>
              </div>
              <div>
                <p className="font-medium">{googleUser.first_name} {googleUser.last_name}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{googleUser.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select your business</label>
            {tenantsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">Loading businesses...</span>
              </div>
            ) : (
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a business to join" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.data?.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you don't see your business, contact your administrator to get invited.
            </p>
          </div>

          <Button
            onClick={handleCreateAccount}
            disabled={loading || !selectedTenantId || tenantsLoading}
            className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Join Business'
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleTenantSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto" />
              <h2 className="text-xl font-semibold">Loading...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Preparing tenant selection...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <GoogleTenantSelectionContent />
    </Suspense>
  );
}