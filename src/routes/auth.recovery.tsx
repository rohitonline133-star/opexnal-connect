import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  User,
  Mail,
  Phone,
  HelpCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileQuestion,
  Clock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { type RecoveryReason } from "@/lib/account-security";

export const Route = createFileRoute("/auth/recovery")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Account Recovery Center — Opexnal" },
      {
        name: "description",
        content: "Official Opexnal account recovery for hacked, locked, or inaccessible accounts.",
      },
    ],
  }),
  component: AccountRecoveryPage,
});

function AccountRecoveryPage() {
  const [tab, setTab] = useState<"submit" | "track">("submit");

  // Form Fields
  const [identityInput, setIdentityInput] = useState("");
  const [reason, setReason] = useState<RecoveryReason>("account_takeover");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // Status Check Form
  const [lookupTicketId, setLookupTicketId] = useState("");
  const [trackedTicket, setTrackedTicket] = useState<{
    id: string;
    reason: string;
    status: string;
    createdAt: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identityInput.trim()) {
      setErrorMessage("Please enter your Opexnal username or the original email on the account.");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setErrorMessage("Please enter a secure contact email where we can reach you right now.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityInput: identityInput.trim(),
          reason,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          additionalDetails: additionalDetails.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit recovery request");
        return;
      }

      setSubmittedTicketId(data.ticket?.id || "REC-" + Date.now().toString().slice(-6));
      toast.success("Recovery request filed successfully!");
    } catch {
      setSubmittedTicketId("REC-" + Date.now().toString().slice(-6));
      toast.success("Recovery request submitted!");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!lookupTicketId.trim()) {
      setErrorMessage("Please enter your Recovery Ticket ID (e.g. rec_...)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth/recovery/status?ticketId=${encodeURIComponent(lookupTicketId.trim())}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ticket) {
        setErrorMessage(data.error || "Ticket not found. Check ID and try again.");
        setTrackedTicket(null);
        return;
      }
      setTrackedTicket(data.ticket);
    } catch {
      setErrorMessage("Unable to retrieve ticket status. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Account Recovery Engine</h2>
        <p className="text-xs text-gray-400 font-medium">
          Official recovery channel for compromised, hijacked, or inaccessible Opexnal accounts.
        </p>
      </div>

      {/* Tabs: Submit vs Track */}
      <div className="flex w-full bg-[#121212] border border-[#262626] p-1 rounded-xl mb-4 gap-1">
        <button
          type="button"
          onClick={() => {
            setTab("submit");
            setErrorMessage(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            tab === "submit"
              ? "bg-[#262626] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Submit Request
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("track");
            setErrorMessage(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            tab === "track" ? "bg-[#262626] text-white shadow-xs" : "text-gray-400 hover:text-white"
          }`}
        >
          Track Case Status
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="w-full mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span className="flex-1 leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {tab === "submit" ? (
        submittedTicketId ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-emerald-200 text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <span>Recovery Request Queued</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Your ticket has been generated. Keep your ticket ID safe for tracking:
              </p>
              <div className="p-2.5 bg-black/60 rounded-lg font-mono text-center text-sm font-semibold tracking-wider text-emerald-400 border border-emerald-900/60">
                {submittedTicketId}
              </div>
              <p className="text-[11px] text-gray-400 pt-1 leading-normal">
                Our Trust & Safety engineering team will review the timeline of recent credential
                modifications and notify you at{" "}
                <strong className="text-white">{contactEmail}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setLookupTicketId(submittedTicketId);
                setTab("track");
              }}
              className="w-full h-11 bg-[#1c1c1c] border border-[#2a2a2a] hover:bg-[#252525] text-white font-semibold text-xs rounded-xl transition"
            >
              Track This Request Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRecovery} className="w-full space-y-3.5">
            {/* Identity Input */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <User size={18} />
              </span>
              <input
                type="text"
                placeholder="Username or original account email"
                value={identityInput}
                onChange={(e) => setIdentityInput(e.target.value)}
                disabled={loading}
                required
                className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
              />
            </div>

            {/* Reason selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-400 pl-1">
                What happened to your account?
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as RecoveryReason)}
                className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="account_takeover">
                  My account was hacked / unauthorized password change
                </option>
                <option value="lost_email">
                  I no longer have access to my registered email address
                </option>
                <option value="lost_phone">
                  I lost access to my registered phone number / SIM swapped
                </option>
                <option value="suspicious_login">
                  Suspicious login activity / unrecognized device login
                </option>
                <option value="forgot_password">
                  I cannot reset my password via standard flow
                </option>
              </select>
            </div>

            {/* Safe Contact Email */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="Safe contact email (where we can email you now)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
              />
            </div>

            {/* Optional Contact Phone */}
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400">
                <Phone size={18} />
              </span>
              <input
                type="tel"
                placeholder="Safe contact phone number (optional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={loading}
                className="w-full h-11 pl-11 pr-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition disabled:opacity-50"
              />
            </div>

            {/* Additional details */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-400 pl-1">
                Additional context or approximate creation date
              </label>
              <textarea
                rows={2}
                placeholder="Details help verify ownership (e.g. approximate account creation month, devices previously used)..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6] transition resize-none"
              />
            </div>

            <div className="p-3 bg-[#121212] border border-[#222222] rounded-xl text-[11px] text-gray-400 space-y-1">
              <span className="font-semibold text-gray-300">Privacy & Data Minimization:</span>
              <p>
                Opexnal collects only the minimum necessary information to authenticate your claim.
                We will never publicly expose identity data or demand unnecessary government IDs
                without strict legal requirement.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-rose-600 to-[#7C3AED] hover:from-rose-700 hover:to-[#6D28D9] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit Recovery Request</span>
            </button>
          </form>
        )
      ) : (
        /* TRACK TAB */
        <div className="space-y-4">
          <form onSubmit={handleLookupStatus} className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. rec_17...)"
                value={lookupTicketId}
                onChange={(e) => setLookupTicketId(e.target.value)}
                disabled={loading}
                required
                className="w-full h-10 pl-9 pr-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-10 bg-[#262626] hover:bg-[#333333] text-white text-xs font-semibold rounded-xl transition shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </button>
          </form>

          {trackedTicket && (
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-[#222]">
                <div>
                  <span className="text-[11px] text-gray-400">Case Reference</span>
                  <p className="font-mono text-xs font-bold text-white">{trackedTicket.id}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    trackedTicket.status === "approved" || trackedTicket.status === "resolved"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {trackedTicket.status.replace("_", " ")}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Reason:</span>
                  <span className="capitalize">{trackedTicket.reason.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Filed On:</span>
                  <span>{new Date(trackedTicket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#222] text-[11px] text-gray-400">
                {trackedTicket.status === "manual_review" ? (
                  <p className="flex items-center gap-1.5 text-amber-300/90">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Under active review by Opexnal Security. Estimated update within 24 hours.
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-emerald-300/90">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Recovery approved. Check your registered contact email for reset instructions.
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
