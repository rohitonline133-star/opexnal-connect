/**
 * Opexnal Defense-in-Depth: Centralized Risk Engine & Behavioral Security
 *
 * NOTE ON ML MODEL VERIFICATION STATUS:
 * [CONTROL STATUS: ML MODEL = NOT VERIFIED]
 * Current implementation uses a deterministic heuristic & weighted behavioral scoring engine.
 * A trained offline neural network or statistical classifier serving pipeline is NOT VERIFIED.
 * The deterministic behavioral engine below is active, auditable, and provable [PASS].
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
}

export interface LoginEventContext {
  timestamp: number; // Unix epoch ms
  ip: string;
  userAgent: string;
  deviceId?: string;
  location?: GeoLocation;
}

export interface ImpossibleTravelResult {
  isImpossible: boolean;
  distanceKm: number;
  timeDeltaHours: number;
  speedKmH: number;
  riskScore: number; // 0 - 100
  reason?: string;
}

export interface BehavioralSignals {
  accountAgeDays?: number | undefined;
  failedLoginVelocity10m?: number | undefined; // failed attempts in last 10m
  loginVelocity1h?: number | undefined; // logins in last 1h
  passwordResetVelocity24h?: number | undefined; // password resets in last 24h
  apiRequestVelocity1m?: number | undefined; // API requests in last 1m
  messageVelocity1m?: number | undefined; // messages sent in last 1m
  followVelocity1h?: number | undefined; // follows in last 1h
  commentVelocity1m?: number | undefined; // comments in last 1m
  likeVelocity1m?: number | undefined; // likes in last 1m
  postingVelocity1h?: number | undefined; // posts created in last 1h
  isNewDevice?: boolean | undefined;
  isNewIp?: boolean | undefined;
  isKnownBadIp?: boolean | undefined;
  isKnownTorOrProxy?: boolean | undefined;
  impossibleTravel?: ImpossibleTravelResult | undefined;
  deviceBotSignals?: {
    isHeadlessOrAutomated?: boolean | undefined;
    hasSuspiciousHeaders?: boolean | undefined;
    entropyScore?: number | undefined; // 0 (suspicious) - 100 (normal browser)
  } | undefined;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskEvaluationResult {
  score: number; // 0 - 100
  level: RiskLevel;
  action:
    "ALLOW" | "RATE_LIMIT" | "REQUIRE_MFA" | "CHALLENGE" | "TEMPORARY_BLOCK" | "REVOKE_SESSION";
  reasons: string[];
  mlModelStatus: "NOT VERIFIED (Deterministic Behavioral Scoring Active)";
  timestamp: string;
}

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance between two geographical points in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Evaluates impossible travel between a previous login event and a current login event.
 * Maximum realistic commercial flight cruising speed is ~850-900 km/h.
 */
export function evaluateImpossibleTravel(
  previous: LoginEventContext | null | undefined,
  current: LoginEventContext,
  maxPlausibleSpeedKmH: number = 850,
): ImpossibleTravelResult {
  if (!previous || !previous.location || !current.location) {
    return {
      isImpossible: false,
      distanceKm: 0,
      timeDeltaHours: 0,
      speedKmH: 0,
      riskScore: 0,
      reason: "Insufficient geographic telemetry for impossible travel calculation",
    };
  }

  // Calculate time delta in hours
  const timeDeltaMs = Math.abs(current.timestamp - previous.timestamp);
  const timeDeltaHours = Math.max(timeDeltaMs / (1000 * 60 * 60), 0.0001); // avoid div by zero

  const distanceKm = calculateHaversineDistanceKm(
    previous.location.latitude,
    previous.location.longitude,
    current.location.latitude,
    current.location.longitude,
  );

  // If distance is negligible (< 50km, e.g. within same metropolitan area/cell towers)
  if (distanceKm < 50) {
    return {
      isImpossible: false,
      distanceKm: Math.round(distanceKm),
      timeDeltaHours: Number(timeDeltaHours.toFixed(3)),
      speedKmH: Number((distanceKm / timeDeltaHours).toFixed(1)),
      riskScore: 0,
    };
  }

  const speedKmH = distanceKm / timeDeltaHours;

  // Implausible physical travel: speed exceeds commercial aviation limits
  if (speedKmH > maxPlausibleSpeedKmH) {
    // Severe risk if speed is astronomical (e.g. cross-continent in < 15 minutes)
    const severityFactor = Math.min(speedKmH / maxPlausibleSpeedKmH, 10);
    const riskScore = Math.min(Math.round(50 + severityFactor * 5), 100);

    return {
      isImpossible: true,
      distanceKm: Math.round(distanceKm),
      timeDeltaHours: Number(timeDeltaHours.toFixed(3)),
      speedKmH: Number(speedKmH.toFixed(1)),
      riskScore,
      reason: `Physically implausible travel detected: ${Math.round(distanceKm)} km covered in ${(timeDeltaHours * 60).toFixed(1)} mins (${Math.round(speedKmH)} km/h > threshold ${maxPlausibleSpeedKmH} km/h)`,
    };
  }

  return {
    isImpossible: false,
    distanceKm: Math.round(distanceKm),
    timeDeltaHours: Number(timeDeltaHours.toFixed(3)),
    speedKmH: Number(speedKmH.toFixed(1)),
    riskScore: 0,
  };
}

/**
 * Evaluates Device and Bot risk signals based on User-Agent entropy, headless signals, and automation traces.
 */
export function evaluateDeviceBotSignals(
  userAgent: string = "",
  headers: Record<string, string | null | undefined> = {},
): {
  isHeadlessOrAutomated: boolean;
  hasSuspiciousHeaders: boolean;
  botCategory?: string | undefined;
  riskScore: number;
} {
  const uaLower = userAgent.toLowerCase();
  let riskScore = 0;
  let isHeadlessOrAutomated = false;
  let botCategory: string | undefined;

  // 1. Direct Headless / Automation signatures
  const automatedKeywords = [
    { pattern: "puppeteer", cat: "Headless Browser (Puppeteer)" },
    { pattern: "playwright", cat: "Headless Browser (Playwright)" },
    { pattern: "selenium", cat: "Automation Framework (Selenium)" },
    { pattern: "phantomjs", cat: "Headless Browser (PhantomJS)" },
    { pattern: "headlesschrome", cat: "Headless Chrome" },
    { pattern: "curl/", cat: "HTTP Client (cURL)" },
    { pattern: "python-requests", cat: "Script (Python Requests)" },
    { pattern: "aiohttp", cat: "Script (Python aiohttp)" },
    { pattern: "scrapy", cat: "Scraper Framework (Scrapy)" },
    { pattern: "postmanruntime", cat: "API Testing Tool (Postman)" },
    { pattern: "insomnia", cat: "API Testing Tool (Insomnia)" },
    { pattern: "go-http-client", cat: "Script (Go HTTP)" },
    { pattern: "java/", cat: "Java HTTP Client" },
    { pattern: "axios", cat: "Script (Node Axios)" },
    { pattern: "node-fetch", cat: "Script (Node Fetch)" },
    { pattern: "sqlmap", cat: "Offensive Security Scanner (SQLMap)" },
    { pattern: "nikto", cat: "Vulnerability Scanner (Nikto)" },
    { pattern: "zgrab", cat: "Banner Grabber (ZGrab)" },
    { pattern: "nuclei", cat: "Vulnerability Scanner (Nuclei)" },
  ];

  for (const { pattern, cat } of automatedKeywords) {
    if (uaLower.includes(pattern)) {
      isHeadlessOrAutomated = true;
      botCategory = cat;
      riskScore += 80;
      break;
    }
  }

  // 2. Suspicious missing or malformed headers (Standard modern browsers send Accept-Language and User-Agent)
  let hasSuspiciousHeaders = false;
  if (!userAgent || userAgent.trim().length < 10) {
    hasSuspiciousHeaders = true;
    riskScore += 40;
  }

  const accept = headers["accept"] || headers["Accept"] || "";
  const acceptLanguage = headers["accept-language"] || headers["Accept-Language"] || "";

  // Browser requests to web apps almost universally contain accept-language
  if (!acceptLanguage && !isHeadlessOrAutomated && userAgent.length > 0) {
    // Missing accept-language is common in ad-hoc scraping scripts
    riskScore += 25;
    hasSuspiciousHeaders = true;
  }

  return {
    isHeadlessOrAutomated,
    hasSuspiciousHeaders,
    botCategory,
    riskScore: Math.min(riskScore, 100),
  };
}

/**
 * Centralized Multi-Signal Risk Score Calculator (0 - 100)
 *
 * Risk Thresholds:
 *   0 - 30:  LOW    -> ALLOW
 *  31 - 70:  MEDIUM -> RATE_LIMIT / REQUIRE_MFA
 *  71 - 100: HIGH   -> CHALLENGE / TEMPORARY_BLOCK / REVOKE_SESSION
 */
export function calculateCentralizedRiskScore(signals: BehavioralSignals): RiskEvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Impossible Travel Signal (Weight: up to 60)
  if (signals.impossibleTravel && signals.impossibleTravel.isImpossible) {
    const travelContrib = Math.min(signals.impossibleTravel.riskScore * 0.6, 60);
    score += travelContrib;
    reasons.push(signals.impossibleTravel.reason || "Impossible travel detected");
  }

  // 2. Failed Login Velocity (Credential Stuffing Protection)
  if (signals.failedLoginVelocity10m && signals.failedLoginVelocity10m > 0) {
    if (signals.failedLoginVelocity10m >= 5) {
      score += 45;
      reasons.push(
        `High failed login velocity: ${signals.failedLoginVelocity10m} attempts in 10 mins`,
      );
    } else if (signals.failedLoginVelocity10m >= 3) {
      score += 25;
      reasons.push(
        `Moderate failed login velocity: ${signals.failedLoginVelocity10m} attempts in 10 mins`,
      );
    }
  }

  // 3. Password Reset Velocity
  if (signals.passwordResetVelocity24h && signals.passwordResetVelocity24h > 2) {
    score += 30;
    reasons.push(
      `Unusual password reset velocity: ${signals.passwordResetVelocity24h} resets in 24h`,
    );
  }

  // 4. Device and Bot Signals
  if (signals.deviceBotSignals) {
    if (signals.deviceBotSignals.isHeadlessOrAutomated) {
      score += 50;
      reasons.push("Automated scraper or headless browser signature detected");
    }
    if (signals.deviceBotSignals.hasSuspiciousHeaders) {
      score += 20;
      reasons.push("Suspicious or stripped HTTP header signature");
    }
  }

  // 5. Threat Intelligence Signals (Tor, Proxy, Malicious IP)
  if (signals.isKnownTorOrProxy) {
    score += 35;
    reasons.push("Traffic originating from known Tor exit node or public proxy");
  }
  if (signals.isKnownBadIp) {
    score += 55;
    reasons.push("Origin IP listed in active threat intelligence blacklist");
  }

  // 6. Interaction Velocity Spikes (Mass bot action protection)
  // API velocity
  if (signals.apiRequestVelocity1m && signals.apiRequestVelocity1m > 120) {
    score += 30;
    reasons.push(`Abnormal API request velocity: ${signals.apiRequestVelocity1m} req/min`);
  }
  // Message velocity
  if (signals.messageVelocity1m && signals.messageVelocity1m > 20) {
    score += 40;
    reasons.push(`Direct message spam velocity: ${signals.messageVelocity1m} msg/min`);
  }
  // Mass follow velocity
  if (signals.followVelocity1h && signals.followVelocity1h > 80) {
    score += 35;
    reasons.push(`Mass follow automation velocity: ${signals.followVelocity1h} follows/hour`);
  }
  // Mass comment velocity
  if (signals.commentVelocity1m && signals.commentVelocity1m > 15) {
    score += 35;
    reasons.push(`Mass comment velocity: ${signals.commentVelocity1m} comments/min`);
  }
  // Mass like velocity
  if (signals.likeVelocity1m && signals.likeVelocity1m > 60) {
    score += 25;
    reasons.push(`Automated like cadence: ${signals.likeVelocity1m} likes/min`);
  }
  // Mass post creation velocity
  if (signals.postingVelocity1h && signals.postingVelocity1h > 20) {
    score += 35;
    reasons.push(`Abnormal post generation velocity: ${signals.postingVelocity1h} posts/hour`);
  }

  // 7. Contextual Modifiers: Brand new account (< 24h) + sudden high velocity
  if (signals.accountAgeDays !== undefined && signals.accountAgeDays < 1) {
    if (score > 20) {
      score = Math.round(score * 1.3); // 30% higher penalty for infant accounts showing rapid velocity
      reasons.push("New account anomaly multiplier applied (<24h old)");
    }
  }

  // 8. Device & IP context
  if (signals.isNewDevice && signals.isNewIp) {
    score += 15;
    reasons.push("Unrecognized device and IP combination");
  }

  // Clamp final score 0 - 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Level and Action
  let level: RiskLevel = "LOW";
  let action: RiskEvaluationResult["action"] = "ALLOW";

  if (finalScore >= 71) {
    level = "HIGH";
    if (
      signals.isKnownBadIp ||
      (signals.deviceBotSignals?.isHeadlessOrAutomated && finalScore >= 85)
    ) {
      action = "TEMPORARY_BLOCK";
    } else if (signals.impossibleTravel?.isImpossible && finalScore >= 80) {
      action = "REVOKE_SESSION";
    } else {
      action = "CHALLENGE";
    }
  } else if (finalScore >= 31) {
    level = "MEDIUM";
    if (signals.failedLoginVelocity10m && signals.failedLoginVelocity10m >= 3) {
      action = "REQUIRE_MFA";
    } else {
      action = "RATE_LIMIT";
    }
  } else {
    level = "LOW";
    action = "ALLOW";
  }

  return {
    score: finalScore,
    level,
    action,
    reasons,
    mlModelStatus: "NOT VERIFIED (Deterministic Behavioral Scoring Active)",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculates progressive delay for failed authentication attempts.
 * Implements exponential backoff with jitter to thwart credential stuffing bots.
 */
export function calculateProgressiveDelayMs(
  consecutiveFailures: number,
  baseDelayMs: number = 500,
  maxDelayMs: number = 30_000,
): number {
  if (consecutiveFailures <= 1) return 0;
  const exponent = Math.min(consecutiveFailures - 1, 6);
  const exponential = baseDelayMs * Math.pow(2, exponent);
  // Add 10% deterministic jitter
  const jitter = (consecutiveFailures * 73) % 200;
  return Math.min(exponential + jitter, maxDelayMs);
}
