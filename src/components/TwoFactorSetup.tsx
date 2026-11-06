export function TwoFactorSetup() {
  return (
    <section
      aria-labelledby="mfa-status-title"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <h3 id="mfa-status-title" className="text-sm font-semibold">
        Authenticator two-factor authentication
      </h3>
      <p className="text-sm text-muted-foreground" role="status">
        Two-factor authentication is not available yet. Opexnal's first-party sign-in service
        must support securely stored authenticator factors and verify them during every sign-in
        before this protection can be enabled.
      </p>
      <p className="text-xs text-muted-foreground">
        No QR code or backup codes have been generated, and this account is not marked as protected
        by authenticator-based two-factor authentication.
      </p>
    </section>
  );
}
