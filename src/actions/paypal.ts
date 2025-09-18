'use server';

// import { confirm } from '@/actions/participant';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com': 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  amount: string,
  currency: string = 'EUR',
  productId: string = '',
) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: productId,
          amount: {
            currency_code: currency,
            value: amount,
          },
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal API error: ${errorData.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PayPal capture error: ${errorData.message || 'Unknown error'}`);
    }

    // confirm participant
    const data = await response.json();
    const productId = data.purchase_units?.[0]?.reference_id;
    const paidAmount = data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    const currency = data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code;

    // Enforce correct payment
    if (paidAmount !== '10.00' || currency !== 'EUR') {
      throw new Error(`Invalid payment amount: expected 10.00 EUR, got ${paidAmount} ${currency}`);
    }
    
    // if (productId.length) await confirm(productId);

    return data;
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
}
