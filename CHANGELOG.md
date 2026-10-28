# Changelog

All notable changes to `@xmoney/xmoney-js` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `customerDetails.fields` selects which blocks the checkout collects (`fullName`, `email`, `phone`, `address`) and replaces the server field list. `customerDetails.defaultValues` prefills the card form.

## [0.0.1] - 2026-10-20

First public release.

### Added

- `loadXMoney()` loads `https://secure.xmoney.com/sdk/v2/xmoney.js` once and returns `window.XMoney`. A later call reuses the same promise.
- The loader refuses a `window.XMoney` that was set by a different script, and accepts an optional CSP `nonce` on the injected tag.
- TypeScript types for `paymentForm`, `paymentCard`, `savedCardPayment`, `googlePay`, `applePay`, and `getPaymentMethodCapabilities`.
- ESM and CommonJS builds.
- An HTML and TypeScript examples app that calls `loadXMoney()` directly.
