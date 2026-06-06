"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Pill, Bell } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem("medimate-onboarded");
      router.replace(onboarded ? "/login" : "/onboarding");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 backdrop-blur"
        >
          <Heart className="h-12 w-12" />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-lg text-primary-foreground/80">Smart Medicine Reminder System</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 flex gap-8"
      >
        {[Pill, Bell, Heart].map((Icon, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          >
            <Icon className="h-6 w-6 text-primary-foreground/60" />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "120px" }}
        transition={{ delay: 1, duration: 1.2 }}
        className="mt-10 h-1 rounded-full bg-white/40"
      />
    </div>
  );
}
