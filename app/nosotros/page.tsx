import { Commitment } from "@/components/sections/commitment";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Features } from "@/components/sections/features";
import { Header } from "@/components/sections/header";
import { MissionVision } from "@/components/sections/mission-vision";
import { NosotrosHero } from "@/components/sections/nosotros-hero";
import { Process } from "@/components/sections/process";
import { QuienesSomos } from "@/components/sections/quienes-somos";
import { Team } from "@/components/sections/team";
import { Testimonials } from "@/components/sections/testimonials";

export default function NosotrosPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <NosotrosHero />

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
