import { Building2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function HospitalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">{APP_NAME}</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Hospital Portal</h1>
          <p className="text-lg text-primary-foreground/80">
            Manage doctors, schedules, appointments, and prescriptions for your hospital.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} {APP_NAME}. Hospital access only.
        </p>
      </div>
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-foreground lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">Hospital Portal</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
