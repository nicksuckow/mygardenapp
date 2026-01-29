"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ui } from "@/lib/uiStyles";

export default function AccountPage() {
  const [message, setMessage] = useState("");

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      setMessage("Please type DELETE to confirm account deletion.");
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch("/api/account/delete", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Failed to delete account.");
        return;
      }

      // Sign out and redirect to login
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      setMessage("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 border border-cream-200 p-6">
        {/* Decorative settings icon */}
        <div className="absolute top-0 right-0 opacity-10">
          <svg className="w-32 h-32 text-sage" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-shrink-0 bg-gradient-to-br from-sage to-sage-dark text-white p-2.5 rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-earth-warm text-sm mt-1">
              Manage your account and data
            </p>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className={`${ui.card} ${ui.cardPad} space-y-4 sm:max-w-2xl`}>
        <div>
          <h2 className="text-base font-semibold">Your Data</h2>
          <p className="text-sm text-earth-warm">Export or manage your garden data</p>
        </div>

        <div className="border-t border-cream-200 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-sm text-earth-warm">
                Download all your plants, beds, seeds, and journal entries as a JSON file
              </p>
            </div>
            <a
              href="/api/account/export"
              download
              className={`${ui.btn} ${ui.btnSecondary} whitespace-nowrap`}
            >
              Download Data
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone - Account Deletion */}
      <div className="rounded-xl border border-terracotta/30 bg-terracotta-50 p-6 space-y-4 sm:max-w-2xl">
        <div>
          <h2 className="text-base font-semibold text-terracotta-dark">Danger Zone</h2>
          <p className="text-sm text-terracotta mt-1">
            Irreversible actions that affect your account
          </p>
        </div>

        <div className="border-t border-terracotta/30 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-terracotta-dark">Delete Account</p>
              <p className="text-sm text-terracotta">
                Permanently delete your account and all data (plants, beds, journal entries, etc.)
              </p>
            </div>
            <button
              className="px-4 py-2 text-sm font-medium text-terracotta border border-terracotta/30 rounded-lg hover:bg-terracotta/20 transition-colors whitespace-nowrap"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {message}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-terracotta-dark">Delete Your Account?</h3>
              <p className="text-sm text-earth-warm mt-2">
                This action <strong>cannot be undone</strong>. This will permanently delete:
              </p>
              <ul className="text-sm text-earth-warm mt-2 ml-4 list-disc space-y-1">
                <li>Your account and profile</li>
                <li>All your plants and plant data</li>
                <li>All your garden beds and placements</li>
                <li>Your seed inventory</li>
                <li>All journal entries</li>
                <li>Your settings and preferences</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-earth-deep">
                Type <span className="font-mono bg-cream-100 px-1 rounded">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                className="w-full rounded border border-cream-200 px-3 py-2 text-sm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                className="px-4 py-2 text-sm font-medium text-earth-deep border border-cream-200 rounded-lg hover:bg-cream-50"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark disabled:opacity-50"
                onClick={deleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE"}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
