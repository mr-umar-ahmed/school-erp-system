"use client";

import { useState, useTransition } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collectFee } from "@/features/fees/actions";

export function CollectFeeDialog({
  feePaymentId,
  studentName,
  feeName,
  outstanding,
}: {
  feePaymentId: string;
  studentName: string;
  feeName: string;
  outstanding: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState<"cash" | "online" | "upi" | "cheque">(
    "cash"
  );

  const submit = () => {
    startTransition(async () => {
      const result = await collectFee({
        feePaymentId,
        amount: Number(amount),
        method,
      });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <HandCoins className="size-4" />
          Collect
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>Collect Fee</DialogTitle>
          <DialogDescription>
            {studentName} — {feeName} • Outstanding ₹
            {outstanding.toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min={1}
              max={outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={submit}
            disabled={isPending}
            className="w-full rounded-full"
          >
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
