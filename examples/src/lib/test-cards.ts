export interface TestCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  pan: string;
  expiry: string;
  cvv: string;
  threeDS: string;
  success: boolean;
  status: string;
  flow: 'Challenge' | 'Frictionless' | 'Attempt';
  detail: string;
}

export const TEST_CARDS: TestCard[] = [
  {
    id: 'mc-success',
    brand: 'Mastercard',
    pan: '5555 5555 5555 5599',
    expiry: '12/34',
    cvv: '123',
    threeDS: '00000',
    success: true,
    status: 'Success (3DS2)',
    flow: 'Challenge',
    detail: 'The issuer opens a 3-D Secure challenge. Enter the 3DS code to approve the payment.',
  },
  {
    id: 'visa-frictionless',
    brand: 'Visa',
    pan: '4111 1111 1111 1111',
    expiry: '12/26',
    cvv: '123',
    threeDS: '00000',
    success: true,
    status: 'Success (3DS2 Frictionless)',
    flow: 'Frictionless',
    detail: 'The issuer authenticates in the background. No challenge screen appears, and the payment is approved.',
  },
  {
    id: 'mc-fail',
    brand: 'Mastercard',
    pan: '5168 4948 9505 5780',
    expiry: '12/26',
    cvv: '123',
    threeDS: '00000',
    success: false,
    status: 'Fail (3DS2 Frictionless)',
    flow: 'Frictionless',
    detail: 'The issuer declines during frictionless authentication. No challenge is shown, and the payment fails.',
  },
  {
    id: 'visa-attempt',
    brand: 'Visa',
    pan: '4000 0011 1111 1118',
    expiry: '12/30',
    cvv: '123',
    threeDS: '00000',
    success: true,
    status: 'Success (3DS2 Attempt)',
    flow: 'Attempt',
    detail: 'The issuer returns a proof of authentication attempt. No challenge is shown, and the payment is approved.',
  },
];

export function testCardLine(card: TestCard): string {
  return `${card.pan}  ${card.expiry}  ${card.cvv}  ${card.threeDS}`;
}
