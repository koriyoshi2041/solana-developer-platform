/**
 * SDP release channels: which product modules a deployment can run at all.
 *
 * A release channel is a ceiling, not a rollout. A module outside the deployment's
 * release channel is off everywhere (API, background jobs, dashboard) whatever its
 * feature flag says; a module inside it behaves exactly as its flags decide.
 * Bringing a module back is a reviewed change to this file, never an env var.
 *
 * `SDP_RELEASE_CHANNEL` selects the release channel. Unset means `preview`, today's behavior.
 */

import { z } from "zod";

export const SDP_MODULES = [
  "custody",
  "payments",
  "recurring_payments",
  "ramps",
  "compliance",
  "policies",
  "issuance",
  "markets",
  "earn",
  "dvp",
  "private_channels",
  "helius_rings",
] as const;

export type SdpModule = (typeof SDP_MODULES)[number];

/** Ordered from least to most mature. */
export const SDP_RELEASE_CHANNEL_NAMES = ["preview", "beta", "stable"] as const;

export type SdpReleaseChannel = (typeof SDP_RELEASE_CHANNEL_NAMES)[number];

/**
 * Each module's maturity. A release channel runs every module at or above its
 * own level, so each channel contains the more mature ones by construction.
 * Promoting a module is a one-line change here.
 */
export const SDP_MODULE_STAGES = {
  custody: "stable",
  payments: "stable",
  recurring_payments: "stable",
  compliance: "stable",
  ramps: "preview",
  policies: "preview",
  issuance: "preview",
  markets: "preview",
  earn: "preview",
  dvp: "preview",
  private_channels: "preview",
  helius_rings: "preview",
} as const satisfies Record<SdpModule, SdpReleaseChannel>;

export const DEFAULT_SDP_RELEASE_CHANNEL: SdpReleaseChannel = "preview";

const sdpReleaseChannelSchema = z.enum(SDP_RELEASE_CHANNEL_NAMES);

/**
 * Resolves `SDP_RELEASE_CHANNEL`. Unset or blank is the documented `preview` default.
 * Throws on an unknown name so a typo fails at boot instead of silently
 * running every module.
 */
export function resolveSdpReleaseChannel(value: string | undefined): SdpReleaseChannel {
  const name = value?.trim();
  if (!name) {
    return DEFAULT_SDP_RELEASE_CHANNEL;
  }
  const parsed = sdpReleaseChannelSchema.safeParse(name);
  if (!parsed.success) {
    throw new Error(
      `SDP_RELEASE_CHANNEL must be one of ${SDP_RELEASE_CHANNEL_NAMES.join(", ")}; got "${name}"`
    );
  }
  return parsed.data;
}

function maturity(releaseChannel: SdpReleaseChannel): number {
  return SDP_RELEASE_CHANNEL_NAMES.indexOf(releaseChannel);
}

export function isModuleInReleaseChannel(
  releaseChannel: SdpReleaseChannel,
  module: SdpModule
): boolean {
  return maturity(SDP_MODULE_STAGES[module]) >= maturity(releaseChannel);
}

function modulesInReleaseChannel(releaseChannel: SdpReleaseChannel): readonly SdpModule[] {
  return SDP_MODULES.filter((module) => isModuleInReleaseChannel(releaseChannel, module));
}

/** Each release channel's modules, derived from `SDP_MODULE_STAGES`. */
export const SDP_RELEASE_CHANNELS = {
  preview: modulesInReleaseChannel("preview"),
  beta: modulesInReleaseChannel("beta"),
  stable: modulesInReleaseChannel("stable"),
} as const satisfies Record<SdpReleaseChannel, readonly SdpModule[]>;
