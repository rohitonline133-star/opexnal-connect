# Opexnal GPU host: custom-kernel readiness and safe rollout

This is a preparation checklist, not an installation claim. No GPU host, driver, kernel, or inference service is operational until installed and verified on the target machine.

## 1. Collect hardware facts

Run the read-only inventory:

```bash
bash deploy/ai-gpu/host-inventory.sh
```

Record the exact GPU model, PCI ID and VRAM; CPU architecture; RAM and disk; Linux distribution/release; current kernel and matching headers; Secure Boot state; NVIDIA driver version.

## 2. Kernel strategy

**Start with the distribution-supported server kernel.** A custom kernel does not itself make AI inference faster. GPU execution depends on the GPU, supported NVIDIA driver, CUDA runtime, model and inference engine.

Build a custom kernel only when a documented requirement exists (required device driver, kernel config option, or reproducible upstream fix). Prefer a maintained Linux LTS source tree and a minimal, version-controlled config based on the distribution config. Avoid unreviewed patches and disabling kernel security features.

For NVIDIA's out-of-tree module:
- Install headers matching the exact kernel build.
- Confirm the chosen NVIDIA driver supports both the GPU and kernel.
- Confirm DKMS can build the module for the candidate kernel.
- If Secure Boot is enabled, plan module signing and key enrollment before reboot.
- Keep the current known-good kernel and boot entry installed.

## 3. Safe rollout

1. Back up important data and ensure console/out-of-band recovery access.
2. Build the candidate kernel as a separate package; never overwrite the working kernel.
3. Build/install the matching NVIDIA module for the candidate kernel.
4. Boot the candidate once from the boot menu; retain the old kernel for rollback.
5. Verify `uname -r`, `dmesg`, `nvidia-smi`, and `/dev/nvidia*`.
6. Verify NVIDIA Container Toolkit can expose the GPU to a test container.
7. Run model inference smoke tests; monitor temperature, VRAM, errors and sustained load.
8. Promote only after repeatable success and a tested rollback path.

Never remove the working kernel until replacement passes cold boot, driver, container and inference checks.

## 4. Acceptance criteria

- Intended kernel boots reliably after cold reboot.
- Expected GPU and driver are visible in `nvidia-smi`.
- No unresolved NVIDIA module, DKMS or Secure Boot errors remain.
- A container can see the GPU.
- Selected model loads within available VRAM and completes a local authenticated inference request.
- Monitoring, backups, access controls and recovery procedures are documented.

## 5. Blocker

The exact GPU model and server inventory are not confirmed. Therefore no specific kernel release, NVIDIA driver version, CUDA version or install command is safe to prescribe. Do not run a generic kernel installer on an unknown machine.

The inventory script is read-only. Before sharing its output, remove serial numbers, hostnames, public IPs and other identifiers.
