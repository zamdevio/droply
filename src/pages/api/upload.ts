import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { env } from "@/lib/env";
import { newId } from "@/lib/id";
import { putFile, putMeta, purgeOldestUntilFits } from "@/lib/r2";
import formidable from "formidable";
import { promises as fs } from "fs";

export const config = { api: { bodyParser: false } };

async function parseForm(req: NextApiRequest): Promise<{ file: Buffer; filename: string; contentType?: string }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: env.app.maxFileBytes,
      allowEmptyFiles: false,
      filter: (part) => {
        return part.mimetype && part.mimetype.includes("file");
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const file = files.file?.[0];
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      try {
        const buffer = await fs.readFile(file.filepath);
        resolve({
          file: buffer,
          filename: file.originalFilename || "unknown",
          contentType: file.mimetype || undefined
        });
        
        // Clean up temp file
        await fs.unlink(file.filepath);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1) parse multipart
    const { file, filename, contentType } = await parseForm(req);

    // 2) validate file constraints
    if (file.length > env.app.maxFileBytes) {
      return res.status(413).json({ error: "File too large" });
    }
    
    if (!env.app.allowedMimePrefixes.some(p => (contentType || "").startsWith(p))) {
      return res.status(415).json({ error: "File type not allowed" });
    }

    // 3) pre‑purge if needed to fit this upload
    const { before, after, deleted } = await purgeOldestUntilFits(file.length);

    // 4) save file + meta
    const id = newId(12);
    await putFile(id, file, file.length, contentType);
    await putMeta({ 
      id, 
      name: filename, 
      size: file.length, 
      createdAt: new Date().toISOString(), 
      contentType 
    });

    // 5) respond with links
    const base = env.app.url;
    return res.status(200).json({
      id,
      downloadUrl: `${base}/download/${id}`,
      deleteUrl: `${base}/delete/${id}`,
      editUrl: `${base}/edit/${id}`,
      debug: { before, after, deleted }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
