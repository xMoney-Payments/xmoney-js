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

### Customer details

`paymentForm` and `paymentCard` take `customerDetails`. `fields` replaces the server field list: a missing key counts as `false`. `defaultValues` prefills the card form. `country` is an ISO 3166-1 alpha-2 code, `phone` is E.164 and starts with `+`, and `region` is a subdivision name for that country. Values for inactive blocks are ignored. Standalone `applePay` and `googlePay` accept `fields` and their own collection flag.

```ts
customerDetails: {
  card: true,
  fields: { fullName: true, email: true, phone: true, address: true },
  defaultValues: {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+40722123456',
    country: 'RO',
    region: 'București',
    city: 'Bucharest',
    postalCode: '010101',
    address: '1 Example Street',
  },
},
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
