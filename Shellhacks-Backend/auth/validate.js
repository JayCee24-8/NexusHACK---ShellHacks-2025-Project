import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  academicYear: z.string().optional(),
  major: z.string().optional(),
  interests: z.array(z.string()).default([]).optional(),
  skills: z.array(z.string()).default([]).optional(),
  bio: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
