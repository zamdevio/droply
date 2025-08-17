import type { NextApiRequest, NextApiResponse } from "next";
import { idParamSchema, editSchema } from "@/lib/schemas";
import { s3, metaKey } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).end();
  
  const idOk = idParamSchema.safeParse(req.query);
  if (!idOk.success) return res.status(400).json({ error: "Invalid id" });
  
  const bodyOk = editSchema.safeParse(req.body);
  if (!bodyOk.success) return res.status(400).json({ error: "Invalid body" });
  
  const { id } = idOk.data;

  try {
    // fetch existing meta
    const obj = await s3.send(new GetObjectCommand({ 
      Bucket: env.r2.bucket, 
      Key: metaKey(id) 
    }));
    
    const raw = await obj.Body?.transformToString();
    if (!raw) {
      return res.status(404).json({ error: "Metadata not found" });
    }
    
    const meta = JSON.parse(raw);
    const updated = { ...meta, ...bodyOk.data };
    
    await s3.send(new PutObjectCommand({ 
      Bucket: env.r2.bucket, 
      Key: metaKey(id), 
      Body: Buffer.from(JSON.stringify(updated)), 
      ContentType: "application/json" 
    }));
    
    return res.status(200).json(updated);
  } catch (e) {
    console.error("Edit error:", e);
    return res.status(404).json({ error: "File not found" });
  }
}
