import { Commitment } from "@/components/sections/commitment";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Features } from "@/components/sections/features";
import { Header } from "@/components/sections/header";
import { MissionVision } from "@/components/sections/mission-vision";
import { Process } from "@/components/sections/process";
import { QuienesSomos } from "@/components/sections/quienes-somos";
import { Team } from "@/components/sections/team";
import { Testimonials } from "@/components/sections/testimonials";
import { SectionLabel } from "@/components/ui/section-label";

export default function NosotrosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-foreground/10 px-8 pt-36 pb-16 md:px-16 md:pt-44 md:pb-20">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <SectionLabel>Domus Punta del Este</SectionLabel>
            <h1 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
              Bienes raíces con <em className="text-accent italic">nombre y apellido</em>.
            </h1>
          </div>
        </section>

        <MissionVision />
        <QuienesSomos />
        <Commitment />
        <Features />
        <Process />
        <Team />
        <Testimonials />
        <CtaFooter />
      </main>
    </div>
  );
}
