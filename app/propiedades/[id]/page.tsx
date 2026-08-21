import { notFound } from "next/navigation";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { PropertyDetails } from "@/components/sections/property-details";
import { PropertyHero } from "@/components/sections/property-hero";
import { getProperty } from "@/lib/properties/data";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <PropertyHero property={property} />
        <PropertyDetails property={property} />
        <CtaFooter />
      </main>
    </div>
  );
}
