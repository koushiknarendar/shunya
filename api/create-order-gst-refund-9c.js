const G9C_PLAN_AMOUNTS = {
  gstr9: 199900,
  gstr9c: 599900,
};

const GST_REFUND_AMOUNT = 299900;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, gstin, service, plan } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const isGstr9 = service === 'gstr9';

  let amount;
  let receipt;
  let notes;

  if (isGstr9) {
    const selectedPlan = G9C_PLAN_AMOUNTS[plan] ? plan : 'gstr9';
    amount = G9C_PLAN_AMOUNTS[selectedPlan];
    receipt = `SHG9C_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    notes = {
      name,
      email,
      phone: cleanPhone,
      gstin: gstin || 'Not provided',
      plan: selectedPlan,
      service: 'GSTR-9 & GSTR-9C Filing',
    };
  } else {
    amount = GST_REFUND_AMOUNT;
    receipt = `SHGRFD_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    notes = {
      name,
      email,
      phone: cleanPhone,
      gstin: gstin || 'Not provided',
      service: 'GST Refund Filing',
    };
  }

  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!rzRes.ok) {
    const err = await rzRes.json();
    console.error('Razorpay error:', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }

  const data = await rzRes.json();
  res.status(200).json({
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
