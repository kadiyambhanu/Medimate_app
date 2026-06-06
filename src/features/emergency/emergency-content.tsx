"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, User, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import api from "@/lib/api";
import type { IFamilyMember } from "@/types";
import Link from "next/link";

export function EmergencyContent() {
  const [contacts, setContacts] = useState<IFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/family")
      .then((res) => setContacts(res.data.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const emergencyContacts = contacts.filter((c) => c.phone || c.email);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emergency Contacts</h1>
          <p className="text-muted-foreground">Quick access to family and emergency contacts</p>
        </div>
        <Button asChild>
          <Link href="/family"><Plus className="h-4 w-4" /> Manage Contacts</Link>
        </Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
          <div className="text-sm">
            <p className="font-medium">In case of emergency</p>
            <p className="text-muted-foreground">
              Call your local emergency number (e.g. 911) for immediate medical assistance.
              Use the contacts below to notify family members.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <PageLoader />
      ) : emergencyContacts.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No emergency contacts"
          description="Add family members with phone numbers to use as emergency contacts."
          actionLabel="Add Contact"
          onAction={() => window.location.href = "/family"}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {emergencyContacts.map((contact) => (
            <Card key={contact._id.toString()} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{contact.memberName}</h3>
                    <p className="text-sm text-primary">{contact.relation}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contact.phone && (
                    <Button asChild size="sm" className="flex-1">
                      <a href={`tel:${contact.phone}`}>
                        <Phone className="h-4 w-4" /> Call
                      </a>
                    </Button>
                  )}
                  {contact.email && (
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <a href={`mailto:${contact.email}`}>
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
