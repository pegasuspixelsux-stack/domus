import { google } from "@ai-sdk/google";
import { FieldValue } from "firebase-admin/firestore";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { pickRoundRobinAssignee } from "@/lib/leads/assignment";
import { validateLeadInput } from "@/lib/leads/validation";
import { getProperties } from "@/lib/properties/data";

const LEADS_COLLECTION = "leads";

const SYSTEM_PROMPT = `Eres el asistente virtual de Domus, una inmobiliaria de propiedades de ocio e inversión en Punta del Este, Uruguay.

Respondé siempre en español (Uruguay), con un tono profesional y cálido, sin emojis.

Usá la herramienta searchProperties para buscar propiedades reales del portfolio — nunca inventes propiedades, precios ni características que no vinieron de esa herramienta. Si no hay resultados, decilo con honestidad y ofrecé ajustar la búsqueda.

Si el visitante muestra interés genuino en que un asesor lo contacte (agendar una visita, recibir más información, avanzar con una propiedad), pedile su nombre, correo electrónico y teléfono, y usá bookAppointment para registrarlo como consulta. No uses bookAppointment sin haber pedido y recibido esos tres datos explícitamente.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
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

      bookAppointment: tool({
        description:
          "Registra al visitante como una consulta para que un asesor de Domus lo contacte. Requiere nombre, correo electrónico y teléfono ya confirmados por el visitante en la conversación.",
        inputSchema: z.object({
          name: z.string().describe("Nombre completo del visitante"),
          email: z.string().describe("Correo electrónico del visitante"),
          phone: z.string().describe("Teléfono de contacto del visitante"),
          notes: z
            .string()
            .optional()
            .describe("Resumen breve de lo que busca o la propiedad de interés, para el asesor"),
        }),
        execute: async ({ name, email, phone, notes }) => {
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

          await getFirebaseAdminFirestore()
            .collection(LEADS_COLLECTION)
            .add({
              ...validated.data,
              notes: notes?.trim() || undefined,
              status: "new",
              assignedTo: assignee.uid,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });

          revalidatePath("/dashboard/pipeline");
          revalidatePath("/dashboard/leads");
          return { success: true as const };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
