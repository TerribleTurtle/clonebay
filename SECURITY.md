<!-- markdownlint-disable MD013 -->
# Security Policy

The Clone Bay project takes security seriously. As a zero-backend, client-side web application designed for EVE Online multiboxers, user privacy and credential isolation are primary design priorities.

## Supported Versions

Security updates and patches are applied to the active development branch and published releases.

| Version | Supported |
| --- | --- |
| Latest release (`main` branch) | :white_check_mark: |
| Older releases | :x: |

Please ensure you are using the most recent build or deployment of Clone Bay.

## Reporting a Vulnerability

If you discover a security vulnerability in Clone Bay, please report it privately rather than opening a public issue.

1. Navigate to the **Security** tab of the repository on GitHub.
2. Select **Report a vulnerability** to open a Private Vulnerability Advisory.
3. Provide a detailed summary of the vulnerability, including:
   - A description of the issue and potential impact.
   - Clear step-by-step instructions or Proof of Concept (PoC) to reproduce the vulnerability.
   - Affected browser(s) and environment details.

You can expect an initial response acknowledging receipt within 48 hours, followed by coordinated disclosure and remediation timelines.

> [!IMPORTANT]
> Please do NOT file public GitHub issues for undisclosed security vulnerabilities.

## Scope

Security issues concerning the code and client-side architecture of Clone Bay are in scope:

- **Client-Side Token Management**: Storage, retrieval, and lifecycle of EVE SSO tokens in browser IndexedDB (`eve_auth_tokens`).
- **PKCE Flow Integrity**: Verification of OAuth 2.0 PKCE implementation (`code_verifier`, `code_challenge`, and cryptographic `state` parameters to prevent CSRF / interception).
- **Cross-Site Scripting (XSS) & Content Security Policy (CSP)**: Bypasses of CSP headers or injection vulnerabilities that could expose client-side storage.
- **Data Erasure Integrity**: Failure of the in-app terminal wipe mechanism (`useDataWipe`) to purge credentials and stored states.
- **Client-Side Data Exfiltration**: Any unexpected network requests leaking user credentials or character data to third-party endpoints.

## Out of Scope

The following areas are handled by external providers and are outside the scope of Clone Bay:

- **CCP Games Infrastructure & ESI**: Vulnerabilities in CCP's EVE Swagger Interface (ESI), server downtime, or ESI data discrepancies. Report ESI issues to CCP Games via [developers.eveonline.com](https://developers.eveonline.com).
- **CCP EVE SSO**: Vulnerabilities within CCP's OAuth authorization servers (`login.eveonline.com`). Report these directly to CCP Games via their official [Vulnerability Disclosure Policy](https://developers.eveonline.com).
- **Compromised Host Environment**: Vulnerabilities arising from local machine malware, malicious browser extensions, or physical access to an unlocked terminal.
- **Third-Party Hosting Provider**: Infrastructure vulnerabilities in Cloudflare Pages or Cloudflare's edge network (report directly to Cloudflare).
