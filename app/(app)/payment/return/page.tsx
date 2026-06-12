"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { Card, Spinner } from "../../../components/ui";
import Button from "../../../components/Button";

type State = "checking" | "paid" | "pending" | "failed" | "error";

export default function PaymentReturnPage() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("referenceNumber") || params.get("reference");
    if (!reference) {
      setState("error");
      return;
    }
    let tries = 0;
    let stop = false;

    const poll = async () => {
      try {
        const { status } = await api.paymentStatus(reference);
        if (status === "paid") return setState("paid");
        if (status === "failed" || status === "cancelled") return setState("failed");
        // still pending — keep polling a few times
        if (tries++ < 8 && !stop) setTimeout(poll, 2500);
        else setState("pending");
      } catch {
        setState("error");
      }
    };
    poll();
    return () => {
      stop = true;
    };
  }, []);

  const content = {
    checking: { icon: <Spinner className="h-8 w-8" />, title: "Confirming your payment…", body: "Hang tight, this only takes a moment." },
    paid: { icon: "✅", title: "Payment received", body: "Your booking is confirmed and funds are held in escrow until the job is complete." },
    pending: { icon: "⏳", title: "Payment pending", body: "We haven't received confirmation yet. It may take a minute — check your bookings shortly." },
    failed: { icon: "❌", title: "Payment not completed", body: "The payment was cancelled or failed. You can try again from your bookings." },
    error: { icon: "⚠️", title: "Couldn't verify payment", body: "Open your bookings to check the latest status." },
  }[state];

  return (
    <div className="max-w-md mx-auto">
      <Card className="text-center py-10">
        <div className="text-4xl mb-3 flex justify-center">{content.icon}</div>
        <h1 className="text-xl font-extrabold text-pj-slate-900">{content.title}</h1>
        <p className="text-pj-slate-500 mt-2">{content.body}</p>
        <div className="mt-6">
          <Button href="/bookings">Go to bookings</Button>
        </div>
      </Card>
    </div>
  );
}
