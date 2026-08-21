"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportPropertiesModal } from "./import-properties-modal";

export function ImportPropertiesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Importar CSV
      </Button>
      {open && <ImportPropertiesModal onClose={() => setOpen(false)} />}
    </>
  );
}
