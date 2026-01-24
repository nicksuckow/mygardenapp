"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";

export default function UserMenu({ session }: { session: Session | null }) {
  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">{session.user.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Sign Out
      </button>
    </div>
  );
}
