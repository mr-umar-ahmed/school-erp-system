"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestLeave, decideLeave } from "@/features/hr/actions";

export function LeaveRequestForm() {
  const [isPending, startTransition] = useTransition();
  const [leaveType, setLeaveType] = useState<
    "sick" | "casual" | "earned" | "maternity" | "other"
  >("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await requestLeave({
        leaveType,
        startDate,
        endDate,
        reason,
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setReason("");
        setStartDate("");
        setEndDate("");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={leaveType}
            onValueChange={(v) => setLeaveType(v as typeof leaveType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="sick">Sick</SelectItem>
              <SelectItem value="earned">Earned</SelectItem>
              <SelectItem value="maternity">Maternity</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Reason</Label>
        <Textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Short reason for the leave..."
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !startDate || !endDate}
        className="rounded-full"
      >
        <CalendarPlus className="size-4" />
        {isPending ? "Submitting..." : "Request Leave"}
      </Button>
    </div>
  );
}

export function LeaveDecisionButtons({ leaveId }: { leaveId: string }) {
  const [isPending, startTransition] = useTransition();
  const decide = (decision: "approved" | "rejected") =>
    startTransition(async () => {
      const result = await decideLeave(leaveId, decision);
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        className="rounded-full bg-success text-success-foreground hover:bg-success/90"
        disabled={isPending}
        onClick={() => decide("approved")}
      >
        <Check className="size-4" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full text-destructive"
        disabled={isPending}
        onClick={() => decide("rejected")}
      >
        <X className="size-4" />
        Reject
      </Button>
    </div>
  );
}
