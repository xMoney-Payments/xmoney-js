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
      // @ts-expect-error Apple Pay accepts applePay and fields
      card: true,
    },
  };

  const appleGoogleDetails: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Apple Pay accepts applePay and fields
      googlePay: true,
    },
  };

  const appleDefaultValues: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      applePay: true,
      // @ts-expect-error defaultValues prefills the card form only
      defaultValues: { fullName: "Ada Lovelace" },
    },
  };

  const googleCardDetails: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Google Pay accepts googlePay and fields
      card: true,
    },
  };

  const googleAppleDetails: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      // @ts-expect-error Google Pay accepts googlePay and fields
      applePay: true,
    },
  };

  const googleDefaultValues: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      googlePay: true,
      // @ts-expect-error defaultValues prefills the card form only
      defaultValues: { email: "ada@example.com" },
    },
  };

  const formFieldType: PaymentFormConfig = {
    container: "checkout",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      card: true,
      fields: {
        // @ts-expect-error field flags are booleans
        fullName: "yes",
      },
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
  void appleDefaultValues;
  void googleCardDetails;
  void googleAppleDetails;
  void googleDefaultValues;
  void formFieldType;
  void loadOptions;
}

function acceptedMembers(): void {
  const form: PaymentFormConfig = {
    container: "checkout",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      card: true,
      applePay: true,
      googlePay: true,
      fields: { fullName: true, email: true, phone: false, address: true },
      defaultValues: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+40722123456",
        country: "RO",
        region: "București",
        city: "Bucharest",
        postalCode: "010101",
        address: "1 Example Street",
      },
    },
  };

  const card: PaymentCardConfig = {
    container: "card",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: {
      card: true,
      fields: { email: true },
      defaultValues: { email: "ada@example.com", country: "RO" },
    },
  };

  const applePay: ApplePayConfig = {
    container: "apple",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { applePay: true, fields: { email: true, phone: true } },
    options: { appearance: { variables: { colorBackground: "transparent" } } },
  };

  const googlePay: GooglePayConfig = {
    container: "google",
    publicKey: "pk_test_site",
    orderPayload: "e30=",
    orderChecksum: "checksum",
    customerDetails: { googlePay: true, fields: { fullName: true } },
    options: { appearance: { variables: { colorBackground: "transparent" } } },
  };

  const xmoney = {} as XMoney;
  void xmoney.getPaymentMethodCapabilities({ timeout: 3000 });
  void form;
  void card;
  void applePay;
  void googlePay;
}
