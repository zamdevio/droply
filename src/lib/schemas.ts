import { z } from "zod";

export const UploadMeta = z.object({
  filename: z.string().max(256),
  contentType: z.string().max(128),
  password: z.string().max(128).optional(),   // plain; hash it server-side
  expiresInSec: z.number().int().positive().max(60 * 60 * 24 * 30).optional(), // max 30d
  maxDownloads: z.number().int().positive().max(10000).optional(),
});

export const FileIdQuery = z.object({ id: z.string().min(8).max(40) });

export const EditSchema = z.object({
  name: z.string().min(1).max(180).optional(),
  description: z.string().max(500).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(40),
});
