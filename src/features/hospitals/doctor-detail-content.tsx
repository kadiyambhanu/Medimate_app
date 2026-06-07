"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { Stethoscope, ArrowLeft, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { IDoctor, IDoctorSchedule, IHospital } from "@/types";

interface DoctorDetail extends IDoctor {
  hospitalId: IHospital;
  schedule: IDoctorSchedule | null;
}

export function DoctorDetailContent({
  hospitalId,
  doctorId,
}: {
  hospitalId: string;
  doctorId: string;
}) {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/doctors/${doctorId}`)
      .then((res) => setDoctor(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load doctor"))
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true);
    api
      .get(`/doctors/${doctorId}/slots?date=${date}`)
      .then((res) => {
        setSlots(res.data.data);
        setSelectedSlot("");
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, date]);

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error("Select a time slot");
      return;
    }
    setBooking(true);
    try {
      await api.post("/appointments", {
        hospitalId,
        doctorId,
        appointmentDate: date,
        slotTime: selectedSlot,
        notes,
      });
      toast.success("Appointment booked successfully!");
      router.push("/appointments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!doctor) return <p>Doctor not found</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/hospitals/${hospitalId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hospital
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
          {doctor.profileImage ? (
            <img src={doctor.profileImage} alt={doctor.name} className="h-28 w-28 rounded-xl object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-primary/10">
              <Stethoscope className="h-14 w-14 text-primary" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold">{doctor.name}</h1>
            <p className="text-lg text-primary">{doctor.specialization}</p>
            {doctor.qualification && <p className="text-muted-foreground">{doctor.qualification}</p>}
            <div className="flex flex-wrap gap-3 text-sm">
              <Badge variant="secondary">{doctor.experience} years experience</Badge>
              <Badge>₹{doctor.consultationFee} consultation</Badge>
            </div>
            {doctor.description && <p className="text-sm text-muted-foreground">{doctor.description}</p>}
          </div>
        </CardContent>
      </Card>

      {doctor.schedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Days:</span>{" "}
              {doctor.schedule.availableDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
            </p>
            <p>
              <span className="font-medium">Hours:</span> {doctor.schedule.startTime} — {doctor.schedule.endTime}
            </p>
            <p>
              <span className="font-medium">Slot Duration:</span> {doctor.schedule.slotDuration} minutes
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Available Slots</Label>
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots available for this date</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm transition-colors",
                      selectedSlot === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any symptoms or notes..." />
          </div>

          <Button onClick={handleBook} disabled={booking || !selectedSlot} className="w-full">
            {booking ? "Booking..." : "Confirm Appointment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
