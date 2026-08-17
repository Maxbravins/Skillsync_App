import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";
import { initiateSTKPush } from "../services/mpesa.service.js";
import {
getPremiumPlan,
calculatePremiumExpiry,
} from "../services/premium.service.js";


   //.Initiate Premium subscription payment
  export const payPremium = async (req, res) => {
  try {
  const { plan, phoneNumber } = req.body;

  // Validate request
  if (!plan) {
  return res.status(400).json({
  success: false,
  message: "Premium plan is required.",
  });
  }

  if (!phoneNumber) {
  return res.status(400).json({
  success: false,
  message: "Phone number is required.",
  });
  }

  // Validate Premium plan
  const selectedPlan = getPremiumPlan(plan);

  if (!selectedPlan) {
  return res.status(400).json({
  success: false,
  message: "Invalid Premium plan.",
  });
  }

  // Find logged-in user
  const user = await User.findById(req.user.id);

  if (!user) {
  return res.status(404).json({
  success: false,
  message: "User not found.",
  });
  }

  // Prevent duplicate active subscription
  if (
  user.isPremium &&
  user.premiumExpiresAt &&
  new Date(user.premiumExpiresAt) > new Date()
  ) {
  return res.status(400).json({
  success: false,
  message: "You already have an active Premium subscription.",
  premiumPlan: user.premiumPlan,
  premiumExpiresAt: user.premiumExpiresAt,
  });
  }

  // Prevent duplicate pending Premium payments
  const existingPendingTransaction = await Transaction.findOne({
  user: user._id,
  paymentType: "premium",
  status: "pending",
  });

  if (existingPendingTransaction) {
  return res.status(400).json({
  success: false,
  message:
  "You already have a pending Premium payment. Complete it before starting another payment.",
  transactionId: existingPendingTransaction._id,
  });
  }

  const amount = selectedPlan.price;

  // Initiate M-Pesa STK Push
  let stkResponse;

  try {
  stkResponse = await initiateSTKPush({
  phoneNumber,
  amount,
  accountReference: `PREMIUM-${user._id}`,
  transactionDesc: `SkillSync ${selectedPlan.name}`,
  });
  } catch (error) {
  console.error("Premium STK Push error:", error);

  return res.status(502).json({
  success: false,
  message:
  error.message ||
  "M-Pesa could not initiate the Premium payment.",
  });
  }

  if (!stkResponse?.CheckoutRequestID) {
  return res.status(502).json({
  success: false,
  message:
  "M-Pesa did not return a valid CheckoutRequestID.",
  });
  }

  // Create Premium transaction
  const transaction = await Transaction.create({
  job: null,

  // Explicit Premium subscriber
  user: user._id,

  client: user.role === "client" ? user._id : null,

  developer:
  user.role === "developer"
  ? user._id
  : null,

  application: null,
  contract: null,

  amount,

  projectAmount: 0,

  platformFee: 0,

  totalAmount: amount,

  phoneNumber,

  paymentType: "premium",

  premiumPlan: plan,

  status: "pending",

  merchantRequestID:
  stkResponse.MerchantRequestID || "",

  checkoutRequestID:
  stkResponse.CheckoutRequestID || "",
  });

  // Response
  return res.status(200).json({
  success: true,
  message: `${selectedPlan.name} payment initiated. Please enter your M-Pesa PIN.`,
  transaction: {
  _id: transaction._id,
  amount: transaction.amount,
  plan,
  planName: selectedPlan.name,
  status: transaction.status,
  checkoutRequestID:
  transaction.checkoutRequestID,
  },
  });
  } catch (error) {
  console.error("Premium payment error:", error);

  return res.status(500).json({
  success: false,
  message:
  error.message ||
  "Premium payment initiation failed.",
  });
  }
  };

  //M-Pesa Premium callback
  export const premiumCallback = async (req, res) => {
  try {
  const callback = req.body?.Body?.stkCallback;

  // Validate callback
  if (!callback) {
  return res.json({
  ResultCode: 0,
  ResultDesc: "Accepted",
  });
  }

  const {
  CheckoutRequestID,
  ResultCode,
  ResultDesc,
  CallbackMetadata,
  } = callback;

  // Find Premium transaction
  const transaction = await Transaction.findOne({
  checkoutRequestID: CheckoutRequestID,
  paymentType: "premium",
  });

  if (!transaction) {
  console.warn(
  `Premium transaction not found for CheckoutRequestID: ${CheckoutRequestID}`
  );

  return res.json({
  ResultCode: 0,
  ResultDesc: "Accepted",
  });
  }

  // Prevent duplicate callback processing
  if (transaction.status === "completed") {
  return res.json({
  ResultCode: 0,
  ResultDesc: "Accepted",
  });
  }

  transaction.resultCode = ResultCode;
  transaction.resultDesc = ResultDesc;

  // PAYMENT SUCCESSFUL
  if (ResultCode === 0) {
  const metadata = CallbackMetadata?.Item || [];

  // Extract M-Pesa receipt
  const receiptItem = metadata.find(
  (item) =>
  item.Name === "MpesaReceiptNumber"
  );

  if (receiptItem?.Value) {
  transaction.mpesaReceiptNumber =
  receiptItem.Value;
  }

  transaction.status = "completed";
  transaction.paidAt = new Date();

  await transaction.save();

  // Find Premium subscriber
  const user = await User.findById(
  transaction.user
  );

  if (!user) {
  console.error(
  `Premium payment ${transaction._id} completed, but user ${transaction.user} was not found.`
  );

  ```
   return res.json({
     ResultCode: 0,
     ResultDesc: "Accepted",
   });
  ```

  }

  // Validate stored Premium plan
  const plan = transaction.premiumPlan;

  if (!plan) {
  console.error(
  `Premium transaction ${transaction._id} has no premiumPlan.`
  );

  ```
   return res.json({
     ResultCode: 0,
     ResultDesc: "Accepted",
   });
  ```

  }

  // Calculate Premium dates
  const startedAt = new Date();

  const expiresAt =
  calculatePremiumExpiry(
  plan,
  startedAt
  );

  // Activate Premium account
  user.isPremium = true;

  user.premiumPlan = plan;

  user.premiumStartedAt = startedAt;

  user.premiumExpiresAt = expiresAt;

  await user.save();

  console.log(
  "========================================"
  );

  console.log(
  "PREMIUM PAYMENT SUCCESSFUL"
  );

  console.log(
  `User: ${user.username}`
  );

  console.log(
  `Email: ${user.email}`
  );

  console.log(
  `Plan: ${plan}`
  );

  console.log(
  `Amount: KES ${transaction.amount}`
  );

  console.log(
  `Receipt: ${transaction.mpesaReceiptNumber}`
  );

  console.log(
  `Expires: ${expiresAt.toISOString()}`
  );

  console.log(
  "========================================"
  );
  }

  // PAYMENT FAILED / CANCELLED
  else {
  transaction.status = "failed";

  await transaction.save();

  console.log(
  `Premium payment failed: ${ResultDesc}`
  );
  }

  // Always acknowledge Safaricom callback
  return res.json({
  ResultCode: 0,
  ResultDesc: "Accepted",
  });
  } catch (error) {
  console.error(
  "Premium callback error:",
  error
  );

  // Always acknowledge M-Pesa callback
  return res.json({
  ResultCode: 0,
  ResultDesc: "Accepted",
  });
  }
  };
