"use client";

import { useRouter } from "next/navigation";
import { ListeNotifications } from "@/components/notifications/Notifications";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <main className="min-h-full bg-white pb-6">
      <div className="rounded-b-[22px] px-4 pb-5 pt-6 text-white" style={{ background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)" }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg"
          >
            ‹
          </button>
          <h1 className="text-lg font-extrabold">Notifications</h1>
        </div>
      </div>
      <div className="px-4 pt-4">
        <ListeNotifications />
      </div>
    </main>
  );
}
