import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  if (!name) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await supabase
    .from("presence")
    .upsert({ name, online: false, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
