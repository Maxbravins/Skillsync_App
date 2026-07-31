const BASE_URL = "https://sandbox.safaricom.co.ke";

const getAccessToken = async () => {
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    throw new Error(
      "M-Pesa credentials are not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.",
    );
  }

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const response = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to get M-Pesa access token: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
};

export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") {
    throw new Error("Invalid phone number");
  }

  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 9 && cleaned.startsWith("7")) {
    cleaned = `254${cleaned}`;
  } else if (cleaned.length === 10 && cleaned.startsWith("0")) {
    cleaned = `254${cleaned.slice(1)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith("254")) {
    cleaned = cleaned;
  } else {
    throw new Error(
      "Invalid phone number. Use a Kenyan number like 0712345678.",
    );
  }

  return cleaned;
};

const getTimestamp = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");

  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
};

export const initiateSTKPush = async ({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
}) => {
  if (!process.env.MPESA_SHORTCODE || !process.env.MPESA_PASSKEY) {
    throw new Error(
      "M-Pesa shortcode credentials are not configured. Set MPESA_SHORTCODE and MPESA_PASSKEY.",
    );
  }

  if (!process.env.MPESA_CALLBACK_URL) {
    throw new Error(
      "M-Pesa callback URL is not configured. Set MPESA_CALLBACK_URL.",
    );
  }

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const safeAmount = Math.max(1, Math.round(amount));

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: safeAmount,
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference?.slice(0, 12) || "SkillSync",
    TransactionDesc: transactionDesc?.slice(0, 20) || "Payment",
  };

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errorMessage || data.errorCode || "STK Push request failed",
    );
  }

  return data;
};
