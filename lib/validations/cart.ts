import { z } from "zod";

export const addToCartSchema = z.object({
  product_id: z.string().uuid({ message: "Invalid Product ID" }),
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1" }),
});

export const updateCartSchema = z.object({
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1" }),
});