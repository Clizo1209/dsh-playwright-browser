# Security policy

## Supported versions

Until the project reaches 1.0, security fixes are provided for the latest released minor version only.

| Version | Supported |
|---|---|
| Latest `0.x` | Yes |
| Older `0.x` | No |

## Reporting a vulnerability

When a public GitHub repository is available, use its private security-advisory feature. If that feature is unavailable, contact the maintainer through a non-public channel listed on the maintainer's repository profile.

Do not create a public issue that contains:

- credentials or authentication material;
- browser profiles, cookies, or local storage;
- private URLs or screenshots;
- a working exploit against a non-public system.

Include the affected version, environment, reproduction steps, impact, and any suggested mitigation. Maintainers should acknowledge a complete report within seven days and provide a status update within fourteen days.

## Security boundaries

This plugin automates a browser; it is not a network sandbox.

- Page content is untrusted.
- Only HTTP(S) and `about:` navigation is accepted.
- URLs with embedded credentials are rejected.
- Arbitrary page JavaScript evaluation is not exposed.
- A dedicated `userDataDir` must be used for persistent automation state.
- Screenshots and logs may contain page data and must be handled accordingly.
- Operators should apply egress, proxy, filesystem, and account controls appropriate to their deployment.

Consequential browser actions remain subject to user authorization and the surrounding DSH permission policy.
