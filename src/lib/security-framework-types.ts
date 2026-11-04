/**
 * Opexnal 10,000 Security Controls Architecture — Core Types
 */

export type ControlStatus =
  | "NOT_IMPLEMENTED"
  | "IN_PROGRESS"
  | "IMPLEMENTED"
  | "TESTED"
  | "VERIFIED"
  | "FAILED"
  | "NEEDS_REVIEW";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";

export interface SecurityControl {
  id: string; // e.g. OPEX-SEC-00001 to OPEX-SEC-10000
  categoryNumber: number; // 1 to 100
  categoryName: string;
  name: string;
  objective: string;
  threatAddressed: string;
  status: ControlStatus;
  sourceCodeReferences: string[];
  automatedTestReferences: string[];
  testResults: string;
  verificationEvidence: string;
  riskLevel: RiskLevel;
  remediationInstructions: string;
}

export interface SecurityCategorySummary {
  number: number;
  name: string;
  totalControls: number;
  verifiedCount: number;
  implementedCount: number;
  testedCount: number;
  inProgressCount: number;
  notImplementedCount: number;
  criticalCount: number;
  highCount: number;
}

export interface SecurityDashboardMetrics {
  totalRegisteredControls: number; // Exactly 10,000
  implementedControls: number;
  testedControls: number;
  verifiedControls: number;
  inProgressControls: number;
  notImplementedControls: number;
  failedControls: number;
  needsReviewControls: number;
  criticalVulnerabilities: number;
  highRiskVulnerabilities: number;
  openSecurityIncidents: number;
  lastSuccessfulSecurityTest: string;
  lastIndependentAudit: string;
  complianceScorePercent: number;
}
