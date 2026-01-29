"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";

export default function UserMenu({ session }: { session: Session | null }) {
  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-earth-warm">{session.user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded border border-cream-200 px-3 py-1.5 text-xs font-medium text-earth-warm hover:bg-cream-50 hover:text-earth-deep transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
