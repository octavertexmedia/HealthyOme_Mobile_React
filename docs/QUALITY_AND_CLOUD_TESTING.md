# Local quality checks and device smoke tests

## Reproducible local checks

Install exactly the locked dependency tree and run all non-native checks:

```bash
npm ci
npm run check
```

The individual commands are:

- `npm run lint` — Expo's flat ESLint configuration.
- `npm run typecheck` — strict TypeScript compilation without output.
- `npm test` — Jest with the Expo preset, run serially for deterministic CI use.

`node_modules/`, generated native projects, coverage, and build output are not linted.

## Device smoke tests

The repository includes non-transactional Maestro flows in `.maestro/` for use
with locally built Android and iOS apps. No cloud workflow, paid testing setup,
account linkage, or automatic trigger is included.

The smoke tests stop at onboarding and location-choice UI. They do not
authenticate, create orders, initiate Razorpay, or write production data.

## Release configuration

- Native build numbers start at Android `versionCode` 1 and iOS `buildNumber`
  1. They are source-controlled in `app.json`.
  Before any store build, compare them with the latest Play Console and App
  Store Connect builds and increment them; this repository does not prove that
  1 is still accepted by either store.
- No runtime version policy or OTA update service is configured in `app.json`.
- Store builds must be produced and submitted explicitly with the team's chosen
  local/native release process.
- Sentry is compiled into native builds but remains disabled unless
  `EXPO_PUBLIC_SENTRY_DSN` is supplied. Native source-map upload additionally
  requires a Sentry auth token and project configuration; neither is stored in
  this repository. Local native builds pass `SENTRY_DISABLE_AUTO_UPLOAD=true`;
  the retained EAS profiles do not set that variable. Source-map upload requires
  the Sentry organization, project, and auth token to be configured securely.
- Android notifications use a native FCM token. FCM service configuration and
  iOS push support remain backend/credential-dependent and are not created by
  these files.

No GitHub Actions workflow is added because the repository owner reported that
the Actions artifact allowance is exhausted. The local `npm run check` command
can be wired into CI after storage and retention are addressed.

## Dependency advisory baseline

The direct Axios dependency and the transitive `shell-quote` package were
updated to patched, semver-compatible releases. This removed the only critical
advisory in the installed dependency tree.

`npm audit --omit=dev` still reports 66 transitive findings (51 high, 14
moderate, 1 low) inside the Expo/React Native/Metro and Tailwind toolchains.
NPM's proposed direct fixes require incompatible Expo, React Native, Expo
Router, Sentry, or Tailwind major-version changes (and in some cases an Expo
downgrade). Do not use `npm audit fix --force`. Re-evaluate these advisories as
part of a tested Expo SDK upgrade rather than overriding native dependency
versions independently.
