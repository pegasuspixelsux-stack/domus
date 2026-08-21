import { google } from "@ai-sdk/google";
import { FieldValue } from "firebase-admin/firestore";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { pickRoundRobinAssignee } from "@/lib/leads/assignment";
import {
  BUDGET_OPTIONS,
  composeChatQualificationNotes,
  computeQualificationScore,
  URGENCY_OPTIONS,
  ZONE_OPTIONS,
} from "@/lib/leads/prequalify-validation";
import { validateLeadInput } from "@/lib/leads/validation";
import { getProperties } from "@/lib/properties/data";

const LEADS_COLLECTION = "leads";

// z.enum needs a non-empty string tuple type; the option lists are declared
// as plain string[] since they're also used with .includes() elsewhere
// (which a literal-union element type would make awkward to call with a
// bare `string`). Casting here is safe — z.enum only cares about the
// runtime array, and this still puts the real option strings in the tool's
// JSON schema for the model to pick from, unlike a z.string().refine()
// which would validate but never show the choices at all.
const budgetEnum = BUDGET_OPTIONS as [string, ...string[]];
const zoneEnum = ZONE_OPTIONS as [string, ...string[]];
const urgencyEnum = URGENCY_OPTIONS as [string, ...string[]];

function buildSystemPrompt(priorSearchCount: number): string {
  return `Eres el asistente virtual de Domus, una inmobiliaria de propiedades de ocio e inversión en Punta del Este, Uruguay.

Respondé siempre en español (Uruguay), con un tono profesional y cálido, sin emojis.

## Búsqueda de propiedades

Usá la herramienta searchProperties para buscar propiedades reales del portfolio — nunca inventes propiedades, precios ni características que no vinieron de esa herramienta. Si no hay resultados, decilo con honestidad y ofrecé ajustar la búsqueda.

## Cuándo proponer precalificación

El visitante ya usó searchProperties ${priorSearchCount} vez/veces en esta conversación.

Proponé proactivamente la precalificación — en una sola pregunta natural, no un formulario — cuando ocurra CUALQUIERA de estos casos:
- Ya buscó propiedades 2 o más veces (es decir, priorSearchCount >= 2 contando la búsqueda que estás por hacer o ya hiciste en este turno).
- Expresa interés fuerte: quiere visitar una propiedad, hablar con un asesor, avanzar con la compra, o pide más información específica sobre una propiedad puntual.

Ejemplo de cómo proponerlo: "Para conectarte con un asesor de forma óptima y mostrarte opciones exclusivas, ¿podrías indicarme brevemente tu presupuesto estimado, zona preferida y tus datos de contacto?"

## Registrar la consulta

Cuando el visitante te dé sus datos de contacto (como mínimo nombre, correo y teléfono — presupuesto y zona son un plus si los menciona), usá la herramienta prequalifyLead para registrarlo. Para presupuesto y zona, elegí la opción de la lista que mejor se ajuste a lo que dijo; si no dijo nada al respecto, dejá ese campo sin especificar — nunca inventes un valor. No uses prequalifyLead sin haber recibido nombre, correo y teléfono explícitamente.

Después de un prequalifyLead exitoso, confirmale con calidez que un asesor se pondrá en contacto — por ejemplo: "¡Listo! Un asesor experto se pondrá en contacto contigo a la brevedad con las mejores opciones."`;
}

function countPriorSearches(messages: UIMessage[]): number {
  return messages.reduce((count, message) => {
    const hits = message.parts.filter(
      (part) => part.type === "tool-searchProperties" && part.state === "output-available",
    ).length;
    return count + hits;
  }, 0);
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: buildSystemPrompt(countPriorSearches(messages)),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      searchProperties: tool({
        description:
          "Busca propiedades disponibles en el portfolio de Domus, filtrando por ubicación, tipo, dormitorios mínimos o presupuesto máximo. Todos los filtros son opcionales.",
        inputSchema: z.object({
          location: z.string().optional().describe('Zona o ubicación, ej. "José Ignacio"'),
          tag: z.string().optional().describe('Tipo de propiedad, ej. "Casa", "Apartamento"'),
          minBedrooms: z.number().optional().describe("Cantidad mínima de dormitorios"),
          maxPrice: z.number().optional().describe("Presupuesto máximo en la moneda de la propiedad (USD)"),
        }),
        execute: async ({ location, tag, minBedrooms, maxPrice }) => {
          const properties = await getProperties();
          const matches = properties
            .filter((property) => property.status === "available")
            .filter(
              (property) =>
                !location || property.location.toLowerCase().includes(location.toLowerCase()),
            )
            .filter((property) => !tag || property.tag.toLowerCase().includes(tag.toLowerCase()))
            .filter((property) => !minBedrooms || property.bedrooms >= minBedrooms)
            .filter((property) => !maxPrice || property.price <= maxPrice)
            .slice(0, 5);

          return {
            count: matches.length,
            properties: matches.map((property) => ({
              id: property.id,
              title: property.title,
              location: property.location,
              tag: property.tag,
              price: `${property.currency} ${property.price.toLocaleString("es-UY")}`,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              areaM2: property.areaM2,
              url: `/propiedades/${property.id}`,
            })),
          };
        },
      }),

      prequalifyLead: tool({
        description:
          "Pre-califica y registra al visitante como un lead estructurado en el CRM para que un asesor de Domus lo contacte. Requiere nombre, correo electrónico y teléfono ya confirmados por el visitante en la conversación; presupuesto y zona son opcionales pero mejoran la calificación del lead.",
        inputSchema: z.object({
          name: z.string().describe("Nombre completo del visitante"),
          email: z.string().describe("Correo electrónico del visitante"),
          phone: z.string().describe("Teléfono de contacto del visitante"),
          budget: z.enum(budgetEnum).optional().describe("Presupuesto estimado, solo si el visitante lo mencionó"),
          zone: z.enum(zoneEnum).optional().describe("Zona preferida, solo si el visitante la mencionó"),
          timeline: z
            .enum(urgencyEnum)
            .optional()
            .describe("Plazo o urgencia de la búsqueda, solo si el visitante lo mencionó"),
          notes: z
            .string()
            .optional()
            .describe("Resumen breve de lo que busca o la propiedad de interés, para el asesor"),
        }),
        execute: async ({ name, email, phone, budget, zone, timeline, notes }) => {
          const validated = validateLeadInput({ name, email, phone, source: "Chat IA" });
          if (!validated.valid) {
            return { success: false as const, error: Object.values(validated.errors).join(" ") };
          }

          const assignee = await pickRoundRobinAssignee();
          if (!assignee) {
            return {
              success: false as const,
              error: "No hay asesores disponibles en este momento — sugerí que escriba por WhatsApp.",
            };
          }

          const qualificationScore = computeQualificationScore({ budget, zone, timeline });

          await getFirebaseAdminFirestore()
            .collection(LEADS_COLLECTION)
            .add({
              ...validated.data,
              // Firestore's Admin SDK rejects `undefined` field values outright (this
              // project doesn't set ignoreUndefinedProperties) — an empty string is
              // the "no notes" case instead; toLead()/the UI both already treat a
              // falsy notes value as "nothing to show".
              notes: composeChatQualificationNotes({ budget, zone, timeline, notes }),
              qualificationScore,
              status: "new",
              assignedTo: assignee.uid,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });

          revalidatePath("/dashboard/pipeline");
          revalidatePath("/dashboard/leads");
          return { success: true as const, qualificationScore };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
