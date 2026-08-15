import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: Request) {
  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json({ skipped: "vapid not configured" });
  }

  const body = await request.json().catch(() => null);
  const senderName = typeof body?.senderName === "string" ? body.senderName : "";
  const title = typeof body?.title === "string" ? body.title : "Nous 💌";
  const text = typeof body?.body === "string" ? body.body : "";
  const url = typeof body?.url === "string" ? body.url : "/chat";

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .neq("name", senderName);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify({ title, body: text, url })
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
        }
      }
    })
  );

  return NextResponse.json({ sent });
}
