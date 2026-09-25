export type VerificationStatus = "NOT_APPLIED" | "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type VerificationCategory =
  | "Creator & Influencer"
  | "News & Media"
  | "Business & Brand"
  | "Government & Politics"
  | "Music & Entertainment"
  | "Sports & Gaming"
  | "Community Leader & Activist"
  | "Other";

export type DocumentType =
  | "National ID / Passport"
  | "Driver's License"
  | "Tax Filing Document"
  | "Articles of Incorporation"
  | "Official Utility / Business Proof";

export interface VerificationApplication {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  knownAs: string;
  category: VerificationCategory;
  documentType: DocumentType;
  documentNumber: string;
  officialLinks: string[];
  notes?: string;
  status: VerificationStatus;
  appliedAt: string;
  reviewedAt?: string | null;
  reviewerNotes?: string | null;
  rejectionReason?: string | null;
}

const STORAGE_KEY = "opexnal_verification_app_v2";

export function getStoredVerification(userId: string): VerificationApplication | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(`${STORAGE_KEY}_${userId}`) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VerificationApplication;
  } catch {
    return null;
  }
}

export function saveVerificationApplication(app: VerificationApplication): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${app.userId}`, JSON.stringify(app));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
    // notify listeners
    window.dispatchEvent(new CustomEvent("opexnal:verification-updated", { detail: app }));
  } catch {
    // ignore
  }
}
