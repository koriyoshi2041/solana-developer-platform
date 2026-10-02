# ADR 0005: Release channels

- **Status:** Proposed
- **Date:** 2026-10-02
- **Deciders:** SDP engineering
- **Related:** `packages/sdp-types/src/release-channels.ts`; `apps/sdp-api/src/lib/feature-flags.ts`; `apps/sdp-web/src/flags/release-channel.ts`

## Context

Deployments need to run different subsets of SDP modules. Module flags are set
individually per environment, in Terraform for the API and in Doppler/Vercel
for the dashboard. Issuance, Policies and Ramps have no API flag: their
dashboard flags hide the UI, but the API still serves their routes.

## Decision

`SDP_RELEASE_CHANNEL` selects a release channel: the set of modules a
deployment can run.

- A module outside the release channel is disabled in the API, background jobs
  and dashboard, regardless of its flag. Inside it, module flags apply as before.
- Each module has a maturity stage in code (`SDP_MODULE_STAGES`). A release
  channel runs every module at or above its own level, so each channel contains
  the more mature ones. A test pins the `stable` module list.
- An unknown release channel fails at startup. Managed production must set it
  explicitly.

| Release channel | Modules                                           | Deployments                                  |
| --------------- | ------------------------------------------------- | -------------------------------------------- |
| `stable`        | Custody, Payments, Recurring payments, Compliance | Production                                   |
| `beta`          | `stable` plus modules in final validation         | Stage                                        |
| `preview`       | All modules                                       | Development, previews, self-hosted (default) |

A module is promoted by changing its stage: `preview` to `beta` to validate it on
stage, then `beta` to `stable` to ship it in the next production release.
Production deploys tagged releases from `main`, so `beta` keeps a module under
validation out of production releases, including hotfixes.

Release channel names describe maturity rather than network, because one
deployment serves both devnet and mainnet projects. `dev`, `edge` and `canary`
already have other meanings in this repository. "Release channel" follows Rust
and Chrome; "edition" usually names a commercial tier, and "channel" alone
already names the Private Channels module.

## Consequences

- Each module needs an API gate. A route inventory test requires every API route
  to belong to a module or to core.
- Code for excluded modules still ships in the image.
