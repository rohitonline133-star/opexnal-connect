#!/usr/bin/env bash
# Read-only GPU host inventory for Opexnal. Does not install or change anything.
set -u
section() { printf '\n===== %s =====\n' "$1"; }
section "OS"
if [ -r /etc/os-release ]; then
  . /etc/os-release
  printf 'NAME=%s\nVERSION=%s\nID=%s\n' "${NAME:-unknown}" "${VERSION_ID:-unknown}" "${ID:-unknown}"
else echo "/etc/os-release unavailable"; fi
section "Kernel"
uname -a
if [ -e "/lib/modules/$(uname -r)/build" ]; then echo "Kernel headers: present"; else echo "Kernel headers: missing"; fi
if command -v mokutil >/dev/null 2>&1; then mokutil --sb-state 2>&1 || true; else echo "Secure Boot: mokutil unavailable (status unknown)"; fi
section "CPU and memory"
if command -v lscpu >/dev/null 2>&1; then lscpu | grep -E 'Model name|Architecture|CPU\(s\)' || true; fi
if command -v free >/dev/null 2>&1; then free -h; fi
section "PCI display devices"
if command -v lspci >/dev/null 2>&1; then lspci -nnk | grep -A3 -Ei 'VGA compatible controller|3D controller|Display controller' || true; else echo "lspci unavailable"; fi
section "NVIDIA driver and GPU"
if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi; else echo "nvidia-smi unavailable; driver may not be installed or GPU may be absent"; fi
section "Container runtime"
if command -v docker >/dev/null 2>&1; then docker --version; else echo "Docker unavailable"; fi
if docker compose version >/dev/null 2>&1; then docker compose version; else echo "Docker Compose plugin unavailable"; fi
if command -v nvidia-ctk >/dev/null 2>&1; then nvidia-ctk --version; else echo "NVIDIA Container Toolkit unavailable"; fi
section "Disk"
df -h / 2>/dev/null || true
echo
echo "Inventory complete. This script is read-only."
