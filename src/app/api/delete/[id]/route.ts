import { NextRequest, NextResponse } from "next/server";
import { idParamSchema } from "@/lib/schemas";
import { deleteFile } from "@/lib/r2";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parsed = idParamSchema.safeParse({ id: params.id });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    
    const { id } = parsed.data;
    await deleteFile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
