import type {
  Appearance,
  ApplePayAppearance,
  GooglePayAppearance,
} from "./appearance";
import type { TransactionDetails } from "./transaction";
import type { ValidationEvent, ValidationMode } from "./validation";

export type FormButtonType =
  | "book"
  | "buy"
  | "checkout"
  | "donate"
  | "deposit"
  | "order"
  | "pay"
  | "subscribe"
  | "topUp";

export type CardInputGrouping = "spaced" | "condensed";
export type Locale = "en-US" | "el-GR" | "ro-RO" | "bg-BG" | "hu-HU" | "pl-PL";

export enum MatchStatus {
  Matched = "Matched",
  NotMatched = "NotMatched",
  NotVerified = "NotVerified",
  PartialMatched = "PartialMatched",
  NotSupported = "NotSupported",
}

export interface CardHolderVerificationResult {
  status: MatchStatus;
  firstNameStatus?: MatchStatus;
  middleNameStatus?: MatchStatus;
  lastNameStatus?: MatchStatus;
}

export interface PaymentChangeEvent {
  installments: {
    available: boolean;
    count: number;
    amount: number;
    formattedAmount: string;
  };
  button: {
    label: string;
  };
}

export type XMoneyError =
  | string
  | {
      code?: number | string;
      message?: string;
    };

export interface OrderUpdate {
  orderPayload: string;
  orderChecksum: string;
}

export interface OrderUpdateResult {
  success: boolean;
  error?: string;
}

export interface SharedOptions {
  /**
   * Locale for the payment UI. Applied when the widget is created.
   * `updateLocale` changes it later on the payment form and payment card.
   *
   * @defaultValue `"en-US"`
   */
  locale?: Locale;
}

/**
 * Which customer-detail blocks the checkout collects.
 * This list replaces the `/inline-checkout/fields` call. A missing key counts as `false`.
 */
export interface CustomerDetailsFields {
  fullName?: boolean;
  email?: boolean;
  phone?: boolean;
  /**
   * Shows the whole address block: country, region, city, postal code, and street.
   */
  address?: boolean;
}

/**
 * Prefills the card form. Values for inactive blocks, or that do not match a
 * predefined list, are ignored.
 *
 * `country` is an ISO 3166-1 alpha-2 code. `phone` is E.164 and starts with `+`.
 * `region` is a subdivision name or alias for `country`. `postalCode` applies
 * only when that country uses a postal code.
 */
export interface CustomerDetailsDefaultValues {
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  address?: string;
}

/**
 * Customer details collection for the payment form and payment card.
 * `card`, `applePay`, and `googlePay` turn collection on for that method.
 * Standalone Apple Pay and Google Pay accept their own flag and `fields`.
 * `defaultValues` prefills the card form.
 */
export interface CustomerDetails {
  card?: boolean;
  applePay?: boolean;
  googlePay?: boolean;
  fields?: CustomerDetailsFields;
  defaultValues?: CustomerDetailsDefaultValues;
}

export interface CardHolderVerification {
  name: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  onCardHolderVerification?: (result: CardHolderVerificationResult) => boolean;
}

export interface CardConfig {
  /**
   * @defaultValue `"onChange"`
   */
  validationMode?: ValidationMode;
  savedCards?: {
    /**
     * @defaultValue `true`
     */
    enabled?: boolean;
    /**
     * @defaultValue `true`
     */
    optInVisible?: boolean;
  };
  submitButton?: {
    /**
     * @defaultValue `true`
     */
    visible?: boolean;
    /**
     * @defaultValue `"pay"`
     */
    type?: FormButtonType;
  };
  inputs?: {
    /**
     * `"spaced"` renders each field separately with labels.
     * `"condensed"` groups them into a single card-style block.
     *
     * @defaultValue `"spaced"`
     */
    grouping?: CardInputGrouping;
  };
  /**
   * Alias that forces `customerDetails.card` when `enabled` is true.
   */
  personalDetails?: {
    enabled?: boolean;
  };
  cardHolderVerification?: CardHolderVerification;
}

/**
 * Configuration shared by every xMoney factory.
 * `savedCardPayment` does not take `container`.
 * Validation callbacks and `options` belong only to widgets that honor them.
 */
export interface BaseConfig {
  /**
   * Element id or the element the iframe is appended to.
   */
  container: string | HTMLElement;
  orderChecksum: string;
  orderPayload: string;
  /**
   * Public key, `pk_test_...` or `pk_live_...`. The loaded script chooses
   * stage or live from this value.
   */
  publicKey: string;
  onReady?: () => void;
  onError?: (error: XMoneyError) => void;
  onPaymentComplete?: (transaction: TransactionDetails) => void;
  onPaymentProcessing?: (isProcessing: boolean) => void;
}

export interface BaseInstance {
  updateOrder: (order: OrderUpdate) => Promise<OrderUpdateResult>;
  destroy: () => void;
}

interface FormSurface {
  onValidation?: (event: ValidationEvent) => void;
  onPaymentChange?: (event: PaymentChangeEvent) => void;
  options?: SharedOptions & {
    appearance?: Appearance;
  };
}

export interface PaymentCardConfig extends BaseConfig, FormSurface {
  card?: CardConfig;
  customerDetails?: CustomerDetails;
}

export interface PaymentCardInstance extends BaseInstance {
  updateLocale: (locale: Locale) => void;
  updateAppearance: (appearance: Appearance) => void;
  submit: () => void;
  validate: () => Promise<ValidationEvent>;
}

export interface PaymentFormConfig extends PaymentCardConfig {
  paymentMethods?: {
    googlePay?: {
      /**
       * @defaultValue `false`
       */
      enabled?: boolean;
      appearance?: GooglePayAppearance;
    };
    applePay?: {
      /**
       * @defaultValue `false`
       */
      enabled?: boolean;
      appearance?: ApplePayAppearance;
    };
  };
}

export interface PaymentFormInstance extends PaymentCardInstance {}

export interface ApplePayConfig extends BaseConfig {
  customerDetails?: Pick<CustomerDetails, "applePay" | "fields">;
  options?: SharedOptions & {
    appearance?: ApplePayAppearance;
  };
}

export interface ApplePayInstance extends BaseInstance {}

export interface GooglePayConfig extends BaseConfig {
  customerDetails?: Pick<CustomerDetails, "googlePay" | "fields">;
  options?: SharedOptions & {
    appearance?: GooglePayAppearance;
  };
}

export interface GooglePayInstance extends BaseInstance {}

export interface SavedCardPaymentConfig extends Omit<BaseConfig, "container"> {}

export interface SavedCardPaymentInstance extends BaseInstance {
  pay: (payment: { cardId: number }) => void;
}

export interface PaymentMethodCapabilities {
  googlePay: {
    supported: boolean;
    reason?: string;
  };
  applePay: {
    supported: boolean;
    reason?: string;
  };
}

export interface PaymentMethodCapabilitiesOptions {
  /**
   * How long to wait for each wallet availability check, in milliseconds.
   * A check that exceeds this is reported as unsupported with reason `TIMEOUT`.
   */
  timeout?: number;
}

export interface XMoney {
  paymentForm: (config: PaymentFormConfig) => Promise<PaymentFormInstance>;
  paymentCard: (config: PaymentCardConfig) => Promise<PaymentCardInstance>;
  savedCardPayment: (
    config: SavedCardPaymentConfig,
  ) => Promise<SavedCardPaymentInstance>;
  googlePay: (config: GooglePayConfig) => Promise<GooglePayInstance>;
  applePay: (config: ApplePayConfig) => Promise<ApplePayInstance>;
  getPaymentMethodCapabilities: (
    options?: PaymentMethodCapabilitiesOptions,
  ) => Promise<PaymentMethodCapabilities>;
}
