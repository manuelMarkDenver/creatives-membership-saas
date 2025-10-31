"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { userKeys } from "@/lib/hooks/use-gym-users";
import { useTenantContext } from "@/lib/providers/tenant-context";
import { authApi } from "@/lib/api/client";
import { type BusinessCategory } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCurrentTenant } = useTenantContext();
  const [activeTab, setActiveTab] = useState("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    category: "GYM" as BusinessCategory,
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhoneNumber: "",
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Load saved credentials on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    const savedRemember = localStorage.getItem("remember_me") === "true";

    if (savedEmail && savedRemember) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      const result = await authApi.login(loginEmail, loginPassword);

      if (result.success && result.data.user && result.data.token) {
        localStorage.setItem("auth_token", result.data.token);
        localStorage.setItem("user_data", JSON.stringify(result.data.user));

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("remember_email", loginEmail);
          localStorage.setItem("remember_me", "true");
        } else {
          localStorage.removeItem("remember_email");
          localStorage.removeItem("remember_me");
        }

        if (result.data.user.tenant) {
          setCurrentTenant(result.data.user.tenant);
        } else if (result.data.user.tenantId) {
          const basicTenant = {
            id: result.data.user.tenantId,
            name: "Unknown Tenant",
            category: "GYM" as BusinessCategory,
            slug: "unknown-tenant",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCurrentTenant(basicTenant);
        }

        queryClient.removeQueries({ queryKey: userKeys.profile() });
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });

        router.push("/dashboard");
      }
    } catch (err: any) {
      setLoginError(
        err.response?.data?.message || err.message || "Login failed"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");

    try {
      const result = await authApi.registerTenant(signupData);

      if (result.success) {
        setSignupSuccess(true);
      }
    } catch (err: any) {
      setSignupError(
        err.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gym Image */}
      <div className="hidden 2xl:flex 2xl:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2075&auto=format&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 via-purple-600/30 to-slate-900/60" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/gymbosslab-logo.jpeg"
                alt="GymBossLab Logo"
                className="w-12 h-12 rounded-xl shadow-xl object-cover"
              />
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                GymBossLab
              </h2>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight break-words text-white drop-shadow-lg">
                Elevate Your
                <br />
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                  Gym Business
                </span>
              </h1>
              <p
                className="text-lg xl:text-xl text-white font-medium break-words"
                style={{
                  textShadow:
                    "2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                Complete management solution for Filipino gyms and fitness
                centers.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 xl:gap-3">
              <div className="px-3 xl:px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 text-xs xl:text-sm font-semibold whitespace-nowrap text-white drop-shadow-md">
                💪 Member Management
              </div>
              <div className="px-3 xl:px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 text-xs xl:text-sm font-semibold whitespace-nowrap text-white drop-shadow-md">
                📊 Analytics Dashboard
              </div>
              <div className="px-3 xl:px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/40 text-xs xl:text-sm font-semibold whitespace-nowrap text-white drop-shadow-md">
                💳 Payment Tracking
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 xl:gap-8 max-w-lg">
            <div>
              <div className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                100+
              </div>
              <div className="text-xs xl:text-sm text-white font-medium drop-shadow-md break-words">
                Active Gyms
              </div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                5K+
              </div>
              <div className="text-xs xl:text-sm text-white font-medium drop-shadow-md break-words">
                Happy Members
              </div>
            </div>
            <div>
              <div className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                99%
              </div>
              <div className="text-xs xl:text-sm text-white font-medium drop-shadow-md">
                Uptime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full 2xl:w-1/2 flex items-center justify-center p-4 sm:p-6 xl:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 xl:space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {/* Mobile Logo */}
          <div className="2xl:hidden text-center mb-2">
            <img
              src="/gymbosslab-logo.jpeg"
              alt="GymBossLab Logo"
              className="mx-auto w-14 h-14 rounded-2xl shadow-xl object-cover mb-3"
            />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              GymBossLab
            </h1>
          </div>

          {/* Tabbed Card */}
          <Card className="border-2 shadow-xl bg-white dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="space-y-1 pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {activeTab === "login"
                  ? "Welcome Back"
                  : "Run Your Gym Smarter"}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                {activeTab === "login"
                  ? "Sign in to access your business dashboard"
                  : "Simplify operations, boost retention, and get real-time insights - — all from one smart dashboard."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-4 sm:pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <Alert
                        variant="destructive"
                        className="border-red-200 bg-red-50"
                      >
                        <AlertDescription className="text-red-800">
                          {loginError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email address</Label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={loginLoading}
                        className="h-12 bg-white dark:bg-white dark:text-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={loginLoading}
                          className="h-12 bg-white dark:bg-white dark:text-gray-900 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  {signupSuccess ? (
                    <div className="text-center space-y-4 py-6">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Check Your Email! 📧
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        We've sent a verification link to{" "}
                        <strong>{signupData.ownerEmail}</strong>
                      </p>
                      <p className="text-sm text-gray-500">
                        Click the link in the email to activate your account.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("login")}
                        className="mt-4"
                      >
                        Back to Login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                      {signupError && (
                        <Alert
                          variant="destructive"
                          className="border-red-200 bg-red-50"
                        >
                          <AlertDescription className="text-red-800">
                            {signupError}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name *</Label>
                        <Input
                          id="business-name"
                          required
                          value={signupData.name}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              name: e.target.value,
                            })
                          }
                          placeholder="FitZone Gym"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Business Category *</Label>
                        <Select
                          value={signupData.category}
                          onValueChange={(val) =>
                            setSignupData({
                              ...signupData,
                              category: val as BusinessCategory,
                            })
                          }
                          disabled
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GYM">Gym & Fitness</SelectItem>
                            <SelectItem value="COFFEE_SHOP" disabled>
                              Coffee Shop
                            </SelectItem>
                            <SelectItem value="ECOMMERCE" disabled>
                              E-commerce
                            </SelectItem>
                            <SelectItem value="OTHER" disabled>
                              Other
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Currently only available for gyms and fitness centers
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">First Name *</Label>
                          <Input
                            id="first-name"
                            required
                            value={signupData.ownerFirstName}
                            onChange={(e) =>
                              setSignupData({
                                ...signupData,
                                ownerFirstName: e.target.value,
                              })
                            }
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">Last Name *</Label>
                          <Input
                            id="last-name"
                            required
                            value={signupData.ownerLastName}
                            onChange={(e) =>
                              setSignupData({
                                ...signupData,
                                ownerLastName: e.target.value,
                              })
                            }
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email Address *</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          value={signupData.ownerEmail}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              ownerEmail: e.target.value,
                            })
                          }
                          placeholder="john@fitzonegym.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={signupData.ownerPhoneNumber}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              ownerPhoneNumber: e.target.value,
                            })
                          }
                          placeholder="+63 912 345 6789"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500"
                        disabled={signupLoading}
                      >
                        {signupLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "START FREE"
                        )}
                      </Button>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ⚡ No credit card needed — start managing your gym today.
                      </p>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm">
            <p>© 2025 GymBossLab. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
