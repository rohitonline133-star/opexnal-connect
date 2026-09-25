# Opexnal Edge Security & DDoS Mitigation Verification Runbook

## Status: PROVIDER CONFIGURATION REQUIRED

> **Architectural Constraint:** Upstream Anycast DNS routing, multi-gigabit Layer 3/4 volumetric DDoS mitigation, and Cloudflare Edge WAF rules operate at the global edge network boundary and require deployment via `terraform/edge-security.tf` with the cloud provider credentials. Application code cannot simulate or claim provider-side Anycast DDoS protection without provider verification.

---

## 1. Edge Provider Architecture Overview

```text
GLOBAL CLIENT REQUEST
   │
   ▼
[ 1. CLOUDFLARE ANYCAST EDGE ]
   ├─ DNS Resolution (Proxied, CNAME/A records)
   ├─ TLS 1.3 Termination (Strict SSL / HSTS preload)
   ├─ L3/4 & L7 Volumetric DDoS Mitigation
   ├─ Edge WAF (OWASP Core Ruleset, Scanner Blocking)
   ├─ Bot Management & Rate Limiting (/auth: 15 req/m, /api/ai: 20 req/m)
   ├─ Transform Rule: Injects Header `X-Origin-Verify: <ORIGIN_VERIFY_TOKEN>`
   │
   ▼ (mTLS / Authenticated Origin Pulls)
[ 2. OPEXNAL ORIGIN RUNTIME ]
   ├─ Layer 1: inspectRequestWaf() (Payload sanitization: SQLi, XSS, Path Traversal, SSRF)
   ├─ Layer 2: verifyOriginSecret() (Constant-time token validation against ORIGIN_VERIFY_TOKEN)
   ├─ Layer 3: checkEdgeTierRateLimit() (Multi-tier origin sliding-window limiter)
   ├─ Layer 4: ML & Behavioral Security Pipeline (evaluateIpReputation, impossibleTravel)
   └─ Layer 5: TanStack React Start SSR Application
```

---

## 2. Production Edge Verification Runbook & Commands

Execute these verification checks against the production domain (`opexnal.com`) and origin endpoint:

### Check 1: DNS Proxying & Anycast Verification

Verify that DNS queries resolve to Cloudflare Anycast edge IP ranges (not origin server IP):

```bash
# Verify DNS is proxied through Cloudflare edge (IP should belong to AS13335 Cloudflare)
dig +short opexnal.com
nslookup opexnal.com

# Inspect whois on the resolved IP to ensure origin IP is never exposed publicly
whois $(dig +short opexnal.com | head -n1) | grep -i "org-name\|OrgName"
```

**Pass Criteria:** Resolved IP belongs to Cloudflare Anycast CIDRs (e.g. `104.16.0.0/12`, `172.64.0.0/13`). Origin IP is NOT visible in public DNS.

---

### Check 2: TLS 1.3 & Security Headers Verification

Verify that legacy SSL/TLS versions (< 1.3) are rejected, and HSTS preload headers are present:

```bash
# Test TLS 1.3 handshake
openssl s_client -connect opexnal.com:443 -tls1_3 </dev/null 2>/dev/null | grep "Protocol"
# Expected: Protocol  : TLSv1.3

# Test that insecure TLS 1.0/1.1/1.2 are rejected if strict TLS 1.3 is enforced
openssl s_client -connect opexnal.com:443 -tls1 </dev/null 2>/dev/null
openssl s_client -connect opexnal.com:443 -tls1_1 </dev/null 2>/dev/null

# Verify Edge & Origin Security Headers
curl -sI https://opexnal.com/ | grep -Ei "strict-transport-security|content-security-policy|x-frame-options|x-content-type-options"
```

**Pass Criteria:** Returns `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.

---

### Check 3: Edge WAF & Scanner Blocking Verification

Verify that offensive scanners (e.g. sqlmap, nikto) and malicious query injections are blocked:

```bash
# 1. Scanner User-Agent rejection (HTTP 403)
curl -sI -A "sqlmap/1.7.2#stable" https://opexnal.com/api/health | head -n 1
# Expected: HTTP/2 403

# 2. SQL injection payload rejection (HTTP 400 or 403)
curl -sI "https://opexnal.com/search?q=1%20UNION%20SELECT%20username,password%20FROM%20users" | head -n 1
# Expected: HTTP/2 400 or 403

# 3. Path Traversal rejection (HTTP 400)
curl -sI "https://opexnal.com/api/file?path=../../../../etc/passwd" | head -n 1
# Expected: HTTP/2 400

# 4. SSRF & Cloud Metadata rejection (HTTP 403)
curl -sI "https://opexnal.com/api/proxy?url=http://169.254.169.254/latest/meta-data/" | head -n 1
# Expected: HTTP/2 403
```

---

### Check 4: Origin Protection Verification (Fail-Closed & Token Validation)

Verify that direct origin traffic without the trusted `X-Origin-Verify` token is blocked:

```bash
# 1. Direct origin request with MISSING token (must return 403 Forbidden)
curl -sI -H "Host: opexnal.com" https://<ORIGIN_IP>/api/health
# Expected: HTTP/1.1 403 Forbidden
# Body: {"error":"Access Denied: Direct origin access is prohibited."}

# 2. Direct origin request with INVALID token (must return 403 Forbidden)
curl -sI -H "Host: opexnal.com" -H "X-Origin-Verify: invalid-token-attack" https://<ORIGIN_IP>/api/health
# Expected: HTTP/1.1 403 Forbidden

# 3. Direct origin request with VALID token (must return 200 OK)
curl -sI -H "Host: opexnal.com" -H "X-Origin-Verify: ${ORIGIN_VERIFY_TOKEN}" https://<ORIGIN_IP>/api/health
# Expected: HTTP/1.1 200 OK
```

---

### Check 5: Edge Rate Limiting Verification

Verify that authentication endpoints throttle automated requests beyond the configured 15 req/min threshold:

```bash
# Execute rapid burst against /api/auth endpoint
for i in {1..20}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://opexnal.com/api/auth/session)
  echo "Request $i: HTTP $status"
done
```

**Pass Criteria:** Requests 1–15 succeed (HTTP 200/401); requests 16–20 return HTTP 429 Too Many Requests with `Retry-After` header.

---

## 3. Trusted Verification Signal Injection Mechanism

In production:

1. The origin server runs in an isolated private VPC (or security group) allowing ingress ONLY from Cloudflare public IP ranges (`https://www.cloudflare.com/ips/`).
2. Cloudflare Transform Rules (`cloudflare_ruleset.opexnal_inject_origin_token` in `terraform/edge-security.tf`) automatically append the secret header:
   `X-Origin-Verify: <ORIGIN_VERIFY_TOKEN>`
   to all requests forwarded from the edge to the origin.
3. The origin inspects this header using `verifyOriginSecret()` with `crypto.timingSafeEqual()`.
4. In production mode, if `ORIGIN_VERIFY_TOKEN` is unconfigured, the application fails closed to prevent accidental open access.
