"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Pill, Bell, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

const slides = [
  {
    icon: Heart,
    title: `Welcome to ${APP_NAME}`,
    description: "Your personal healthcare companion for managing medicines and staying on track with your health goals.",
  },
  {
    icon: Pill,
    title: "Track Your Medicines",
    description: "Add medicines, set dosages, and never miss a dose with smart scheduling and reminders.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get timely alerts for morning, afternoon, evening, and night doses. Mark taken, snooze, or track missed doses.",
  },
  {
    icon: Users,
    title: "Family & Emergency",
    description: "Monitor family health, upload prescriptions, and keep emergency contacts at your fingertips.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const finish = () => {
    localStorage.setItem("medimate-onboarded", "true");
    router.push("/register");
  };

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else finish();
  };

  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex justify-end p-6">
        <Button variant="ghost" onClick={finish}>Skip</Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex max-w-md flex-col items-center text-center"
          >
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10">
              <Icon className="h-14 w-14 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{slide.title}</h2>
            <p className="mt-3 text-muted-foreground">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <div className="border-t p-6">
        <Button className="w-full" size="lg" onClick={next}>
          {step < slides.length - 1 ? (
            <>Next <ChevronRight className="h-4 w-4" /></>
          ) : (
            "Get Started"
          )}
        </Button>
        {step === slides.length - 1 && (
          <Button variant="link" className="mt-2 w-full" onClick={() => router.push("/login")}>
            Already have an account? Sign in
          </Button>
        )}
      </div>
    </div>
  );
}
