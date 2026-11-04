import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  generateAllSecurityControls,
  calculateSecurityDashboardMetrics,
  getCategorySummaries,
  querySecurityControls,
  getControlById,
} from "../src/lib/security-engine.ts";
import { SECURITY_CATEGORIES } from "../src/lib/security-categories.ts";

describe("Opexnal 10,000 Security Controls Framework — Verification Suite", () => {
  test("generates exactly 10,000 security controls with zero duplicates", () => {
    const controls = generateAllSecurityControls();
    assert.equal(controls.length, 10000);

    const idSet = new Set<string>();
    for (const c of controls) {
      assert.equal(idSet.has(c.id), false, `Duplicate control ID detected: ${c.id}`);
      idSet.add(c.id);
      assert.match(c.id, /^OPEX-SEC-\d{5}$/);
    }
    assert.equal(idSet.size, 10000);
  });

  test("spans sequentially from OPEX-SEC-00001 to OPEX-SEC-10000 without gaps", () => {
    const controls = generateAllSecurityControls();
    assert.equal(controls[0].id, "OPEX-SEC-00001");
    assert.equal(controls[9999].id, "OPEX-SEC-10000");

    for (let i = 0; i < 10000; i++) {
      const expectedId = `OPEX-SEC-${String(i + 1).padStart(5, "0")}`;
      assert.equal(controls[i].id, expectedId);
    }
  });

  test("organizes into exactly 100 categories with exactly 100 controls each", () => {
    assert.equal(SECURITY_CATEGORIES.length, 100);

    const summaries = getCategorySummaries();
    assert.equal(summaries.length, 100);

    for (const s of summaries) {
      assert.equal(s.totalControls, 100, `Category ${s.number} does not have 100 controls`);
      assert.ok(s.number >= 1 && s.number <= 100);
      assert.ok(s.name.length > 0);
    }
  });

  test("verifies every control contains all mandatory compliance fields", () => {
    const controls = generateAllSecurityControls();

    const sampleIndices = [0, 99, 100, 499, 1000, 4999, 7500, 9999];
    const validStatuses = new Set([
      "NOT_IMPLEMENTED",
      "IN_PROGRESS",
      "IMPLEMENTED",
      "TESTED",
      "VERIFIED",
      "FAILED",
      "NEEDS_REVIEW",
    ]);
    const validRisks = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);

    for (const idx of sampleIndices) {
      const c = controls[idx];
      assert.ok(c.id);
      assert.ok(c.categoryNumber >= 1 && c.categoryNumber <= 100);
      assert.ok(c.categoryName);
      assert.ok(c.name);
      assert.ok(c.objective);
      assert.ok(c.threatAddressed);
      assert.ok(validStatuses.has(c.status));
      assert.ok(Array.isArray(c.sourceCodeReferences) && c.sourceCodeReferences.length > 0);
      assert.ok(Array.isArray(c.automatedTestReferences) && c.automatedTestReferences.length > 0);
      assert.ok(c.testResults);
      assert.ok(c.verificationEvidence);
      assert.ok(validRisks.has(c.riskLevel));
      assert.ok(c.remediationInstructions);
    }
  });

  test("calculates accurate dashboard metrics totaling 10,000 controls", () => {
    const metrics = calculateSecurityDashboardMetrics();

    assert.equal(metrics.totalRegisteredControls, 10000);
    const sum =
      metrics.verifiedControls +
      metrics.implementedControls +
      metrics.testedControls +
      metrics.inProgressControls +
      metrics.notImplementedControls +
      metrics.failedControls +
      metrics.needsReviewControls;

    assert.equal(sum, 10000);
    assert.equal(metrics.criticalVulnerabilities, 0);
    assert.equal(metrics.highRiskVulnerabilities, 0);
    assert.equal(metrics.openSecurityIncidents, 0);
    assert.ok(metrics.complianceScorePercent > 0 && metrics.complianceScorePercent <= 100);
  });

  test("queries controls by category correctly", () => {
    const res = querySecurityControls({ categoryNumber: 1, pageSize: 100 });
    assert.equal(res.total, 100);
    assert.equal(res.controls.length, 100);
    for (const c of res.controls) {
      assert.equal(c.categoryNumber, 1);
    }
  });

  test("queries controls by status correctly", () => {
    const res = querySecurityControls({ status: "VERIFIED", pageSize: 50 });
    assert.ok(res.total > 0);
    for (const c of res.controls) {
      assert.equal(c.status, "VERIFIED");
    }
  });

  test("queries controls by risk level correctly", () => {
    const res = querySecurityControls({ riskLevel: "CRITICAL", pageSize: 25 });
    assert.ok(res.total > 0);
    for (const c of res.controls) {
      assert.equal(c.riskLevel, "CRITICAL");
    }
  });

  test("supports text search by control ID, name, or threat", () => {
    const byId = querySecurityControls({ searchQuery: "OPEX-SEC-00042" });
    assert.ok(byId.total >= 1);
    assert.ok(byId.controls.some((c) => c.id === "OPEX-SEC-00042"));

    const byThreat = querySecurityControls({ searchQuery: "timing" });
    assert.ok(byThreat.total > 0);
  });

  test("correctly looks up individual controls via getControlById", () => {
    const first = getControlById("OPEX-SEC-00001");
    assert.notEqual(first, null);
    assert.equal(first?.categoryNumber, 1);

    const last = getControlById("OPEX-SEC-10000");
    assert.notEqual(last, null);
    assert.equal(last?.categoryNumber, 100);

    const nonexistent = getControlById("OPEX-SEC-99999");
    assert.equal(nonexistent, null);
  });
});
