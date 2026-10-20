export type ValidationMode = "onSubmit" | "onChange" | "onBlur" | "onTouched";

export type CardFieldName = "cardHolderName" | "cardNumber" | "expDate" | "cvv";

export type PersonalDetailsFieldName =
  | "fullName"
  | "email"
  | "phoneCountry"
  | "phone"
  | "country"
  | "region"
  | "address"
  | "city"
  | "postalCode";

export type PaymentFieldName = CardFieldName | PersonalDetailsFieldName;

export type ValidationTrigger = "input" | "blur" | "submit";

export interface FieldValidationError {
  message: string;
  code: string;
}

export interface FieldValidationState {
  isValid: boolean;
  isEmpty: boolean;
  error: FieldValidationError | null;
}

export interface ValidationEvent {
  isValid: boolean;
  empty: boolean;
  fields: Partial<Record<PaymentFieldName, FieldValidationState>>;
  field?: PaymentFieldName;
  trigger: ValidationTrigger;
  /**
   * @deprecated Use `fields[name].error` instead.
   */
  errors?: Record<string, FieldValidationError>;
}
