"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/validations/auth";

type AuthMode = "login" | "register" | "forgot" | "reset";

interface AuthFormProps {
  mode: AuthMode;
  resetToken?: string;
}

export function AuthForm({ mode, resetToken }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const redirectTo = searchParams.get("redirect");

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const forgotForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: resetToken || "" },
  });

  const handleLogin = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      const user = res.data.data;
      setUser(user);
      toast.success("Welcome back!");
      const destination =
        redirectTo ||
        (user.role === "SUPER_ADMIN"
          ? "/super-admin"
          : user.role === "HOSPITAL"
            ? "/hospital"
            : "/dashboard");
      router.push(destination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      const user = res.data.data;
      setUser(user);
      toast.success("Account created successfully!");
      router.push(
        redirectTo ||
          (user.role === "SUPER_ADMIN"
            ? "/super-admin"
            : user.role === "HOSPITAL"
              ? "/hospital"
              : "/dashboard")
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (data: ResetPasswordInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", data);
      toast.success(res.data.message);
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, { title: string; description: string }> = {
    login: { title: "Welcome back", description: "Sign in to your MediMate account" },
    register: { title: "Create account", description: "Start managing your medicines today" },
    forgot: { title: "Forgot password", description: "Enter your email to receive a reset link" },
    reset: { title: "Reset password", description: "Enter your new password" },
  };

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">{titles[mode].title}</CardTitle>
        <CardDescription>{titles[mode].description}</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "login" && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...loginForm.register("email")} />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Sign In
            </Button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" {...registerForm.register("name")} />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...registerForm.register("email")} />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+1 234 567 8900" {...registerForm.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...registerForm.register("password")} />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...registerForm.register("confirmPassword")} />
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Create Account
            </Button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...forgotForm.register("email")} />
              {forgotForm.formState.errors.email && (
                <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Send Reset Link
            </Button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
            <input type="hidden" {...resetForm.register("token")} />
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" {...resetForm.register("password")} />
              {resetForm.formState.errors.password && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...resetForm.register("confirmPassword")} />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {mode === "login" && (
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">Sign up</Link>
          </p>
        )}
        {mode === "register" && (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">Back to login</Link>
          </p>
        )}
        {(mode === "login" || mode === "register") && (
          <p className="text-xs text-muted-foreground">
            <Link href="/splash" className="hover:underline">Choose a different portal</Link>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
