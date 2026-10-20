export enum TransactionStatus {
  Start = "start",
  CompleteOk = "complete-ok",
  CancelOk = "cancel-ok",
  RefundOk = "refund-ok",
  VoidOk = "void-ok",
  ChargeBack = "charge-back",
  ChargeBackInProgress = "charge-back-in-progress",
  CompleteFailed = "complete-failed",
  InProgress = "in-progress",
  ThreeDPending = "3d-pending",
  Uncertain = "uncertain",
  Reversed = "reversed",
}

export interface TransactionCustomerData {
  id: number;
  siteId: number;
  identifier: string;
  firstName: string;
  lastName: string;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  address: string;
  phone: string;
  email: string;
  isWhitelisted: boolean;
  isWhitelistedUntil: string | null;
  creationDate: string;
  creationTimestamp: number;
}

export interface TransactionDetails {
  id: number;
  transactionStatus: TransactionStatus;
  amount: number;
  currencyKey: string;
  amountInEuro: number;
  customerData: TransactionCustomerData;
  externalOrderId: string;
  description: string;
}
