import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { Reveal } from "@/components/ui/reveal";
import { RevealGroup, RevealGroupItem } from "@/components/ui/reveal-group";
import { SectionLabel } from "@/components/ui/section-label";

const team = [
  { name: "Ana Belén Restivo", role: "Directora Comercial" },
  { name: "Martín Souza", role: "Asesor Senior" },
  { name: "Valentina Prieto", role: "Asesora de Inversión" },
  { name: "Federico Lussich", role: "Asesor de Propiedades" },
];

export function Team() {
  return (
    <section id="equipo" className="border-b border-foreground/10 px-8 py-20 md:px-16 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <Reveal className="mb-16 flex flex-col gap-6 lg:mb-24 lg:max-w-xl lg:pl-[8.33%]">
          <SectionLabel>Nuestro Equipo</SectionLabel>
          <h2 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
            Personas, no <em className="text-accent italic">formularios</em>.
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-x-8 gap-y-16 lg:grid-cols-4">
          {team.map((member) => (
            <RevealGroupItem key={member.name} className="group flex flex-col gap-4">
              <PlaceholderImage aspect="aspect-[3/4]" tone="feature" />
              <div className="flex flex-col">
                <h3 className="font-serif text-xl">{member.name}</h3>
                <span className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  {member.role}
                </span>
              </div>
            </RevealGroupItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
