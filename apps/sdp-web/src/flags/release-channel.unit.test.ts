import type { Adapter } from "flags";
import { describe, expect, it } from "vitest";
import { capAdapterToReleaseChannel } from "./release-channel";

const servesOn: Adapter<boolean, never> = {
  origin: "https://vercel.com/flags",
  decide: () => true,
};

function decide(adapter: Adapter<boolean, never>) {
  // SAFETY: neither adapter under test reads cookies; a real cookie store needs a request.
  return adapter.decide({ key: "flag", headers: new Headers(), cookies: new Map() as never });
}

describe("capAdapterToReleaseChannel", () => {
  it("keeps the flag's own adapter for a module inside the release channel", () => {
    expect(capAdapterToReleaseChannel("preview", "issuance", servesOn)).toBe(servesOn);
    expect(capAdapterToReleaseChannel("stable", "custody", servesOn)).toBe(servesOn);
  });

  it("turns an excluded module off whatever its adapter would serve", async () => {
    for (const module of ["issuance", "policies", "ramps", "earn", "markets"] as const) {
      const capped = capAdapterToReleaseChannel("stable", module, servesOn);
      expect(await decide(capped)).toBe(false);
      expect(capped.origin).toBe(servesOn.origin);
    }
  });
});
