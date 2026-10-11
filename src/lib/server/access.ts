import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./claude";

export const SESSION_COOKIE = "acervo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;
const MAX_BODY_BYTES = 1_000_000;

const configuredCode = () => process.env.ACCESS_CODE?.trim() || null;

/** La cookie no contiene el código: es un HMAC derivado, y cambiar ACCESS_CODE invalida todas las sesiones. */
const tokenFor = (code: string) => createHmac("sha256", code).update("acervo-session-v1").digest();

function sameToken(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export const accessConfigured = () => configuredCode() !== null;

export function codeIsValid(input: string): boolean {
  const code = configuredCode();
  return code !== null && sameToken(tokenFor(input), tokenFor(code));
}

export function sessionToken(): string | null {
  const code = configuredCode();
  return code ? tokenFor(code).toString("hex") : null;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function hasSession(request: Request): boolean {
  const code = configuredCode();
  const cookie = readCookie(request, SESSION_COOKIE);
  if (!code || !cookie) return false;
  return sameToken(Buffer.from(cookie), Buffer.from(tokenFor(code).toString("hex")));
}

/** Debe llamarse al inicio de toda ruta que gaste saldo de la API. */
export function requireAccess(request: Request): void {
  if (!configuredCode()) {
    // En desarrollo local se permite sin código; en producción nunca queda abierta.
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("El servidor no tiene configurado ACCESS_CODE.", 500);
    }
  } else if (!hasSession(request)) {
    throw new ApiError("Hace falta el código de acceso.", 401);
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new ApiError("La petición es demasiado grande.", 413);
}
