# Opexnal SSL pinning and reverse proxy rollout

## Important domain blocker

The supplied host, `opexnal-connect.vercel.app`, is a Vercel-provided deployment hostname, not a domain zone the Opexnal owner can repoint to an arbitrary VPS. Keep the current Vercel deployment intact while preparing the VPS. For a self-hosted Nginx endpoint, use a custom domain/subdomain you own and can configure in DNS (for example, `api.YOUR-OWNED-DOMAIN`); do not use the example literally.

Before changing traffic, confirm domain ownership and decide whether the VPS will serve the whole app or only the API. The Nginx example is a template, not a live configuration.

## Current repository status

- The repository contains a Node/TanStack server entry point and a Capacitor Android dependency.
- No checked-in native `android/` project was found in the repository tree during this review.
- `deploy/nginx/opexnal.conf.example` is a deployment template only. It does not configure Vercel or any live server by itself.
- `deploy/systemd/opexnal.service.example` is a sample service unit. Review paths, service account, writable directories, and environment variables before installing it.
- SSL pinning cannot be reliably enforced by ordinary browser JavaScript. Add it in the native Android networking layer and test the actual HTTP client used by the app.

## Reverse proxy rollout (self-hosted VPS)

1. Obtain a VPS and a custom domain/subdomain you control. Add DNS records for that domain to the VPS public IP; do not change the existing Vercel hostname.
2. Deploy the built Node app on the VPS. Run it as a dedicated unprivileged user and bind the app to loopback only (for example, `127.0.0.1:3000`); do not expose port 3000 publicly.
3. Prepare the environment file with real production secrets, owned by root and readable only by root/the service account as appropriate. Never commit real secrets to GitHub.
4. Install Nginx and obtain a valid certificate for the real custom domain using a trusted ACME client.
5. Copy `deploy/nginx/opexnal.conf.example` into the Nginx sites configuration and replace every `REPLACE_WITH_YOUR_DOMAIN` and certificate path placeholder.
6. Review `deploy/systemd/opexnal.service.example`, change paths/users if needed, and install it only after the build output and environment file are present.
7. Validate the Nginx configuration before reloading it. Check service status and logs before routing real users.
8. Confirm HTTP redirects to HTTPS, the certificate chain is valid, required WebSocket behavior works, uploads fit the configured size limit, and API rate limits do not block normal users.
9. Restrict firewall access to ports 80/443 and SSH from a trusted source. Keep the app port private. Configure log rotation, backups, monitoring, and tested certificate renewal.
10. Test the VPS endpoint independently before changing app/API URLs. Keep the existing Vercel deployment available as a rollback until the migration is verified.

## Android certificate/public-key pinning

1. First identify the actual Android app package, native project, and HTTP stack (native OkHttp/Cronet versus a Capacitor WebView). This repository currently does not contain the native `android/` project, so pinning cannot yet be applied and tested end-to-end here.
2. Decide the final custom HTTPS hostname before calculating pins. Do not create pins for `opexnal-connect.vercel.app` if the intended endpoint will move to a different hostname.
3. Prefer pinning the server certificate's Subject Public Key Info (SPKI) SHA-256, not a short-lived leaf-certificate fingerprint. Obtain the pin from the real production certificate chain and independently verify it.
4. Configure the app's actual HTTPS hostname only. Never pin development localhost or a guessed domain.
5. Ship at least one independently verified backup pin for a key you control and can rotate to. Keep the backup private key secure and document the rotation/incident procedure before enabling enforcement.
6. Enforce HTTPS and reject cleartext traffic. Test valid current certificate, invalid certificate, expired certificate, normal renewal, backup-key rotation, redirects, API requests, and every network stack the app uses.
7. A Network Security Config applies to Android platform networking that honors it; it does not automatically pin all traffic made by every third-party/native networking library. Verify the chosen HTTP client explicitly.
8. Never enable a placeholder pin or a guessed pin. A bad pin can lock every installed app out of the service. Roll out with a tested recovery/rotation plan.

## Verification required before release

- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` in the actual repository checkout.
- Validate Nginx syntax on the target VPS and run TLS checks against the real custom domain.
- Test Android pinning on a real build/device, including certificate renewal and backup-pin rotation.
- No live VPS deployment or Android pinning has been performed by this documentation change.
