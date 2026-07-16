import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().min(1)
    })).min(1, 'Order must have at least one item'),
    totalAmount: z.number().positive(),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    phone: z.string().min(10, 'Invalid phone number'),
    paymentMethod: z.enum(['cod', 'online', 'card', 'upi']).default('cod'),
    paymentId: z.string().optional()
  })
});
