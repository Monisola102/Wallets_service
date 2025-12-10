import { registerAs } from '@nestjs/config';

export default registerAs('paystack', () => {
  const secretKey = process.env.PAYSTACK_SECRET;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET is not defined in .env');
  }

  const callbackUrl = process.env.PAYSTACK_CALLBACK_URL;
  if (!callbackUrl) {
    throw new Error('PAYSTACK_CALLBACK_URL is not defined in .env');
  }

  return {
    secretKey,
    url: 'https://api.paystack.co',
    callbackUrl,
  };
});