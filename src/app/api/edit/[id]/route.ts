import { NextRequest, NextResponse } from "next/server";
import { idParamSchema, editSchema } from "@/lib/schemas";
import { s3, metaKey } from "@/lib/r2";
import { env } from "@/lib/env";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOk = idParamSchema.safeParse({ id: params.id });
    if (!idOk.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    
    const body = await request.json();
    const bodyOk = editSchema.safeParse(body);
    if (!bodyOk.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    
    const { id } = idOk.data;

    // Check if we're in demo mode
    if (env.r2.accountId === "demo") {
      console.log(`[DEMO] Would edit metadata for ${id}:`, bodyOk.data);
      return NextResponse.json({ 
        id, 
        name: "Demo File", 
        size: 1024, 
        createdAt: new Date().toISOString(),
        ...bodyOk.data 
      });
    }

    // fetch existing meta
    const obj = await s3!.send(new GetObjectCommand({ 
      Bucket: env.r2.bucket, 
      Key: metaKey(id) 
    }));
    
    const raw = await obj.Body?.transformToString();
    if (!raw) {
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }
    
    const meta = JSON.parse(raw);
    const updated = { ...meta, ...bodyOk.data };
    
    await s3!.send(new PutObjectCommand({ 
      Bucket: env.r2.bucket, 
      Key: metaKey(id), 
      Body: Buffer.from(JSON.stringify(updated)), 
      ContentType: "application/json" 
    }));
    
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Edit error:", e);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
