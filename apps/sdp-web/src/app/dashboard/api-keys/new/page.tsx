import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { policies } from "@/flags";
import { getAuthEntryPath } from "@/lib/auth-entry";
import { resolveDashboardAccess } from "@/lib/dashboard-access";
import { createSdpApiClient } from "@/lib/sdp-api";
import { fetchApiKeyAuthoringWallets } from "../api-key-authoring.data";
import { ApiKeyAuthoringWorkspace } from "../api-key-authoring-workspace";

export const dynamic = "force-dynamic";

export default async function NewApiKeyPage() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) {
    redirect(await getAuthEntryPath());
  }
  if (!orgId) {
    redirect("/dashboard");
  }
  if (!resolveDashboardAccess(orgRole).capabilities.canManageApiKeys) {
    redirect("/dashboard/api-keys");
  }

  const [client, policiesEnabled] = await Promise.all([createSdpApiClient(), policies()]);
  const wallets = await fetchApiKeyAuthoringWallets(client, { policiesEnabled });
  return (
    <ApiKeyAuthoringWorkspace mode="create" wallets={wallets} policiesEnabled={policiesEnabled} />
  );
}
