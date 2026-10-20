export type Theme = "light" | "dark" | "custom";

export type GooglePayButtonType =
  | "book"
  | "buy"
  | "checkout"
  | "donate"
  | "order"
  | "plain"
  | "pay"
  | "subscribe";
export type GooglePayButtonColor = "white" | "black";
export type GooglePayButtonBorderType = "default_border" | "no_border";

export type ApplePayButtonStyle = "white" | "black" | "white-outline";
export type ApplePayButtonType =
  | "add-money"
  | "book"
  | "buy"
  | "checkout"
  | "contribute"
  | "continue"
  | "donate"
  | "order"
  | "plain"
  | "pay"
  | "reload"
  | "rent"
  | "set-up"
  | "subscribe"
  | "support"
  | "tip"
  | "top-up";

type AppearanceRulePart<Base extends string, Part extends string> = [
  Part,
] extends [never]
  ? never
  : `${Base}${Part}`;

/**
 * Allowed `appearance.rules` selector combinations: a base class plus at most
 * one modifier, one pseudo-class, and one pseudo-element from the SDK allowlist.
 */
type AppearanceRuleParts<
  Base extends string,
  Modifier extends string = never,
  PseudoClass extends string = never,
  PseudoElement extends string = never,
> =
  | Base
  | AppearanceRulePart<Base, Modifier>
  | AppearanceRulePart<Base, PseudoClass>
  | AppearanceRulePart<Base, PseudoElement>
  | AppearanceRulePart<Base, `${Modifier}${PseudoClass}`>
  | AppearanceRulePart<Base, `${Modifier}${PseudoElement}`>
  | AppearanceRulePart<Base, `${PseudoClass}${PseudoElement}`>
  | AppearanceRulePart<Base, `${Modifier}${PseudoClass}${PseudoElement}`>;

export type AppearanceRuleSelector =
  | AppearanceRuleParts<".xmoney-label", "--empty" | "--invalid" | "--focused">
  | AppearanceRuleParts<
      ".xmoney-input",
      "--empty" | "--invalid",
      ":hover" | ":focus" | ":disabled" | ":autofill",
      "::placeholder" | "::selection"
    >
  | AppearanceRuleParts<".xmoney-error">
  | AppearanceRuleParts<".xmoney-card-group", "--invalid", ":hover">
  | AppearanceRuleParts<".save-card-container">
  | AppearanceRuleParts<
      ".save-card",
      never,
      ":hover" | ":focus-visible" | ":checked",
      "::before"
    >
  | AppearanceRuleParts<".save-card-label">;

/**
 * CSS properties accepted by `options.appearance.rules` (camelCase, matching
 * the SDK allowlist).
 */
export type AppearanceCssProperty =
  | "-moz-osx-font-smoothing"
  | "-webkit-font-smoothing"
  | "-webkit-text-fill-color"
  | "accentColor"
  | "backgroundColor"
  | "borderRadius"
  | "borderBottom"
  | "borderBottomColor"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius"
  | "borderBottomStyle"
  | "borderBottomWidth"
  | "borderColor"
  | "borderLeft"
  | "borderLeftColor"
  | "borderLeftStyle"
  | "borderLeftWidth"
  | "borderRight"
  | "borderRightColor"
  | "borderRightStyle"
  | "borderRightWidth"
  | "borderStyle"
  | "borderTop"
  | "borderTopColor"
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderTopStyle"
  | "borderTopWidth"
  | "borderWidth"
  | "border"
  | "boxShadow"
  | "boxSizing"
  | "clipPath"
  | "color"
  | "fill"
  | "fillOpacity"
  | "fontFamily"
  | "fontSize"
  | "fontStyle"
  | "fontVariant"
  | "fontWeight"
  | "letterSpacing"
  | "lineHeight"
  | "margin"
  | "marginBottom"
  | "marginLeft"
  | "marginRight"
  | "marginTop"
  | "opacity"
  | "outline"
  | "outlineOffset"
  | "padding"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingRight"
  | "paddingTop"
  | "r"
  | "stroke"
  | "strokeOpacity"
  | "strokeWidth"
  | "textAlign"
  | "textDecoration"
  | "textShadow"
  | "textTransform"
  | "transform"
  | "transition"
  | "cursor"
  | "width";

export type AppearanceRuleStyles = Partial<
  Record<AppearanceCssProperty, string>
>;

export type AppearanceRules = {
  [Selector in AppearanceRuleSelector]?: AppearanceRuleStyles;
};

/**
 * CSS variables accepted by `options.appearance.variables`.
 * Each key is written as `--kebab-case` and read by the checkout stylesheet.
 */
export interface AppearanceVariables {
  colorPrimary?: string;
  colorDanger?: string;
  colorText?: string;
  colorTextBody?: string;
  colorTextSecondary?: string;
  colorTextPlaceholder?: string;
  colorTextDisabled?: string;
  colorBorder?: string;
  colorBorderHover?: string;
  colorBorderFocus?: string;
  colorBackground?: string;
  colorBackgroundInput?: string;
  colorBackgroundHover?: string;
  colorBackgroundDisabled?: string;
  saveCardSize?: string;
  saveCardCheckSize?: string;
  saveCardCheckColor?: string;
  saveCardBorderWidth?: string;
  saveCardBorderColor?: string;
  saveCardBorderRadius?: string;
  saveCardCheckedBackground?: string;
  saveCardGap?: string;
  borderRadius?: string;
  borderRadiusBase?: string;
  borderWidth?: string;
  buttonBorderRadius?: string;
  buttonHeight?: string;
  fontFamilyBase?: string;
  fontSizeBase?: string;
  fontSizeSm?: string;
  fontSizeLg?: string;
  fontSizeXl?: string;
  fontWeightNormal?: string;
  fontWeightMedium?: string;
  fontWeightBold?: string;
  gap?: string;
  gapSmall?: string;
  gapMedium?: string;
  gapCardInfo?: string;
  gapHeaderTitle?: string;
  heightInput?: string;
  paddingForm?: string;
  paddingFormMobile?: string;
  paddingInput?: string;
  paddingLabel?: string;
  paddingCardOther?: string;
  maxVisibleSavedCards?: string;
  savedCardRowHeight?: string;
  savedCardConfirmHeight?: string;
}

export interface Appearance {
  /**
   * Theme for the payment form.
   *
   * @defaultValue `"light"`
   */
  theme?: Theme;
  /**
   * CSS variables for custom themes. Keys match the checkout stylesheet tokens.
   */
  variables?: AppearanceVariables;
  /**
   * CSS rules keyed by allowed selectors (`.xmoney-label`, `.xmoney-input`,
   * `.xmoney-error`, `.xmoney-card-group`, `.save-card`, etc.) with allowed
   * camelCase CSS properties.
   */
  rules?: AppearanceRules;
}

/**
 * Google Pay button options.
 * Google does not allow custom artwork or CSS rules on the button mark.
 * `theme` chooses the default button color when `color` is omitted.
 * `variables` style the wallet iframe document.
 */
export interface GooglePayAppearance {
  /**
   * Theme for the wallet iframe. Also chooses the default button color
   * when `color` is omitted.
   *
   * @defaultValue `"light"`
   */
  theme?: Theme;
  /**
   * CSS variables for the wallet iframe document.
   */
  variables?: AppearanceVariables;
  /**
   * Color of the Google Pay button. Use `"black"` on light surfaces and
   * `"white"` on dark surfaces.
   *
   * @defaultValue `"black"`
   */
  color?: GooglePayButtonColor;
  /**
   * Corner radius of the Google Pay button.
   * @defaultValue `12`
   */
  radius?: number;
  /**
   * Type of the Google Pay button.
   * @defaultValue `"plain"`
   */
  type?: GooglePayButtonType;
  /**
   * Border type of the Google Pay button.
   * @defaultValue `"no_border"`
   */
  borderType?: GooglePayButtonBorderType;
  /**
   * Height of the Google Pay button, in pixels. Google's minimum is 40.
   * @defaultValue `48`
   */
  height?: number;
}

/**
 * Apple Pay button options.
 * Apple does not allow custom artwork or CSS rules on the button mark.
 * `theme` chooses the default button style when `style` is omitted.
 * `variables` style the wallet iframe document.
 */
export interface ApplePayAppearance {
  /**
   * Theme for the wallet iframe. Also chooses the default button style
   * when `style` is omitted.
   *
   * @defaultValue `"light"`
   */
  theme?: Theme;
  /**
   * CSS variables for the wallet iframe document.
   */
  variables?: AppearanceVariables;
  /**
   * Style of the Apple Pay button. Use `"black"` or `"white-outline"` on
   * light surfaces and `"white"` on dark surfaces.
   * @defaultValue `"black"`
   */
  style?: ApplePayButtonStyle;
  /**
   * Corner radius of the Apple Pay button.
   * @defaultValue `12`
   */
  radius?: number;
  /**
   * Type of the Apple Pay button.
   * @defaultValue `"plain"`
   */
  type?: ApplePayButtonType;
  /**
   * Height of the Apple Pay button, in pixels. Apple's minimum is 30.
   * @defaultValue `48`
   */
  height?: number;
}
