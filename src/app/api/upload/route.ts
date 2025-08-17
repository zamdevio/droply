import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { newId } from "@/lib/id";
import { putFile, putMeta, purgeOldestUntilFits } from "@/lib/r2";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > env.app.maxFileBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // Validate MIME type
    if (!env.app.allowedMimePrefixes.some(p => file.type.startsWith(p))) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    // Save file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Pre-purge if needed to fit this upload
    const { before, after, deleted } = await purgeOldestUntilFits(buffer.length);

    // Save file + meta
    const id = newId(12);
    await putFile(id, buffer, buffer.length, file.type);
    await putMeta({ 
      id, 
      name: file.name, 
      size: buffer.length, 
      createdAt: new Date().toISOString(), 
      contentType: file.type 
    });

    // Respond with links
    const base = env.app.url;
    return NextResponse.json({
      id,
      downloadUrl: `${base}/download/${id}`,
      deleteUrl: `${base}/delete/${id}`,
      editUrl: `${base}/edit/${id}`,
      debug: { before, after, deleted }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
