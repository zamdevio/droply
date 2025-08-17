import { NextRequest, NextResponse } from "next/server";
import { idParamSchema } from "@/lib/schemas";
import { getFile } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parsed = idParamSchema.safeParse({ id: params.id });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    
    const { id } = parsed.data;
    const file = await getFile(id);
    
    if (!file.Body) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Set appropriate headers
    const headers = new Headers();
    if (file.ContentType) {
      headers.set('Content-Type', file.ContentType);
    }
    if (file.ContentLength) {
      headers.set('Content-Length', file.ContentLength.toString());
    }
    headers.set('Content-Disposition', `attachment; filename="${id}"`);

    // Stream the file to the response
    const stream = file.Body as any;
    if (stream.transformToWebStream) {
      // Handle ReadableStream for newer AWS SDK versions
      const webStream = stream.transformToWebStream();
      return new Response(webStream, { headers });
    } else {
      // Fallback: read the entire stream
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      return new Response(buffer, { headers });
    }
    
  } catch (e) {
    console.error("Download error:", e);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
