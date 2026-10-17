# IndiaAI GPU Cloud onboarding — Opexnal

Status: planning only. No IndiaAI account, allocation, VM, or running inference has been created or verified.

## Correct onboarding path

Use the **end-user Compute Portal**, not the Cloud Service Provider (CSP) empanelment form. The CSP registration form is for providers offering cloud services; it asks for corporate/legal, financial, data-centre and compliance documents and is not the route for renting a GPU for Opexnal.

1. Open https://www.compute.indiaai.gov.in/login and read the current eligibility criteria.
2. Sign in using the portal's supported Meri Pehchaan route (DigiLocker, e-Pramaan or Jan Parichay).
3. Complete end-user registration under the category that genuinely applies and upload the required proof. Do not claim startup/academic eligibility unless the documents support it.
4. Wait for verification/approval. The portal says verification is required before requesting compute.
5. Prepare a short project proposal and draft bill of materials (GPU type, number of cards, expected hours, storage, duration, model and purpose), then submit a compute request and subsidy request if eligible.
6. Wait for allocation/approval and confirm the chosen empanelled service provider, region, instance availability, storage, networking, billing terms and taxes before incurring cost.
7. Only after allocation, provision the GPU host, install/check NVIDIA drivers and Container Toolkit, deploy the Compose stack, and run authenticated chat + embedding tests.

Official portal describes startup/MSME eligibility with DPIIT recognition and additional criteria; eligibility differs by applicant category. The portal also says requests below 5,000 GPU-hours are auto-approved and larger requests go to PMEC, subject to the portal's stated process and current rules. Requests are stated to be submitted between the 1st and 25th of the month; verify current dates and criteria on the portal before relying on them.

## Price examples from the official calculator

Source: https://compute.indiaai.gov.in/indiaaipricecalculator

The calculator currently lists these example on-demand rates:
- NVIDIA L40S.1x (48 GB): ₹67.50/GPU-hour.
- NVIDIA H100 SXM.1x (80 GB): ₹153.00/GPU-hour.
- NVIDIA H100 PCIe.1x (80 GB): ₹252.00/GPU-hour.

Illustrative continuous 730-hour month, GPU charges only:
- L40S.1x: ₹49,275.
- H100 SXM.1x: ₹111,690.
- H100 PCIe.1x: ₹183,960.

These are arithmetic estimates, not quotes or availability guarantees. The calculator states prices exclude GST and other taxes; storage, network, provider-specific charges, and any subsidy approval can change the final payable amount. Recalculate on the portal before ordering. Start with a short smoke-test allocation rather than a 24/7 reservation if the goal is only to prove model startup and inference.

## Opexnal integration gates (must pass before production)

- Pin a tested vLLM image version instead of using mutable `latest` for production.
- Verify the selected GPU supports the chosen model/quantization and context length; do not infer fit from GPU name alone.
- Pull `nomic-embed-text` and verify Ollama embedding dimensions against the application's expected schema.
- Keep ports 8000 and 11434 private; use a private network or authenticated TLS proxy between the app and GPU host. Vercel cannot resolve Compose-only hostnames such as `vllm` or `embeddings`.
- Run typecheck, lint, automated tests, adapter integration tests, authenticated `/v1/chat/completions`, and an embedding request; save logs/results with secrets redacted.
- Do not route user traffic or describe the service as live until the real chat response and embedding response have both passed.

## Current blockers

- Account/eligibility verification and GPU allocation have not happened.
- PR #3 is still draft. At the observed head commit, the combined status reports `Vercel – opexnal-connect: failure`; the `Vercel – opexnal` check was pending. The GitHub Actions workflow-run lookup returned no PR-triggered runs for that commit, so that lookup does not prove the automated test suite passed.
- The Compose file contains only vLLM and Ollama, not the Opexnal web app or reverse proxy.
- No cloud VM, model download, authenticated inference result, or app-level integration test has been verified.
