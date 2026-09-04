import { z } from "zod";

export const paymentSchema = z.object({
  phoneNumber: z.string()
    .regex(/^254[0-9]{9}$/, "Invalid phone number. Use format: 254712345678"),
});