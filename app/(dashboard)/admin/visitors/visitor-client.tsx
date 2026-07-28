"use client";

import { useState, useTransition } from "react";
import { DoorOpen, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkInVisitor, checkOutVisitor } from "@/features/visitors/actions";

export function VisitorCheckInForm() {
  const [isPending, startTransition] = useTransition();
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [whomToMeet, setWhomToMeet] = useState("");
  const [idProofType, setIdProofType] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await checkInVisitor({
        visitorName,
        phone: phone || undefined,
        purpose,
        whomToMeet: whomToMeet || undefined,
        idProofType: idProofType || undefined,
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setVisitorName("");
        setPhone("");
        setPurpose("");
        setWhomToMeet("");
        setIdProofType("");
      }
    });
  };

  return (
    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1.5">
        <Label>Visitor name</Label>
        <Input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Purpose</Label>
        <Input
          placeholder="Admission enquiry"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Whom to meet</Label>
        <Input value={whomToMeet} onChange={(e) => setWhomToMeet(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>ID proof</Label>
        <Input
          placeholder="Aadhaar"
          value={idProofType}
          onChange={(e) => setIdProofType(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={isPending} className="rounded-full">
        <DoorOpen className="size-4" />
        {isPending ? "Saving..." : "Check In"}
      </Button>
    </div>
  );
}

export function CheckOutButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await checkOutVisitor(id);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        })
      }
    >
      <LogOut className="size-4" />
      {isPending ? "..." : "Check Out"}
    </Button>
  );
}
