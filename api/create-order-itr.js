const PLAN_AMOUNTS = {
  salaried: 99900,
  capital: 249900,
  business: 449900,
};

// Shared with Tax Audit (44AB) — separate plan keys, one endpoint, since the
// Vercel Hobby plan caps serverless functions at 12 and that cap is already hit.
const TAX_AUDIT_PLAN_AMOUNTS = {
  audit_only: 499900,
  audit_itr: 799900,
  fo_package: 599900,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, plan, service } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const isTaxAudit = service === 'tax_audit';
  const PLANS = isTaxAudit ? TAX_AUDIT_PLAN_AMOUNTS : PLAN_AMOUNTS;
  const defaultPlan = isTaxAudit ? 'audit_only' : 'salaried';
  const selectedPlan = PLANS[plan] ? plan : defaultPlan;
  const amount = PLANS[selectedPlan];

  const receipt = `${isTaxAudit ? 'SHAUDIT' : 'SHITR'}_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

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
      notes: {
        name,
        email,
        phone: cleanPhone,
        plan: selectedPlan,
        service: isTaxAudit ? 'Tax Audit (44AB)' : 'ITR Filing',
      },
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
