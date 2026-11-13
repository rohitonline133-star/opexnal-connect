# Opexnal email and WhatsApp OTP

This feature is part of the existing first-party Node.js + PostgreSQL API. It intentionally keeps the current database architecture; it does not switch the app to Supabase.

## Migration
Run once against the same database used by the API:
`psql "$DATABASE_URL" -f backend/migrations/20261105_secure_email_whatsapp_otp.sql`

## API
- `POST /api/v1/auth/otp/send` JSON: `{"identifier":"user@example.com","channel":"email"}`
- `POST /api/v1/auth/otp/send` JSON: `{"identifier":"+919876543210","channel":"whatsapp"}`
- `POST /api/v1/auth/otp/verify` JSON: `{"identifier":"user@example.com","channel":"email","code":"123456"}`

The server generates the code. Never send a client-generated OTP. Codes are HMAC-hashed, expire in five minutes, are single-use, and allow at most five stored challenge attempts. Request throttles are process-local; use shared Redis rate limiting before multi-instance public launch.

## Email environment
Configure existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`. Optional `OPEXNAL_EMAIL_LOGO_URL` must be a public HTTPS image URL.

## Official WhatsApp Cloud API environment
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_OTP_TEMPLATE` — an approved WhatsApp template with one body text variable for the code
- `META_WHATSAPP_TEMPLATE_LANGUAGE` — e.g. `en`

Use a Meta-approved authentication/utility template and comply with WhatsApp opt-in and messaging policies. Do not use whatsapp-web.js for production OTP. Keep all credentials in the hosting provider's secret manager, never in Flutter or source control.

## Important authentication boundary
OTP verification currently verifies control of the supplied destination and consumes the challenge. It does not by itself create an account, link a phone number to a user, or issue a login session. The existing signup/login routes continue to enforce their current email verification and password/session rules. A separate account-linking policy and frontend flow are required before treating a verified phone as a login identity.
