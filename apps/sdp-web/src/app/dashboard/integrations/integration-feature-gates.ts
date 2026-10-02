import { COMPLIANCE_PROVIDERS, RAMP_PROVIDERS } from "@sdp/types";
import { isKnownCustodyProvider } from "@/app/dashboard/custody/provider-catalog";
import type { IntegrationFamily } from "./integrations-filter";

export type IntegrationFeatureFlags = {
  custody: boolean;
  /** Payments on and at least one ramp provider enabled (`isRampsEnabled`). */
  ramps: boolean;
  policies: boolean;
  privateChannels: boolean;
};

/**
 * Product-owned integration families follow the same release switch as their
 * dashboard module. RPC remains generally available because it is platform
 * infrastructure rather than a gated product workspace.
 */
export function isIntegrationFamilyEnabled(
  family: IntegrationFamily,
  flags: IntegrationFeatureFlags
): boolean {
  switch (family) {
    case "custody":
      return flags.custody;
    case "ramps":
      return flags.ramps;
    case "compliance":
      return flags.policies;
    case "privacy":
      return flags.privateChannels;
    case "rpc":
      return true;
  }
}

/** Keeps provider deep links aligned with the families shown in the catalog. */
export function isIntegrationProviderEnabled(
  provider: string,
  flags: Pick<IntegrationFeatureFlags, "custody" | "ramps" | "policies">
): boolean {
  if (isKnownCustodyProvider(provider)) return flags.custody;
  if ((RAMP_PROVIDERS as readonly string[]).includes(provider)) return flags.ramps;
  if ((COMPLIANCE_PROVIDERS as readonly string[]).includes(provider)) return flags.policies;
  return true;
}
