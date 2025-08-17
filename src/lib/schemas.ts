import { z } from "zod";

export const uploadSchema = z.object({
  // handled via multipart FormData; we still check extra fields if any
});

export const idParamSchema = z.object({ id: z.string().min(4).max(64) });

export const editSchema = z.object({
  name: z.string().min(1).max(180).optional(),
  description: z.string().max(500).optional(),
});
