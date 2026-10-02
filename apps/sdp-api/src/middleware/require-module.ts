import type { SdpModule } from "@sdp/types";
import type { Context, Next } from "hono";
import { forbidden } from "@/lib/errors";
import { isModuleAvailable } from "@/lib/feature-flags";
import type { Env } from "@/types/env";

/**
 * Refuses every request to a module the deployment's release channel leaves out.
 * Mount it ahead of auth so an excluded module answers the same to everyone.
 */
export function requireModule(module: SdpModule) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    if (!isModuleAvailable(c.env, module)) {
      throw forbidden(`The ${module} module is not available in this release channel.`);
    }
    await next();
  };
}
