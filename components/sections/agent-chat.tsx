"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { type FormEvent, useState } from "react";
import { submitChatPrequalifyLead } from "@/lib/leads/actions";
import { AFTER_HOURS_MESSAGE } from "@/lib/leads/business-hours";
import { PRIVACY_DISCLAIMER } from "@/lib/leads/copy";
import {
  BATHROOMS_OPTIONS,
  BEDROOMS_OPTIONS,
  BUDGET_OPTIONS,
  CALL_TIME_OPTIONS,
  FINANCING_OPTIONS,
  GOAL_OPTIONS,
  OBSTACLE_OPTIONS,
  URGENCY_OPTIONS,
  VISIT_TIMING_OPTIONS,
  ZONE_OPTIONS,
} from "@/lib/leads/prequalify-validation";

interface ChoiceStep {
  id:
    | "goal"
    | "zone"
    | "bedrooms"
    | "bathrooms"
    | "budget"
    | "urgency"
    | "financing"
    | "obstacle"
    | "callTime"
    | "visitTiming";
  kind: "choice";
  prompt: string;
  options: readonly string[];
}

interface TextStep {
  id: "name" | "email" | "phone";
  kind: "text";
  prompt: string;
  placeholder: string;
  validate: (value: string) => string | null;
  /** When it returns true, an "Omitir" link lets the visitor move on without answering this step. */
  skippable?: (answers: Record<string, string>) => boolean;
}

type Step = ChoiceStep | TextStep;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A fixed, button-driven script — not an LLM. Every visitor gets the same
 * questions in the same order, mapped 1:1 to the /precalificacion wizard's
 * field set (see lib/leads/prequalify-validation.ts) so a chat-sourced lead
 * looks identical to a wizard-sourced one in the dashboard. Zero API calls,
 * zero token cost, zero rate-limit risk.
 *
 * Name is always required; email and phone are not both required — either
 * one is enough contact info (matching validateLeadInput's rule), so each
 * of those two steps can be skipped via its `skippable` check, as long as
 * the other one was actually answered.
 */
const STEPS: readonly Step[] = [
  { id: "goal", kind: "choice", prompt: "Para orientarlo mejor — ¿qué tipo de búsqueda es esta?", options: GOAL_OPTIONS },
  { id: "zone", kind: "choice", prompt: "¿Tiene alguna zona en mente?", options: ZONE_OPTIONS },
  { id: "bedrooms", kind: "choice", prompt: "¿Cuántos dormitorios está buscando?", options: BEDROOMS_OPTIONS },
  { id: "bathrooms", kind: "choice", prompt: "¿Y cuántos baños?", options: BATHROOMS_OPTIONS },
  { id: "budget", kind: "choice", prompt: "¿Cuál es su presupuesto estimado?", options: BUDGET_OPTIONS },
  { id: "urgency", kind: "choice", prompt: "¿Con qué urgencia está buscando?", options: URGENCY_OPTIONS },
  { id: "financing", kind: "choice", prompt: "¿Cómo piensa financiar la compra?", options: FINANCING_OPTIONS },
  { id: "obstacle", kind: "choice", prompt: "¿Hay algún obstáculo que debamos tener en cuenta?", options: OBSTACLE_OPTIONS },
  { id: "callTime", kind: "choice", prompt: "¿Cuál es un buen horario para llamarlo?", options: CALL_TIME_OPTIONS },
  { id: "visitTiming", kind: "choice", prompt: "¿Cuándo le gustaría visitar la propiedad?", options: VISIT_TIMING_OPTIONS },
  {
    id: "name",
    kind: "text",
    prompt: "Excelente. Para conectarlo con un asesor de Domus, ¿cuál es su nombre?",
    placeholder: "Su nombre completo",
    validate: (value) => (value.trim() ? null : "Ingrese su nombre."),
  },
  {
    id: "email",
    kind: "text",
    prompt: "¿Su correo electrónico?",
    placeholder: "nombre@ejemplo.com",
    validate: (value) => (EMAIL_PATTERN.test(value.trim()) ? null : "Ingrese un correo electrónico válido."),
    // Always skippable: phone alone is enough contact info, checked below.
    skippable: () => true,
  },
  {
    id: "phone",
    kind: "text",
    prompt: "¿Y un teléfono de contacto?",
    placeholder: "+598 99 123 456",
    validate: (value) => (value.trim() ? null : "Ingrese un teléfono."),
    // Only skippable once email has already been given — one contact method is required.
    skippable: (answers) => Boolean(answers.email),
  },
] as const;

const GREETING =
  "Hola, soy el asistente de Domus. Le voy a hacer algunas preguntas breves para conectarlo con el asesor indicado — elija la opción que prefiera en cada paso.";

interface TranscriptEntry {
  id: string;
  role: "bot" | "user";
  text: string;
}

type SubmitState = { status: "idle" } | { status: "pending" } | { status: "success" } | { status: "error"; message: string };

function initialTranscript(): TranscriptEntry[] {
  return [
    { id: "greeting", role: "bot", text: GREETING },
    { id: `prompt-${STEPS[0].id}`, role: "bot", text: STEPS[0].prompt },
  ];
}

export function AgentChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(initialTranscript);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textInput, setTextInput] = useState("");
  const [textError, setTextError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const hidden = pathname.startsWith("/dashboard") || pathname === "/login" || pathname === "/forgot-password";
  if (hidden) return null;

  const currentStep = stepIndex < STEPS.length ? STEPS[stepIndex] : null;

  function advance(stepId: string, value: string, label: string) {
    setTranscript((prev) => [...prev, { id: `answer-${stepId}`, role: "user", text: label }]);
    setAnswers((prev) => ({ ...prev, [stepId]: value }));

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);

    if (nextIndex < STEPS.length) {
      const next = STEPS[nextIndex];
      setTranscript((prev) => [...prev, { id: `prompt-${next.id}`, role: "bot", text: next.prompt }]);
    } else {
      void submitAnswers({ ...answers, [stepId]: value });
    }
  }

  function handleChoice(option: string) {
    if (!currentStep || currentStep.kind !== "choice") return;
    advance(currentStep.id, option, option);
  }

  function handleTextSubmit(event: FormEvent) {
    event.preventDefault();
    if (!currentStep || currentStep.kind !== "text") return;

    const value = textInput.trim();
    const error = currentStep.validate(value);
    if (error) {
      setTextError(error);
      return;
    }

    setTextError(null);
    setTextInput("");
    advance(currentStep.id, value, value);
  }

  function handleSkip() {
    if (!currentStep || currentStep.kind !== "text") return;
    setTextError(null);
    setTextInput("");
    advance(currentStep.id, "", "(sin especificar)");
  }

  async function submitAnswers(finalAnswers: Record<string, string>) {
    setSubmitState({ status: "pending" });
    setTranscript((prev) => [...prev, { id: "submitting", role: "bot", text: "Enviando su consulta…" }]);

    try {
      const result = await submitChatPrequalifyLead({
        name: finalAnswers.name,
        email: finalAnswers.email,
        phone: finalAnswers.phone,
        goal: finalAnswers.goal,
        zone: finalAnswers.zone,
        bedrooms: finalAnswers.bedrooms,
        bathrooms: finalAnswers.bathrooms,
        budget: finalAnswers.budget,
        urgency: finalAnswers.urgency,
        financing: finalAnswers.financing,
        obstacle: finalAnswers.obstacle,
        callTime: finalAnswers.callTime,
        visitTiming: finalAnswers.visitTiming,
      });

      if (result.success) {
        setSubmitState({ status: "success" });
        setTranscript((prev) => [
          ...prev,
          {
            id: "confirmation",
            role: "bot",
            text: result.afterHours
              ? AFTER_HOURS_MESSAGE
              : "¡Listo! Un asesor experto se pondrá en contacto con usted a la brevedad con las mejores opciones.",
          },
        ]);
      } else {
        setSubmitState({ status: "error", message: result.error });
        setTranscript((prev) => [...prev, { id: "submit-error", role: "bot", text: result.error }]);
      }
    } catch {
      const message = "No pudimos enviar su consulta. Intente de nuevo en unos minutos.";
      setSubmitState({ status: "error", message });
      setTranscript((prev) => [...prev, { id: "submit-error", role: "bot", text: message }]);
    }
  }

  const busy = submitState.status === "pending";

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
            <p className="text-xs text-muted-foreground">Precalificación rápida en un par de pasos</p>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {transcript.map((entry) => (
              <div key={entry.id} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2 text-sm leading-relaxed ${
                    entry.role === "user" ? "bg-foreground text-background" : "bg-muted-background text-foreground"
                  }`}
                >
                  <span className="whitespace-pre-wrap">{entry.text}</span>
                </div>
              </div>
            ))}

            {currentStep?.kind === "choice" && (
              <div className="flex flex-wrap gap-2">
                {currentStep.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChoice(option)}
                    className="border border-foreground/30 px-3 py-1.5 text-xs text-foreground transition-colors duration-300 hover:border-accent hover:text-accent"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {busy && <p className="text-xs text-muted-foreground uppercase">Enviando…</p>}
          </div>

          {currentStep?.kind === "text" && (
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-2 border-t border-foreground/10 p-3">
              <div className="flex items-center gap-3">
                <input
                  value={textInput}
                  onChange={(event) => {
                    setTextInput(event.target.value);
                    setTextError(null);
                  }}
                  placeholder={currentStep.placeholder}
                  autoFocus
                  className="h-10 min-w-0 flex-1 border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  aria-label="Enviar respuesta"
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition-colors duration-300 hover:text-accent disabled:opacity-30"
                >
                  <Send size={18} />
                </button>
              </div>
              {textError && (
                <p role="alert" className="text-xs text-red-600">
                  {textError}
                </p>
              )}
              {currentStep.skippable?.(answers) && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="self-start text-xs tracking-[0.1em] text-muted-foreground uppercase hover:text-accent"
                >
                  Omitir — no tengo este dato
                </button>
              )}
              <p className="text-xs text-muted-foreground">{PRIVACY_DISCLAIMER}</p>
            </form>
          )}
        </div>
      )}
    </>
  );
}
