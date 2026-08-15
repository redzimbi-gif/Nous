export async function sendNotification(params: {
  senderName: string;
  title: string;
  body: string;
  url: string;
}) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // best effort : une notif ratée ne doit jamais bloquer l'action de l'utilisateur
  }
}
