import { Commitment } from "@/components/sections/commitment";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { MissionVision } from "@/components/sections/mission-vision";
import { NosotrosHero } from "@/components/sections/nosotros-hero";
import { NosotrosPorQueDomus } from "@/components/sections/nosotros-por-que-domus";
import { NosotrosProcess } from "@/components/sections/nosotros-process";
import { NosotrosQuienesSomos } from "@/components/sections/nosotros-quienes-somos";
import { Team } from "@/components/sections/team";
import { Testimonials } from "@/components/sections/testimonials";

export default function NosotrosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <NosotrosHero />

        <MissionVision />
        <NosotrosQuienesSomos />
        <NosotrosPorQueDomus />
        <Commitment />
        <NosotrosProcess />
        <Team />
        <Testimonials />
        <CtaFooter />
      </main>
    </div>
  );
}
