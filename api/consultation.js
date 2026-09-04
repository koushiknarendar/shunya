export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: 0, error: 'Method not allowed' });
  }

  const { name, email, phone, city, isDiscounted } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: 0, error: 'Missing required fields' });
  }

  const cleanPhone = phone.replace(/[^\d]/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: 0, error: 'Invalid phone number' });
  }

  const amount = 99900; // ₹999 in paise
  const receipt = `SHCA_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

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
      notes: { name, email, phone: cleanPhone, city: city || '', service: 'CA Consultation' },
    }),
  });

  if (!rzRes.ok) {
    const err = await rzRes.json();
    console.error('Razorpay error:', err);
    return res.status(500).json({ success: 0, error: 'Failed to create payment order' });
  }

  const order = await rzRes.json();

  res.status(200).json({
    success: 1,
    data: {
      consultation: {
        user: { name, email, phone: cleanPhone },
      },
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        notes: order.notes,
      },
    },
  });
}
