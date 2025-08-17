import { NextRequest, NextResponse } from "next/server";
import { idParamSchema, editSchema } from "@/lib/schemas";
import { s3, metaKey } from "@/lib/r2";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

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

    // fetch existing meta
    const obj = await s3.send(new GetObjectCommand({ 
      Bucket: env.r2.bucket, 
      Key: metaKey(id) 
    }));
    
    const raw = await obj.Body?.transformToString();
    if (!raw) {
      return NextResponse.json({ error: "Metadata not found" }, { status: 404 });
    }
    
    const meta = JSON.parse(raw);
    const updated = { ...meta, ...bodyOk.data };
    
    await s3.send(new PutObjectCommand({ 
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
