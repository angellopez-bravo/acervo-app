import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, accessConfigured, codeIsValid, sessionToken } from "@/lib/server/access";

const FAILURE_DELAY_MS = 800;

export async function POST(request: Request) {
  if (!accessConfigured()) {
    return Response.json({ error: "El servidor no tiene configurado ACCESS_CODE." }, { status: 500 });
  }
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.slice(0, 200) : "";

  if (!codeIsValid(code)) {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return Response.json({ error: "El código no es correcto." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
