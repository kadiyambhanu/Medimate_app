"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  loginSchema,
  superAdminRegisterSchema,
  type LoginInput,
  type SuperAdminRegisterInput,
} from "@/validations/auth";

type SuperAdminAuthMode = "login" | "register";

interface SuperAdminAuthFormProps {
  mode: SuperAdminAuthMode;
}

export function SuperAdminAuthForm({ mode }: SuperAdminAuthFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<SuperAdminRegisterInput>({
    resolver: zodResolver(superAdminRegisterSchema),
  });

  const handleLogin = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/super-admin/login", data);
      setUser(res.data.data);
      toast.success("Welcome, Super Admin!");
      router.push("/super-admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: SuperAdminRegisterInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/super-admin/register", data);
      setUser(res.data.data);
      toast.success("Super admin account created!");
      router.push("/super-admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<SuperAdminAuthMode, { title: string; description: string }> = {
    login: {
      title: "Super Admin Login",
      description: "Sign in to manage hospitals, doctors, and appointments",
    },
    register: {
      title: "Create Super Admin Account",
      description: "Register a new platform administrator account",
    },
  };

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>{titles[mode].title}</CardTitle>
        <CardDescription>{titles[mode].description}</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "login" && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" {...loginForm.register("email")} />
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Sign In as Super Admin
            </Button>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Admin Name" {...registerForm.register("name")} />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" {...registerForm.register("email")} />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" {...registerForm.register("phone")} />
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
              Create Super Admin Account
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {mode === "login" && (
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/superadmin/register" className="text-primary hover:underline">
              Create account
            </Link>
          </p>
        )}
        {mode === "register" && (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/superadmin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          <Link href="/splash" className="hover:underline">Choose a different portal</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
