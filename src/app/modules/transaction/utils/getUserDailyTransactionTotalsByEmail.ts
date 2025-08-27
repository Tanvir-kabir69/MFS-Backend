import { TransactionType } from "../transactionInterface";
import { Transaction } from "../transactionSchemaModel";

/** Compute start/end of “today” in Asia/Dhaka (UTC+6) and return UTC bounds */
function getDhakaDayBoundsUTC(base = new Date()) {
  const offsetMs = 6 * 60 * 60 * 1000; // UTC+6
  const dhakaNow = new Date(base.getTime() + offsetMs);

  // Midnight in Dhaka for the current Dhaka date
  const startDhakaUTC = Date.UTC(
    dhakaNow.getUTCFullYear(),
    dhakaNow.getUTCMonth(),
    dhakaNow.getUTCDate(),
    0,
    0,
    0,
    0
  );
  const startUTC = new Date(startDhakaUTC - offsetMs);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startUTC, endUTC };
}

/**
 * Get today's totals for a user's transactions:
 * - CASH_IN    ➜ user is the receiver
 * - CASH_OUT   ➜ user is the sender
 * - SENT_MONEY ➜ user is the sender
 */
export async function getUserDailyTransactionTotalsByEmail(
  userType: "USER" | "AGENT",
  userEmail: string
) {
  const email = userEmail.trim().toLowerCase();
  const { startUTC, endUTC } = getDhakaDayBoundsUTC();

  // Determine dynamic fields for each transaction type
  const matchConditions: Record<string, any>[] = [
    {
      $and: [
        { transaction_type: TransactionType.CASH_IN },
        userType === "USER" ? { receiverEmail: email } : { senderEmail: email },
      ],
    },
    {
      $and: [
        { transaction_type: TransactionType.CASH_OUT },
        userType === "USER" ? { senderEmail: email } : { receiverEmail: email },
      ],
    },
    {
      $and: [
        { transaction_type: TransactionType.SENT_MONEY },
        { senderEmail: email }, // stays the same for both
      ],
    },
  ];

  const rows = await Transaction.aggregate([
    {
      $match: {
        createdAt: { $gte: startUTC, $lte: endUTC },
        $or: matchConditions,
      },
    },
    {
      $group: {
        _id: "$transaction_type",
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
      },
    },
  ]);

  const totals = {
    CASH_IN: 0,
    CASH_OUT: 0,
    SENT_MONEY: 0,
  } as Record<"CASH_IN" | "CASH_OUT" | "SENT_MONEY", number>;

  for (const r of rows) {
    if (r._id in totals) totals[r._id as keyof typeof totals] = r.totalAmount;
  }

  // Calculate grand total
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return {
    dateTZ: "Asia/Dhaka",
    windowUTC: { startUTC, endUTC },
    ...totals,
    grandTotal,
  };
}

export async function getUserDailyGrandTotalByEmail(
  userType: "USER" | "AGENT",
  userEmail: string
) {
  const totals = await getUserDailyTransactionTotalsByEmail(
    userType,
    userEmail
  );

  // Sum up totals from previous helper
  const grandTotal = totals.CASH_IN + totals.CASH_OUT + totals.SENT_MONEY;

  return {
    ...totals,
    grandTotal,
  };
}

// You are correct, there was a slight misunderstanding on my part. The core logic of your matchConditions is not flawed; it is perfectly designed to filter transactions based on the user's role in the system (userType) and their role in the transaction (senderEmail or receiverEmail).

// Your logic correctly identifies where to look for a user's transactions based on their account type (USER or AGENT).

// How Your Logic Works
// Your code does exactly what you intended: it calculates a user's daily total by summing the amounts of transactions that count toward their daily limit.

// For a USER:

// CASH_IN: A user is the receiver, so the condition receiverEmail: email is used. This correctly counts money coming in.

// CASH_OUT: A user is the sender, so the condition senderEmail: email is used. This correctly counts money going out.

// SENT_MONEY: A user is the sender, so the condition senderEmail: email is used. This correctly counts money being sent.

// For an AGENT:

// CASH_IN: An agent is the sender, so the condition senderEmail: email is used. This correctly counts money the agent has given out.

// CASH_OUT: An agent is the receiver, so the condition receiverEmail: email is used. This correctly counts money the agent has received.

// SENT_MONEY: An agent is the sender, so the condition senderEmail: email is used. This correctly counts money being sent.
