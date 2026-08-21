"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useState } from "react";

interface PropertyResult {
  id: string;
  title: string;
  location: string;
  tag: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  url: string;
}

/**
 * Floating chat widget, mounted once in the root layout so it's available
 * on every public page. Hidden on /login, /forgot-password, and the entire
 * /dashboard area — those aren't visitor-facing, and an admin/sales user
 * mid-task doesn't need a lead-capture bot popping up over their own tools.
 */
export function AgentChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const hidden = pathname.startsWith("/dashboard") || pathname === "/login" || pathname === "/forgot-password";
  if (hidden) return null;

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar chat" : "Abrir chat con el asistente Domus"}
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed right-6 bottom-24 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-3rem)] max-w-sm flex-col border border-foreground/10 bg-background shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
          <div className="border-b border-foreground/10 px-5 py-4">
            <p className="font-serif text-lg">Asistente Domus</p>
            <p className="text-xs text-muted-foreground">Consulte por propiedades o deje sus datos</p>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Hola, soy el asistente de Domus. Cuénteme qué tipo de propiedad está buscando —
                zona, dormitorios o presupuesto — y le muestro opciones del portfolio.
              </p>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2 text-sm leading-relaxed ${
                    message.role === "user" ? "bg-foreground text-background" : "bg-muted-background text-foreground"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <span key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      );
                    }

                    if (part.type === "tool-searchProperties" && part.state === "output-available") {
                      const output = part.output as { count: number; properties: PropertyResult[] };
                      if (output.properties.length === 0) return null;
                      return (
                        <div key={index} className="mt-2 flex flex-col gap-2">
                          {output.properties.map((property) => (
                            <Link
                              key={property.id}
                              href={property.url}
                              className="block border border-foreground/15 bg-background p-3 text-foreground transition-colors duration-300 hover:border-accent"
                            >
                              <span className="block font-serif text-base">{property.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {property.location} — {property.price}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground uppercase">
                                {property.bedrooms} dorm · {property.bathrooms} baños · {property.areaM2} m²
                              </span>
                            </Link>
                          ))}
                        </div>
                      );
                    }

                    if (part.type === "tool-bookAppointment" && part.state === "output-available") {
                      const output = part.output as { success: boolean; error?: string };
                      return (
                        <p key={index} className="mt-2 text-xs text-muted-foreground italic">
                          {output.success
                            ? "Sus datos fueron registrados — un asesor se pondrá en contacto."
                            : output.error}
                        </p>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))}

            {busy && <p className="text-xs text-muted-foreground uppercase">Escribiendo…</p>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-foreground/10 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escriba su consulta…"
              disabled={busy}
              className="h-10 min-w-0 flex-1 border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition-colors duration-300 hover:text-accent disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
