import { CtaFooter } from "@/components/sections/cta-footer";
import { Features } from "@/components/sections/features";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Process } from "@/components/sections/process";
import { QuienesSomos } from "@/components/sections/quienes-somos";
import { Showcase } from "@/components/sections/showcase";
import { Team } from "@/components/sections/team";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Hero />
        <Showcase />
        <QuienesSomos />
        <Features />
        <Team />
        <Testimonials />
        <Process />
        <CtaFooter />
      </main>
    </div>
  );
}
