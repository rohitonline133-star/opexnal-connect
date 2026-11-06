import { Capacitor } from "@capacitor/core";
import {
  AppUpdate,
  AppUpdateAvailability,
  FlexibleUpdateInstallStatus,
} from "@capawesome/capacitor-app-update";
import { toast } from "sonner";

/**
 * Starts Google Play In-App Updates on Android.
 * This is a best-effort enhancement: failures must never block app startup.
 */
export async function checkForPlayStoreUpdates() {
  if (Capacitor.getPlatform() !== "android") return () => undefined;

  let active = true;
  let listener: { remove: () => Promise<void> } | undefined;

  try {
    listener = await AppUpdate.addListener("onFlexibleUpdateStateChange", (state) => {
      if (active && state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
        toast("Opexnal update is ready", {
          description: "Restart Opexnal to finish installing the update.",
          duration: Infinity,
          action: {
            label: "Restart",
            onClick: () => {
              void AppUpdate.completeFlexibleUpdate().catch(() => {
                toast.error("Update could not be completed. Please try again.");
              });
            },
          },
        });
      }
    });

    const info = await AppUpdate.getAppUpdateInfo();
    if (!active || info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
      return () => {
        active = false;
        void listener?.remove();
      };
    }

    if (info.updatePriority >= 4 && info.immediateUpdateAllowed) {
      await AppUpdate.performImmediateUpdate();
      return () => {
        active = false;
        void listener?.remove();
      };
    }

    const openStore = () => {
      void AppUpdate.openAppStore().catch(() => {
        toast.error("Could not open Google Play Store.");
      });
    };

    if (info.flexibleUpdateAllowed) {
      toast("A new Opexnal update is available", {
        description: "Download it in the background while you keep using Opexnal.",
        duration: Infinity,
        action: {
          label: "Update",
          onClick: () => {
            void AppUpdate.startFlexibleUpdate().catch(() => {
              toast.error("The update could not be started. Try Google Play Store.");
              openStore();
            });
          },
        },
        cancel: { label: "Later", onClick: () => undefined },
      });
    } else {
      toast("A new Opexnal update is available", {
        description: "Open Google Play Store to install the latest version.",
        duration: Infinity,
        action: { label: "Open Play Store", onClick: openStore },
      });
    }
  } catch {
    // Ignore update-check failures; app startup and core features remain available.
  }

  return () => {
    active = false;
    void listener?.remove();
  };
}
