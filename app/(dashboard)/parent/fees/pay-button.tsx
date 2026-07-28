"use client";

import { useTransition } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { payFeeOnline } from "@/features/fees/actions";

export function PayButton({ feePaymentId }: { feePaymentId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      className="rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await payFeeOnline(feePaymentId);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        })
      }
    >
      <Wallet className="size-4" />
      {isPending ? "Paying..." : "Pay Now"}
    </Button>
  );
}
