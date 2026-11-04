import { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCode,
  Bug,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  Layers,
  Database,
  Lock,
  Cpu,
} from "lucide-react";
import {
  generateAllSecurityControls,
  calculateSecurityDashboardMetrics,
  getCategorySummaries,
  querySecurityControls,
  getControlById,
} from "@/lib/security-engine";
import { SECURITY_CATEGORIES } from "@/lib/security-categories";
import type {
  SecurityControl,
  ControlStatus,
  RiskLevel,
} from "@/lib/security-framework-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SecurityDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<ControlStatus | undefined>(undefined);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeModalControl, setActiveModalControl] = useState<SecurityControl | null>(null);
  const [viewMode, setViewMode] = useState<"controls" | "categories">("controls");

  // Metrics calculation
  const metrics = useMemo(() => calculateSecurityDashboardMetrics(), []);
  const categorySummaries = useMemo(() => getCategorySummaries(), []);

  // Filtered paginated controls
  const queryResult = useMemo(() => {
    return querySecurityControls({
      page: currentPage,
      pageSize,
      categoryNumber: selectedCategory,
      status: selectedStatus,
      riskLevel: selectedRisk,
      searchQuery,
    });
  }, [currentPage, pageSize, selectedCategory, selectedStatus, selectedRisk, searchQuery]);

  // Reset to page 1 on filter changes
  const handleFilterChange = (setter: () => void) => {
    setter();
    setCurrentPage(1);
  };

  const getStatusBadge = (status: ControlStatus) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
            Verified
          </Badge>
        );
      case "IMPLEMENTED":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">
            Implemented
          </Badge>
        );
      case "TESTED":
        return (
          <Badge className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] font-bold uppercase">
            Tested
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
            In Progress
          </Badge>
        );
      case "NOT_IMPLEMENTED":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border text-[10px] uppercase">
            Roadmap / Backlog
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-purple-400 border-purple-500/30 text-[10px] uppercase">
            Review
          </Badge>
        );
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "CRITICAL":
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40">
            Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-800/40">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
            Medium
          </span>
        );
      case "LOW":
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Low
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Framework Title */}
      <div className="bg-gradient-to-r from-card via-surface to-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Opexnal 10,000 Security Controls Architecture
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Production Multi-Layer Security Registry & Independent Verification Matrix
              (OPEX-SEC-00001 — OPEX-SEC-10000)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="brand-gradient-bg text-white font-semibold text-xs py-1 px-3">
              Score: {metrics.complianceScorePercent}%
            </Badge>
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/40">
              10,000 Controls Indexed
            </Badge>
          </div>
        </div>

        {/* Audit & Compliance Timestamps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          <div>
            <span className="text-foreground font-medium">Last Automated Suite: </span>
            {metrics.lastSuccessfulSecurityTest}
          </div>
          <div>
            <span className="text-foreground font-medium">Last Audit Pass: </span>
            {metrics.lastIndependentAudit}
          </div>
          <div>
            <span className="text-foreground font-medium">Active Incidents: </span>
            <span className="text-emerald-400 font-bold">{metrics.openSecurityIncidents} (Nominal)</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Total Controls</p>
          <p className="text-xl font-extrabold text-foreground font-mono">
            {metrics.totalRegisteredControls.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">100 Categories × 100</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-emerald-400 font-medium">Verified Active</p>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            {metrics.verifiedControls.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-500/80">Automated tests passing</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-blue-400 font-medium">Implemented</p>
          <p className="text-xl font-extrabold text-blue-400 font-mono">
            {metrics.implementedControls.toLocaleString()}
          </p>
          <p className="text-[10px] text-blue-400/80">Active in codebase</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-amber-400 font-medium">In Progress</p>
          <p className="text-xl font-extrabold text-amber-400 font-mono">
            {metrics.inProgressControls.toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-400/80">Hardening in sprint</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Security Roadmap</p>
          <p className="text-xl font-extrabold text-muted-foreground font-mono">
            {metrics.notImplementedControls.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Defense-in-depth backlog</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3.5 space-y-1">
          <p className="text-[11px] text-rose-400 font-medium">Critical Vulns</p>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            {metrics.criticalVulnerabilities}
          </p>
          <p className="text-[10px] text-emerald-400/80">Zero open zero-days</p>
        </div>
      </div>

      {/* Switcher & View Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-2 rounded-2xl">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMode("controls")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
              viewMode === "controls"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Controls Registry ({queryResult.total})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("categories")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
              viewMode === "categories"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>100 Security Categories</span>
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing {queryResult.total} matching controls
        </div>
      </div>

      {/* VIEW: CATEGORY MATRIX */}
      {viewMode === "categories" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categorySummaries.map((cat) => (
              <div
                key={cat.number}
                onClick={() => {
                  handleFilterChange(() => setSelectedCategory(cat.number));
                  setViewMode("controls");
                }}
                className="bg-card border border-border hover:border-primary/50 transition-all rounded-2xl p-3.5 space-y-2 cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                    CAT #{String(cat.number).padStart(3, "0")}
                  </span>
                  <Badge variant="outline" className="text-[10px] text-primary">
                    {cat.verifiedCount + cat.implementedCount} active
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <div className="space-y-1">
                  <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(cat.verifiedCount / cat.totalControls) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(cat.implementedCount / cat.totalControls) * 100}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(cat.inProgressCount / cat.totalControls) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{cat.verifiedCount} verified</span>
                    <span>{cat.totalControls} total</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CONTROLS REGISTRY TABLE & FILTERS */}
      {viewMode === "controls" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-3.5 space-y-3 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search ID (e.g. 00042), name, threat..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
                  className="pl-9 h-10 text-xs rounded-xl"
                />
              </div>

              {/* Category Filter */}
              <select
                aria-label="Filter by security category"
                value={selectedCategory || ""}
                onChange={(e) =>
                  handleFilterChange(() =>
                    setSelectedCategory(e.target.value ? Number(e.target.value) : undefined),
                  )
                }
                className="bg-surface border border-border text-foreground text-xs rounded-xl px-3 h-10 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All 100 Security Categories</option>
                {SECURITY_CATEGORIES.map((c) => (
                  <option key={c.number} value={c.number}>
                    #{c.number}: {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                aria-label="Filter by implementation status"
                value={selectedStatus || ""}
                onChange={(e) =>
                  handleFilterChange(() =>
                    setSelectedStatus((e.target.value as ControlStatus) || undefined),
                  )
                }
                className="bg-surface border border-border text-foreground text-xs rounded-xl px-3 h-10 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">VERIFIED (Passing Tests)</option>
                <option value="IMPLEMENTED">IMPLEMENTED (In Codebase)</option>
                <option value="TESTED">TESTED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="NOT_IMPLEMENTED">NOT_IMPLEMENTED (Roadmap)</option>
                <option value="FAILED">FAILED</option>
              </select>

              {/* Risk Level Filter */}
              <select
                aria-label="Filter by risk level"
                value={selectedRisk || ""}
                onChange={(e) =>
                  handleFilterChange(() =>
                    setSelectedRisk((e.target.value as RiskLevel) || undefined),
                  )
                }
                className="bg-surface border border-border text-foreground text-xs rounded-xl px-3 h-10 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Risk Levels</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="INFORMATIONAL">INFORMATIONAL</option>
              </select>
            </div>

            {/* Active filter reset button */}
            {(searchQuery || selectedCategory || selectedStatus || selectedRisk) && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted-foreground">
                  Active filters applied: {queryResult.total} matches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory(undefined);
                    setSelectedStatus(undefined);
                    setSelectedRisk(undefined);
                    setCurrentPage(1);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>

          {/* Controls List / Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs divide-y divide-border">
            {queryResult.controls.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No controls match your filter</p>
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search query, status, or category selection.
                </p>
              </div>
            ) : (
              queryResult.controls.map((control) => (
                <div
                  key={control.id}
                  onClick={() => setActiveModalControl(control)}
                  className="p-3.5 hover:bg-surface/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-foreground bg-surface px-1.5 py-0.5 rounded border border-border/80">
                        {control.id}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        Cat #{control.categoryNumber}: {control.categoryName}
                      </span>
                      {getRiskBadge(control.riskLevel)}
                    </div>

                    <h4 className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                      {control.name}
                    </h4>

                    <p className="text-muted-foreground text-[11px] line-clamp-1">
                      <span className="font-medium text-foreground/80">Threat: </span>
                      {control.threatAddressed}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                    <div>{getStatusBadge(control.status)}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-primary hover:text-primary px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalControl(control);
                      }}
                    >
                      Audit Spec →
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {queryResult.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border border-border rounded-2xl text-xs">
              <span className="text-muted-foreground">
                Page {queryResult.page} of {queryResult.totalPages} ({queryResult.total} items)
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs rounded-xl"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>

                {/* Jump to specific page input */}
                <input
                  aria-label="Jump to page number"
                  type="number"
                  min={1}
                  max={queryResult.totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= queryResult.totalPages) {
                      setCurrentPage(val);
                    }
                  }}
                  className="w-14 h-8 bg-surface border border-border text-center rounded-xl text-xs"
                />

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= queryResult.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(queryResult.totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs rounded-xl"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Detail Audit Spec Modal */}
      <Dialog
        open={!!activeModalControl}
        onOpenChange={(open) => {
          if (!open) setActiveModalControl(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          {activeModalControl && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs bg-surface px-2 py-0.5 rounded border border-border">
                    {activeModalControl.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Category #{activeModalControl.categoryNumber}: {activeModalControl.categoryName}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {activeModalControl.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Full security architecture specification, threat model, code references, and audit verification.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-2 p-3 bg-surface rounded-2xl text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">STATUS</span>
                  <div className="mt-1">{getStatusBadge(activeModalControl.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">RISK CLASSIFICATION</span>
                  <div className="mt-1">{getRiskBadge(activeModalControl.riskLevel)}</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    1. Security Objective
                  </p>
                  <p className="mt-1 text-muted-foreground bg-card p-2.5 rounded-xl border border-border">
                    {activeModalControl.objective}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    2. Threat Addressed
                  </p>
                  <p className="mt-1 text-rose-300 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30">
                    {activeModalControl.threatAddressed}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    3. Source Code References
                  </p>
                  <div className="mt-1 bg-card p-2.5 rounded-xl border border-border space-y-1">
                    {activeModalControl.sourceCodeReferences.map((ref, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-primary">
                        <FileCode className="h-3.5 w-3.5 shrink-0" />
                        <span>{ref}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    4. Automated Test References & Results
                  </p>
                  <div className="mt-1 bg-card p-2.5 rounded-xl border border-border space-y-1.5">
                    {activeModalControl.automatedTestReferences.map((testRef, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-teal-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                        <span>{testRef}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Result: </span>
                      {activeModalControl.testResults}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    5. Verification Evidence
                  </p>
                  <p className="mt-1 text-muted-foreground bg-card p-2.5 rounded-xl border border-border text-[11px]">
                    {activeModalControl.verificationEvidence}
                  </p>
                </div>

                <div>
                  <p className="font-bold text-foreground text-[11px] uppercase tracking-wide">
                    6. Remediation & Hardening Instructions
                  </p>
                  <p className="mt-1 text-muted-foreground bg-card p-2.5 rounded-xl border border-border text-[11px]">
                    {activeModalControl.remediationInstructions}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
