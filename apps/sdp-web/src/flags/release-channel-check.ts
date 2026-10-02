import {
  resolveSdpReleaseChannel,
  SDP_RELEASE_CHANNEL_NAMES,
  type SdpReleaseChannel,
} from "@sdp/types";
import { z } from "zod";

const apiHealthSchema = z.object({ releaseChannel: z.enum(SDP_RELEASE_CHANNEL_NAMES) });

type ReleaseChannelCheckEnv = Partial<
  Record<"SDP_RELEASE_CHANNEL" | "SDP_API_BASE_URL" | "NEXT_PUBLIC_SDP_API_BASE_URL", string>
>;

export type ReleaseChannelCheckResult =
  | { status: "match"; releaseChannel: SdpReleaseChannel }
  | { status: "mismatch"; web: SdpReleaseChannel; api: SdpReleaseChannel }
  | { status: "unavailable" };

/**
 * Compares this dashboard's release channel with the API's. The API enforces the
 * release channel either way; a mismatch only means the dashboard shows modules the API
 * refuses (or hides ones it serves), so it is logged loudly rather than fatal.
 */
export async function checkSdpReleaseChannelAgainstApi(
  env: ReleaseChannelCheckEnv,
  fetchImpl: typeof fetch
): Promise<ReleaseChannelCheckResult> {
  const web = resolveSdpReleaseChannel(env.SDP_RELEASE_CHANNEL);
  const base = (env.SDP_API_BASE_URL || env.NEXT_PUBLIC_SDP_API_BASE_URL)?.replace(/\/$/, "");
  if (!base) {
    return { status: "unavailable" };
  }

  let api: SdpReleaseChannel;
  try {
    const response = await fetchImpl(`${base}/health`, { signal: AbortSignal.timeout(5_000) });
    api = apiHealthSchema.parse(await response.json()).releaseChannel;
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "sdp_release_channel_check_unavailable",
        name: error instanceof Error ? error.name : "non-error",
      })
    );
    return { status: "unavailable" };
  }

  if (api !== web) {
    console.error(JSON.stringify({ event: "sdp_release_channel_mismatch", web, api }));
    return { status: "mismatch", web, api };
  }
  return { status: "match", releaseChannel: web };
}
