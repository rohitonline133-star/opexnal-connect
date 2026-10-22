# Opexnal SSL pinning and reverse proxy rollout

## Current repository status

- The repository contains a Node/TanStack server entry point and a Capacitor Android dependency.
- No checked-in native `android/` project or production Nginx configuration was found during this review.
- `deploy/nginx/opexnal.conf.example` is a deployment template only. It does not configure Vercel or any live server by itself.
- SSL pinning cannot be reliably enforced by ordinary browser JavaScript. Add it in the native Android networking layer (and test the actual HTTP client used by the app).

## Reverse proxy rollout (self-hosted VPS)

1. Point the intended domain's DNS A/AAAA records to the VPS. Do not change DNS until the server is ready.
2. Run the Node app on loopback only (for example, `127.0.0.1:3000`); do not expose port 3000 publicly.
3. Install Nginx and obtain a valid certificate for the real domain using a trusted ACME client.
4. Copy `deploy/nginx/opexnal.conf.example` into the Nginx sites configuration and replace every `REPLACE_WITH_YOUR_DOMAIN` and certificate path placeholder.
5. Validate with `sudo nginx -t`; only if it passes, reload with `sudo systemctl reload nginx`.
6. Confirm HTTP redirects to HTTPS, the certificate chain is valid, WebSocket behavior needed by the app works, uploads fit the chosen size limit, and API rate limits do not block normal users.
7. Restrict firewall access to ports 80/443 (plus SSH from a trusted source). Keep the app port private. Configure log rotation, backups, monitoring, and a tested certificate renewal process.
8. Do not use this template as a Vercel configuration. Vercel-managed hosting does not give this repository control over its edge Nginx configuration; deploy the proxy on infrastructure you administer or use the hosting platform's supported routing features.

## Android certificate/public-key pinning

1. First identify the actual Android app package, native project, and HTTP stack (native OkHttp/Cronet versus a Capacitor WebView). This repository currently does not contain the native `android/` project, so pinning cannot yet be applied and tested end-to-end here.
2. Prefer pinning the server certificate's Subject Public Key Info (SPKI) SHA-256, not a short-lived leaf-certificate fingerprint. Obtain the pin from the real production certificate chain using a trusted local OpenSSL workflow and independently verify it.
3. Configure the app's real HTTPS hostname only. Never pin development localhost or a guessed domain.
4. Ship at least one independently verified backup pin for a key you control and can rotate to. Keep the backup private key offline/secure and document the rotation/incident procedure before enabling enforcement.
5. Enforce HTTPS and reject cleartext traffic. Test valid current certificate, invalid certificate, expired certificate, normal renewal, backup-key rotation, redirects, API requests, and every network stack the app uses.
6. A Network Security Config applies to Android platform networking that honors it; it does not automatically pin all traffic made by every third-party/native networking library. Verify the chosen HTTP client explicitly.
7. Never enable a placeholder pin or a guessed pin. A bad pin can lock every installed app out of the service. Roll out with a tested recovery/rotation plan.

## Verification required before release

- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` in the actual repository checkout.
- Validate Nginx syntax on the target server and run external TLS checks against the real domain.
- Test Android pinning on a real build/device, including certificate renewal and backup-pin rotation.
- Confirm the deployment and the live domain only after the hosting/server owner has applied the configuration.