import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { PropertyListing } from "@/components/sections/property-listing";
import { SectionLabel } from "@/components/ui/section-label";
import { getProperties } from "@/lib/properties/data";

export default async function PropiedadesPage() {
  const properties = await getProperties();
  const available = properties.filter((property) => property.status === "available");

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-foreground/10 px-8 pt-36 pb-16 md:px-16 md:pt-44 md:pb-20">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
            <SectionLabel>Portfolio Completo</SectionLabel>
            <h1 className="font-serif text-4xl leading-[1] tracking-tight md:text-5xl lg:text-6xl">
              Cada residencia, <em className="text-accent italic">a su medida</em>.
            </h1>
          </div>
        </section>

        <PropertyListing properties={available} />

        <CtaFooter />
      </main>
    </div>
  );
}
