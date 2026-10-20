# @xmoney/xmoney-js

Loads the [xMoney Checkout](https://secure.xmoney.com/sdk/v2/xmoney.js) browser script and exports TypeScript types for every public factory, config, event, and instance method.

This package does not reimplement checkout. `loadXMoney()` injects `xmoney.js`, which sets `window.XMoney`. Live and stage are chosen by the script from each widget's `publicKey`.

This package loads `/sdk/v2/xmoney.js`. A new script API is a new major of this package.

## Install

```bash
npm install @xmoney/xmoney-js
```

## Usage

```ts
import { loadXMoney } from '@xmoney/xmoney-js';

const xmoney = await loadXMoney();
```

A second call reuses the same promise. Pass a CSP nonce when the page requires one:

```ts
const xmoney = await loadXMoney({ nonce });
```

Every factory takes `publicKey`, `orderPayload`, and `orderChecksum`. `paymentForm`, `paymentCard`, `applePay`, and `googlePay` also take a `container`.

### `paymentForm`

```ts
const form = await xmoney.paymentForm({
  container: document.getElementById('checkout')!,
  publicKey,
  orderPayload,
  orderChecksum,
  paymentMethods: {
    applePay: { enabled: true, appearance: { type: 'pay', style: 'black' } },
    googlePay: { enabled: true, appearance: { type: 'pay', color: 'black' } },
  },
  onPaymentComplete(transaction) {
    console.log(transaction.id);
  },
});

const validation = await form.validate();
if (validation.isValid) form.submit();

await form.updateOrder({ orderPayload: nextPayload, orderChecksum: nextChecksum });
form.updateLocale('ro-RO');
form.updateAppearance({ theme: 'dark' });
form.destroy();
```

### `paymentCard`

Card fields with your own Pay button. `validate`, `submit`, `updateOrder`, `updateLocale`, `updateAppearance`, and `destroy` match `paymentForm`.

```ts
const card = await xmoney.paymentCard({
  container: document.getElementById('card')!,
  publicKey,
  orderPayload,
  orderChecksum,
  card: { submitButton: { visible: false } },
  onPaymentComplete(transaction) {
    console.log(transaction.id);
  },
});

await card.validate();
card.submit();
```

### `applePay`

`updateOrder` and `destroy` match `paymentForm`. Check `getPaymentMethodCapabilities` before mounting.

```ts
const applePay = await xmoney.applePay({
  container: document.getElementById('apple-pay')!,
  publicKey,
  orderPayload,
  orderChecksum,
  options: { appearance: { type: 'pay', style: 'black' } },
  onPaymentComplete(transaction) {
    console.log(transaction.id);
  },
});

await applePay.updateOrder({ orderPayload: nextPayload, orderChecksum: nextChecksum });
applePay.destroy();
```

### `googlePay`

`updateOrder` and `destroy` match `paymentForm`.

```ts
const googlePay = await xmoney.googlePay({
  container: document.getElementById('google-pay')!,
  publicKey,
  orderPayload,
  orderChecksum,
  options: { appearance: { type: 'pay', color: 'black' } },
  onPaymentComplete(transaction) {
    console.log(transaction.id);
  },
});

await googlePay.updateOrder({ orderPayload: nextPayload, orderChecksum: nextChecksum });
googlePay.destroy();
```

### `savedCardPayment`

No container. Your page lists the saved cards and calls `pay`. `updateOrder` and `destroy` match `paymentForm`.

```ts
const saved = await xmoney.savedCardPayment({
  publicKey,
  orderPayload,
  orderChecksum,
  onPaymentComplete(transaction) {
    console.log(transaction.id);
  },
});

saved.pay({ cardId });
```

### `getPaymentMethodCapabilities`

```ts
const { applePay, googlePay } = await xmoney.getPaymentMethodCapabilities({ timeout: 3000 });

console.log(applePay.supported, applePay.reason);
console.log(googlePay.supported, googlePay.reason);
```
