"use client";

import { useState } from "react";
import { putItems } from "@/lib/db";
import { buildSampleItems } from "@/lib/sample";
import { refreshItems } from "@/lib/useItems";

export default function SeedButton({ primary = false }: { primary?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={primary ? "btn btn-primary" : "btn"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await putItems(buildSampleItems());
          await refreshItems();
        } finally {
          setBusy(false);
        }
      }}
    >
      Cargar datos de ejemplo
    </button>
  );
}
