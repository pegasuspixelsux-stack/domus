import { Star } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const testimonials = [
  {
    quote:
      "Domus nos mostró exactamente lo que buscábamos, sin hacernos perder tiempo en propiedades que no cerraban los números.",
    name: "Marcela Ibarra",
    role: "Compradora, Buenos Aires",
  },
  {
    quote:
      "El análisis de retorno que nos presentaron fue más riguroso que el de nuestro propio banco. Se nota que entienden de inversión, no solo de ladrillos.",
    name: "Rodrigo Fontes",
    role: "Inversor, Montevideo",
  },
  {
    quote:
      "Un mismo asesor nos acompañó de punta a punta, desde la primera videollamada hasta la escritura. Eso no tiene precio a la distancia.",
    name: "Luiza Andrade",
    role: "Compradora, São Paulo",
  },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl">
          <SectionLabel>Lo Que Dicen Nuestros Clientes</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Confianza, no <em className="text-accent italic">venta</em>.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {testimonials.map((testimonial) => (
            <RevealGroupItem key={testimonial.name}>
              <figure className="group border-l border-foreground/20 pl-6 transition-all duration-500 hover:border-accent hover:pl-8">
                <div className="mb-4 flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star
                      key={star}
                      strokeWidth={1.5}
                      className="h-3 w-3 fill-current transition-transform duration-500 group-hover:scale-110"
                    />
                  ))}
                </div>

                <blockquote className="font-serif text-xl leading-relaxed italic">
                  “{testimonial.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="h-10 w-10 shrink-0 bg-muted-background grayscale transition-[filter] duration-[1500ms] group-hover:grayscale-0" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium transition-colors duration-500 group-hover:text-accent">
                      {testimonial.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{testimonial.role}</span>
                  </span>
                </figcaption>
              </figure>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
