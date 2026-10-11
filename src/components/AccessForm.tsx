"use client";

import { useState } from "react";
import { AccessError, login } from "@/lib/analysis";

export default function AccessForm({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      await login(code.trim());
      onDone();
    } catch (err) {
      setError(err instanceof AccessError ? "El código no es correcto." : err instanceof Error ? err.message : "No se pudo entrar.");
      setBusy(false);
    }
  }

  return (
    <form className="access" onSubmit={submit}>
      <p>El análisis con IA está protegido. Introduce tu código de acceso; solo hace falta una vez en este dispositivo.</p>
      <input
        className="search"
        type="password"
        name="access-code"
        autoComplete="off"
        placeholder="Código de acceso"
        aria-label="Código de acceso"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="btn btn-primary" disabled={busy || !code.trim()}>
        {busy ? "Comprobando" : "Entrar"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
