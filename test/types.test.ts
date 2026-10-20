import { describe, expect, it } from "vitest";

import type {
  Appearance,
  ApplePayConfig,
  ApplePayInstance,
  GooglePayConfig,
  LoadXMoneyOptions,
  PaymentCardConfig,
  PaymentFormConfig,
  SavedCardPaymentConfig,
  XMoney,
} from "../src";

describe("public contract", () => {
  it("rejects ignored members at compile time", () => {
    expect(ignoredMembers).toBeTypeOf("function");
  });

  it("accepts the options the checkout runtime still honors", () => {
    expect(acceptedMembers).toBeTypeOf("function");
  });
});

function ignoredMembers(): void {
  const apple = {} as ApplePayInstance;
  // @ts-expect-error updateLocale is not on Apple Pay
  apple.updateLocale("en-US");

  const form: PaymentFormConfig = {
    container: "checkout",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    card: {
      // @ts-expect-error cardholder name visibility is not configurable
      cardHolderName: { visible: false },
    },
  };

  const appearance: Appearance = {
    variables: {
      // @ts-expect-error fontFamily does not map to a stylesheet token
      fontFamily: "Arial",
    },
  };

  const backgroundFocus: Appearance = {
    variables: {
      // @ts-expect-error colorBackgroundFocus is not a stylesheet token
      colorBackgroundFocus: "#ffffff",
    },
  };

  const radioCheck: Appearance = {
    variables: {
      // @ts-expect-error radioCheckColor is set by the script from colorPrimary
      radioCheckColor: "#ffffff",
    },
  };

  const appleCardDetails: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Apple Pay only accepts applePay
      card: true,
    },
  };

  const appleGoogleDetails: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Apple Pay only accepts applePay
      googlePay: true,
    },
  };

  const googleCardDetails: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Google Pay only accepts googlePay
      card: true,
    },
  };

  const googleAppleDetails: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Google Pay only accepts googlePay
      applePay: true,
    },
  };

  const saved: SavedCardPaymentConfig = {
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    // @ts-expect-error saved card has no options
    options: { locale: "en-US" },
  };

  const loadOptions: LoadXMoneyOptions = {
    // @ts-expect-error the script URL is not configurable
    scriptUrl: "https://localhost:8080/xmoney.js",
  };

  void form;
  void appearance;
  void backgroundFocus;
  void radioCheck;
  void saved;
  void appleCardDetails;
  void appleGoogleDetails;
  void googleCardDetails;
  void googleAppleDetails;
  void loadOptions;
}

function acceptedMembers(): void {
  const form: PaymentFormConfig = {
    container: "checkout",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { card: true, applePay: true, googlePay: true },
  };

  const card: PaymentCardConfig = {
    container: "card",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { card: true, applePay: true, googlePay: true },
  };

  const applePay: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { applePay: true },
    options: { appearance: { variables: { colorBackground: "transparent" } } },
  };

  const googlePay: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { googlePay: true },
    options: { appearance: { variables: { colorBackground: "transparent" } } },
  };

  const xmoney = {} as XMoney;
  void xmoney.getPaymentMethodCapabilities({ timeout: 3000 });
  void form;
  void card;
  void applePay;
  void googlePay;
}
