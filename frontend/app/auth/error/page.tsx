"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string>('Authentication failed');

  useEffect(() => {
    const errorMessage = searchParams.get('message');
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Authentication Error
          </CardTitle>
          <CardDescription className="text-center">
            We encountered an issue while signing you in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              {error}
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>If this problem persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}