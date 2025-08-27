import { z } from "zod";
import { TransactionType } from "./transactionInterface";
import { envVars } from "../../config/env";

export const transactionZodSchema = z.object({
//   senderEmail: z.string().email({ message: "Invalid sender email format" }),
  receiverEmail: z.string().email({ message: "Invalid receiver email format" }),
  transaction_type: z.enum([
    ...(Object.values(TransactionType) as [string, ...string[]]),
  ]),
  amount: z
    .number({
      invalid_type_error: "Amount must be a number",
    })
    .min(Number(envVars.MINIMUM_TRANSACTION_AMOUNT), {
      message: `Transaction mount must be greater than ${Number(
        envVars.MINIMUM_TRANSACTION_AMOUNT
      )}`,
    }),
});
