import { vercelAdapter } from "@flags-sdk/vercel";
import {
  isModuleInReleaseChannel,
  resolveSdpReleaseChannel,
  type SdpModule,
  type SdpReleaseChannel,
} from "@sdp/types";
import type { Adapter } from "flags";

/**
 * Caps a module flag at the deployment's release channel. Inside the release channel the flag
 * keeps its own adapter untouched; outside it the flag is off whatever Vercel,
 * the env fallback, or `defaultValue` would serve.
 */
export function capAdapterToReleaseChannel<EntitiesType>(
  releaseChannel: SdpReleaseChannel,
  module: SdpModule,
  adapter: Adapter<boolean, EntitiesType>
): Adapter<boolean, EntitiesType> {
  if (isModuleInReleaseChannel(releaseChannel, module)) {
    return adapter;
  }
  return { origin: adapter.origin, decide: () => false };
}

/** The Vercel adapter for a module flag, capped at `SDP_RELEASE_CHANNEL`. */
export function releaseChannelAdapter<EntitiesType>(
  module: SdpModule
): Adapter<boolean, EntitiesType> {
  return capAdapterToReleaseChannel(
    resolveSdpReleaseChannel(process.env.SDP_RELEASE_CHANNEL),
    module,
    vercelAdapter<boolean, EntitiesType>()
  );
}
