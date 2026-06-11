"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/validations/auth";

export function HospitalAuthForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const handleLogin = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      const user = res.data.data;
      if (user.role !== "HOSPITAL") {
        toast.error("This account is not a hospital. Use the correct login portal.");
        return;
      }
      setUser(user);
      toast.success("Welcome back!");
      router.push("/hospital");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>Hospital Login</CardTitle>
        <CardDescription>Sign in with your hospital email and password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Hospital Email</Label>
            <Input id="email" type="email" placeholder="hospital@example.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Sign In as Hospital
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground text-center">
          Hospital accounts are created by the Super Admin.
        </p>
        <p className="text-xs text-muted-foreground">
          <Link href="/splash" className="hover:underline">Choose a different portal</Link>
        </p>
      </CardFooter>
    </Card>
  );
}
