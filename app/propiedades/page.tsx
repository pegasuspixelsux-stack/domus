import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { PropertyListing } from "@/components/sections/property-listing";
import { PropiedadesHero } from "@/components/sections/propiedades-hero";
import { getProperties } from "@/lib/properties/data";

export default async function PropiedadesPage() {
  const properties = await getProperties();
  const available = properties.filter((property) => property.status === "available");

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <PropiedadesHero />

        <PropertyListing properties={available} />

        <CtaFooter />
      </main>
    </div>
  );
}
