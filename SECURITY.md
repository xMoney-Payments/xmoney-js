# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |

## Reporting a vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

Email **it-team@xmoney.com** with:

- a clear description of the issue
- steps to reproduce
- impact (what an attacker could do)

Expect an initial response within **5 business days**. We will coordinate a fix and disclosure.

## Scope

This policy covers the published `@xmoney/xmoney-js` package: `loadXMoney()` and the TypeScript types it ships.

The hosted checkout script (`https://secure.xmoney.com/sdk/v2/xmoney.js`) is xMoney Checkout. Report issues in that script to the same address.

Issues in merchant sites, backends, or non-SDK xMoney products are out of scope here — contact your xMoney account team.

## Hard rules for integrators

- Put only the publishable `publicKey` (`pk_test_…` / `pk_live_…`) in the browser page.
- Keep secret / private API keys on your server. Create orders server-side.
- Never commit live keys, order payloads with secrets, or card data to source control.
- Use sandbox keys during development.
- Do not log PAN or CVV. This package never receives them; report any suspected leakage of card data immediately.

## Card data (reality)

This package does not collect or transmit card data. `loadXMoney()` only injects the hosted script.

Card entry runs in iframes created by that script. PAN and CVV stay out of the merchant page and out of this package. They are sent over HTTPS to xMoney’s PCI DSS Level 1 backends (`secure*.xmoney.com` for payment; `api-*-next.xmoney.com` for optional account validation).

## Script loading

`loadXMoney()` injects only `https://secure.xmoney.com/sdk/v2/xmoney.js`. It does not accept a merchant-supplied URL, and it refuses a `window.XMoney` that was set by a different script.

Subresource Integrity is **not** set on the script tag. For v0.x we **accept** the residual risk that a compromise of that host, or of a trust store that can intercept the HTTPS request, could serve a different script. Revisit SRI if the threat model or merchant compliance requirements change.
