import { Transaction } from "../transactionSchemaModel";
import { TransactionType } from "../transactionInterface";
import { Role } from "../../user/user.interface";

/** Compute start/end of “today” in Asia/Dhaka (UTC+6) and return UTC bounds */
function getDhakaDayBoundsUTC(base = new Date()) {
  const offsetMs = 6 * 60 * 60 * 1000; // UTC+6
  const dhakaNow = new Date(base.getTime() + offsetMs);

  // Midnight in Dhaka for the current Dhaka date (local Dhaka date -> UTC)
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

/** Who is allowed to be sender vs receiver for each type */
const PERMS: Record<TransactionType, { sender: Role[]; receiver: Role[] }> = {
  [TransactionType.ADMIN_LOAD]: {
    sender: [Role.SUPER_ADMIN],
    receiver: [Role.ADMIN],
  },
  [TransactionType.ADMIN_UNLOAD]: {
    sender: [Role.ADMIN],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN],
  },
  [TransactionType.AGENT_LOAD]: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN],
    receiver: [Role.AGENT],
  },
  [TransactionType.AGENT_UNLOAD]: {
    sender: [Role.AGENT],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  [TransactionType.CASH_IN]: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
    receiver: [Role.USER],
  },
  [TransactionType.CASH_OUT]: {
    sender: [Role.USER],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  [TransactionType.SENT_MONEY]: {
    // charge applies to whoever sends
    sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.USER],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.USER],
  },
  // If you later add commission/earning types, include them here or they won’t be counted.

  // Commission & Earning types (no roles participate directly)
  [TransactionType.CASH_IN_COMMISSION]: { sender: [], receiver: [] },
  [TransactionType.CASH_OUT_COMMISSION]: { sender: [], receiver: [] },
  [TransactionType.SENT_MONEY_COMMISSION]: { sender: [], receiver: [] },
  [TransactionType.CASH_IN_EARNING]: { sender: [], receiver: [] },
  [TransactionType.CASH_OUT_EARNING]: { sender: [], receiver: [] },
  [TransactionType.SENT_MONEY_EARNING]: { sender: [], receiver: [] },
} as const;

/**
 * Return today’s totals (CASH_IN, CASH_OUT, SENT_MONEY) for a user identified by email+role.
 * For each type we include the user if they are in the corresponding sender/receiver list.
 *   - CASH_IN: if role is in sender → match senderEmail; if role is in receiver → match receiverEmail
 *   - CASH_OUT: same pattern
 *   - SENT_MONEY: we count when user is the SENDER (senderEmail) — consistent with “charge applies to sender”
 */
export async function getDailyTotalsByEmailAndRole(
  role: Role,
  userEmail: string
) {
  const email = userEmail.trim().toLowerCase();
  const { startUTC, endUTC } = getDhakaDayBoundsUTC();

  const or: any[] = [];

  // Helper to push both possible perspectives (sender or receiver) for a type
  function addTypeIfApplies(type: TransactionType) {
    const perms = PERMS[type];

    if (perms.sender.includes(role)) {
      or.push({
        $and: [{ transaction_type: type }, { senderEmail: email }],
      });
    }
    if (perms.receiver.includes(role)) {
      or.push({
        $and: [{ transaction_type: type }, { receiverEmail: email }],
      });
    }
  }

  // We only total these three types per your limit logic
  addTypeIfApplies(TransactionType.CASH_IN);
  addTypeIfApplies(TransactionType.CASH_OUT);

  // For SENT_MONEY: your business rule is “charge is on the sender”
  // and daily limit applies to USER/AGENT; we still compute total by senderEmail
  // regardless of role so you can use it if needed.
  if (PERMS[TransactionType.SENT_MONEY].sender.includes(role)) {
    or.push({
      $and: [
        { transaction_type: TransactionType.SENT_MONEY },
        { senderEmail: email },
      ],
    });
  }

  // If this role doesn’t participate in any of the above, return zeros quickly
  if (or.length === 0) {
    return {
      dateTZ: "Asia/Dhaka",
      windowUTC: { startUTC, endUTC },
      CASH_IN: 0,
      CASH_OUT: 0,
      SENT_MONEY: 0,
      grandTotal: 0,
    };
  }

  const rows = await Transaction.aggregate([
    {
      $match: {
        createdAt: { $gte: startUTC, $lte: endUTC },
        $or: or,
      },
    },
    {
      $group: {
        _id: "$transaction_type",
        totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
      },
    },
  ]);

  const totals: Record<"CASH_IN" | "CASH_OUT" | "SENT_MONEY", number> = {
    CASH_IN: 0,
    CASH_OUT: 0,
    SENT_MONEY: 0,
  };

  for (const r of rows) {
    if (r._id in totals) {
      totals[r._id as keyof typeof totals] = r.totalAmount;
    }
  }

  const grandTotal = totals.CASH_IN + totals.CASH_OUT + totals.SENT_MONEY;

  return {
    dateTZ: "Asia/Dhaka",
    windowUTC: { startUTC, endUTC },
    ...totals,
    grandTotal,
  };
}

// What Works

// Correct Time Window

// getDhakaDayBoundsUTC() correctly adjusts for UTC+6 and returns start and end of the day in UTC.

// Role-based Filtering

// Uses PERMS to determine if the user participates as sender or receiver for each transaction type.

// Handles SENT_MONEY separately to only count amounts when the user is the sender.

// Aggregation Logic

// $match filters documents created today and by role/email.

// $group sums amounts by transaction type.

// Returns totals and grand total.

// Potential Issues

// Commission & Earnings Transactions

// Your $match does not exclude commission or earning transaction types (e.g., CASH_IN_COMMISSION).

// These should not be counted toward daily transaction limits.

// Redundant Role Filtering for SENT_MONEY

// You already have PERMS[TransactionType.SENT_MONEY].sender.includes(role) check, but could integrate it into addTypeIfApplies for consistency.

// Email Matching

// Assumes email is stored consistently in lowercase, which your schema enforces, so likely fine.

// ---------------------------------
// Special Handling for SENT_MONEY

// Unlike CASH_IN or CASH_OUT, where the user can be either sender or receiver depending on role, SENT_MONEY only applies when the user is the sender.

// --------------------------------
// Special Handling for SENT_MONEY

// Nature of SENT_MONEY Transactions

// In SENT_MONEY, only the initiator (sender) is responsible for the transaction.

// The receiver does not actively perform a financial operation; they simply receive the amount.

// Why It Needs Special Handling

// If the system checks both sender and receiver for all transaction types (as in CASH_IN or CASH_OUT), it may incorrectly count transactions where the user is only the receiver for SENT_MONEY.

// This would falsely inflate the user's daily transaction total.
