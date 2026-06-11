import { cn } from "@/lib/utils";

interface AdminPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminPageShell({ children, className }: AdminPageShellProps) {
  return <div className={cn("mx-auto max-w-7xl space-y-6", className)}>{children}</div>;
}
