import type { NextApiRequest, NextApiResponse } from "next";
import { idParamSchema } from "@/lib/schemas";
import { deleteFile } from "@/lib/r2";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).end();
  
  const parsed = idParamSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  
  const { id } = parsed.data;
  
  try {
    await deleteFile(id);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Delete error:", e);
    return res.status(500).json({ error: "Delete failed" });
  }
}
