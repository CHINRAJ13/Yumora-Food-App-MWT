import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  line1: z.string().min(5, "Address line 1 must be at least 5 characters"),
  line2: z.string().optional(),
  pincode: z.string().length(6, "Pincode must be exactly 6 digits"),
  paymentMethod: z.enum(["cod", "upi", "card"]),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
