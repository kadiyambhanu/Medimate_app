import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const variants = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
} as const;

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: keyof typeof variants;
  description?: string;
}

export function AdminStatCard({
  title,
  value,
  icon: Icon,
  variant = "blue",
  description,
}: AdminStatCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={cn("rounded-xl p-3", variants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
