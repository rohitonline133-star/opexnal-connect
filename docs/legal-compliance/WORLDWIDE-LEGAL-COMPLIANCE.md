# Opexnal Worldwide Legal Compliance Framework

**Status:** Planning baseline — not a legal certification, legal opinion, or launch approval.  
**Scope:** Opexnal social platform, web experience, Android/iOS clients, user-generated content, messaging, AI-assisted features, advertising, creator tools, payments and support.  
**Launch rule:** A country or territory must remain unavailable or have affected features disabled until its country-specific review is completed, required controls are implemented, evidence is recorded, and qualified local counsel approves the launch scope.

## 1. Non-negotiable launch gates

A global availability target does not override local law, sanctions, export controls, court orders, app-store rules, or network restrictions. Do not claim availability in all 195 commonly counted countries until each target market has been assessed. Country counts and recognition status can differ; maintain a reviewed jurisdiction register rather than hard-coding a political country count.

For each country/territory, record:
- jurisdiction name, ISO code, review date, reviewer and qualified local counsel;
- whether Opexnal may offer the service, and any registration, representative, licence or filing requirement;
- applicable privacy, data-protection, consumer, online-safety, child-safety, intermediary/platform, copyright, advertising, telecom/SMS, payments/tax and accessibility requirements;
- lawful age thresholds and any parental-consent / age-assurance requirements;
- data residency, localisation, international transfer, retention and government-access requirements;
- required notices, terms, language, complaint channels and response deadlines;
- approved features, prohibited/restricted features, launch decision, evidence links and next review date.

Allowed launch decisions: `NOT_REVIEWED`, `IN_REVIEW`, `BLOCKED`, `LIMITED_FEATURES`, `APPROVED`. Default must be `NOT_REVIEWED` and fail closed.

## 2. Privacy and personal data

Before launch, map every personal-data flow from collection to deletion, including analytics, crash logs, device identifiers, location, contacts, messages, photos/videos, biometrics (if any), AI prompts/outputs, advertising and payment records.

Required engineering and operational controls:
- collect only data necessary for a documented purpose; do not collect address-book, precise location, microphone, camera or photo-library data until the user invokes a feature that needs it and grants platform permission;
- document lawful basis/consent where required, purpose, retention, recipients and user rights;
- provide accessible privacy notices at or before collection and just-in-time notices for sensitive permissions;
- support access, correction, export, deletion, objection, restriction and consent withdrawal where applicable;
- define deletion propagation for primary databases, object storage, search indexes, caches, backups and subprocessors, with legally required retention exceptions documented;
- maintain records of processing, data inventory, retention schedule, DPIA/impact assessments where required, and a breach-response playbook;
- use encryption in transit and at rest, least-privilege access, audit logging, secrets management and tested backup/restore;
- execute appropriate processor agreements and maintain a subprocessor register;
- assess international transfers and implement required safeguards before transfer;
- do not use personal data for unrelated model training or advertising without a valid, clearly disclosed legal basis and required consent.

## 3. Children and teens

Age rules differ by jurisdiction and service type. Do not assume one global minimum age. Before country approval:
- obtain local advice on minimum age, parental consent, age assurance and child-directed service restrictions;
- apply age-appropriate defaults and privacy-protective settings;
- restrict targeted advertising and profiling for minors where required;
- prohibit grooming, exploitation, sexual exploitation material and unsafe contact patterns; provide reporting, escalation and preservation workflows required by law;
- provide child-friendly notices and effective guardian/parent processes where legally required;
- do not launch age-gated features in a market until reliable age and consent controls are reviewed.

## 4. User-generated content, safety and copyright

- publish clear content rules and explain reporting, review, removal, appeal and repeat-violator processes;
- provide report flows for illegal content, harassment, impersonation, exploitation, threats, self-harm encouragement, spam and copyright complaints;
- define trained escalation, response SLAs, evidence handling and lawful preservation;
- implement copyright notice/counter-notice or local equivalent only where applicable, with a designated contact and repeat-infringer policy where required;
- keep moderation decisions explainable and auditable; offer appeals where required;
- assess local intermediary/platform liability, notice-and-action, transparency reporting and regulator-contact requirements;
- do not promise end-to-end encryption or confidentiality unless the implementation has been independently verified.

## 5. Messaging, communications and telecom rules

Review each market for SMS/OTP sender registration, consent, sender ID, anti-spam, marketing opt-out, telecom licensing, retention and lawful-access rules. Separate security messages from marketing messages. Do not send promotional messages without the legally required permission. Provide abuse reporting and block controls for direct messaging.

## 6. Consumer, advertising, creator and payments

Before enabling monetisation in a market, review consumer disclosures, subscriptions, auto-renewal/cancellation, refunds, influencer disclosures, ad transparency, targeting restrictions, contest rules, tax/VAT/GST, payment-provider licensing and sanctions. Clearly label paid promotions and sponsored content. Keep payments disabled where required approvals or compliant providers are unavailable.

## 7. Security, incidents and government requests

Maintain an incident response plan with severity levels, evidence preservation, containment, regulator/user notification deadlines by jurisdiction, and post-incident review. Verify legal process before disclosing user data; disclose only the minimum legally required, record decisions, and publish transparency information where lawful. Maintain access logs and periodic access reviews.

## 8. Accessibility and language

Provide accessible interfaces and support flows. Review applicable accessibility requirements for each market. Translate core notices, terms, safety reporting and consent experiences into required/local languages; use qualified human review for legal translations. Do not rely on machine translation alone for binding legal text.

## 9. Illustrative legal review map (not exhaustive)

These are starting points for counsel research, not a statement that any single law applies to every Opexnal feature or that compliance has been achieved:
- European Union / EEA: GDPR and national implementing laws; Digital Services Act and other applicable consumer, ePrivacy, accessibility and child-safety rules.
- United Kingdom: UK GDPR, Data Protection Act 2018, Online Safety Act and applicable PECR/consumer rules.
- India: Digital Personal Data Protection Act and rules as in force, Information Technology Act and applicable intermediary rules, consumer and telecom requirements.
- United States: COPPA, applicable state privacy laws (including California laws), consumer-protection, child-safety, copyright and state-specific online-service requirements.
- Brazil: LGPD and applicable internet/consumer rules.
- Canada: PIPEDA and applicable provincial privacy and consumer laws.
- China: PIPL, Data Security Law, Cybersecurity Law and applicable content, licensing and cross-border transfer requirements.
- Japan: APPI and applicable platform/consumer rules.
- South Korea: PIPA and applicable network/platform rules.
- Australia: Privacy Act, Online Safety Act and applicable consumer rules.
- Other countries and territories: conduct individual local research and obtain local legal review; do not infer that regional similarity means identical obligations.

Laws, enforcement guidance and commencement dates change. Verify current official primary sources and local counsel advice at the time of each market review.

## 10. Evidence and release process

A market cannot move to `APPROVED` based only on a checklist or automated test. Required evidence:
1. signed country legal assessment by qualified counsel;
2. data-flow map and privacy impact assessment where required;
3. approved terms, privacy notice, cookie/consent notices and translations;
4. tested user-rights, deletion, retention, consent and age/guardian workflows;
5. tested moderation, copyright, complaints, appeals and lawful-request handling;
6. vendor/subprocessor contracts and transfer safeguards;
7. security assessment, incident plan and contact points;
8. feature-specific approvals for ads, AI, messaging, payments and creator monetisation;
9. documented launch owner sign-off and next review date.

Re-review on material product changes, new data uses/vendors, legal changes, incidents, or at least annually (more frequently where local counsel advises).

## 11. Immediate repository implementation backlog

- [ ] Create a maintained country/territory register with fail-closed launch status.
- [ ] Add server-side feature and market gating; never rely on client-only hiding.
- [ ] Inventory all data collection, processors, retention and cross-border flows.
- [ ] Verify account export/deletion and consent withdrawal end-to-end.
- [ ] Audit age handling and minor-protection defaults by market.
- [ ] Audit UGC reporting, moderation, appeals, copyright and escalation evidence.
- [ ] Audit cookies, analytics, ad tracking and consent controls.
- [ ] Audit OTP/SMS, email and marketing communications by destination market.
- [ ] Audit subscriptions, payments, creator payouts, tax and refunds before enabling them.
- [ ] Publish and localise legal documents only after counsel approval.
- [ ] Add automated tests proving unreviewed/blocked markets and restricted features fail closed.
- [ ] Keep a versioned evidence register for every market approval.

## 12. Disclaimer and accountability

This framework is an engineering planning document, not legal advice and not proof of compliance. It does not authorise launch in any country. The Opexnal operator remains responsible for appointing qualified counsel, providing accurate business and data-flow facts, implementing advice, and obtaining any required registrations, licences or approvals.
