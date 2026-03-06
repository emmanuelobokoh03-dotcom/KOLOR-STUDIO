import Stripe from 'stripe';

const apiKey = process.env.STRIPE_API_KEY;
if (!apiKey) {
  console.warn('STRIPE_API_KEY not set — payment features disabled');
}

export const stripe = apiKey
  ? new Stripe(apiKey, { typescript: true })
  : null;
