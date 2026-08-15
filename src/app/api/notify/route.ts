import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { isPresenceOnline } from "@/lib/presence";

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

  const [{ data: subs }, { data: presenceRows }] = await Promise.all([
    supabase.from("push_subscriptions").select("*").neq("name", senderName),
    supabase.from("presence").select("name, online, updated_at"),
  ]);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const recipients = subs.filter(
    (row) => !isPresenceOnline(presenceRows?.find((p) => p.name === row.name))
  );

  let sent = 0;
  await Promise.all(
    recipients.map(async (row) => {
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

  return NextResponse.json({ sent, skippedOnline: subs.length - recipients.length });
}
