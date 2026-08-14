# Releasing

No release command in this document should be automated without maintainer approval.

## Prerequisites

- Confirm the intended public repository URL and npm owner.
- Confirm the package name is still available or owned by the maintainer.
- Ensure the working tree contains no credentials, browser profiles, session logs, or private planning notes.
- Update `CHANGELOG.md` and the package version together.
- Treat every packed version as immutable. Package managers may keep a previously resolved tarball when the same version is repacked with different bytes.

## Verify

```sh
npm ci
npm run check
npm run smoke
npm run smoke:dsh
npm pack --dry-run
```

Run public-network tests separately because third-party availability can make them flaky:

```sh
npm run smoke:business
npm run test:real-world
```

Inspect the tarball contents:

```sh
npm pack
tar -tzf dsh-playwright-browser-<version>.tgz
```

Install that exact tarball into fresh `web` and `headless` profiles, run `dsh plugin --profile <profile> peers check`, and boot each required surface.

## Publish

Publishing changes external state. A maintainer must explicitly choose and run the command:

```sh
npm publish
```

After publishing, verify package metadata and install the registry artifact into a fresh DSH profile before creating a Git tag or GitHub release.

## Git release shape

Recommended order:

1. Merge source and documentation changes.
2. Merge a dedicated version/changelog change.
3. Publish the verified npm artifact.
4. Create an annotated tag matching the package version.
5. Push the tag and create release notes from `CHANGELOG.md`.

Do not commit generated browser evidence, local DSH homes, credentials, `node_modules`, tarballs, or internal planning files.
