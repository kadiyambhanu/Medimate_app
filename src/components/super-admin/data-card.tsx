import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DataCard({
  title,
  description,
  count,
  action,
  children,
  className,
  contentClassName,
}: DataCardProps) {
  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b bg-muted/20 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {title}
            {count != null && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
            )}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("p-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
