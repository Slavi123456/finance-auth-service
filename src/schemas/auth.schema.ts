import {z} from 'zod';

const incorrectPasswordMessage = "Password must be at least 8 characters";

export const registerSchema = z.schema({
    email: z.string().trim().toLowerCase().email().max(255),
    name: z.string().trim().min(2).max(100),
    //bcrypt only uses the first 72 bytes
    password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof refreshSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;