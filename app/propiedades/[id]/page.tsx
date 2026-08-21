import { notFound } from "next/navigation";
import { CtaFooter } from "@/components/sections/cta-footer";
import { Header } from "@/components/sections/header";
import { PropertyDetails } from "@/components/sections/property-details";
import { PropertyHero } from "@/components/sections/property-hero";
import { PropertyInquiry } from "@/components/sections/property-inquiry";
import { getProperty } from "@/lib/properties/data";
import { getTeamMembers } from "@/lib/team/data";

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

  const teamMembers = await getTeamMembers();
  const salespeople = teamMembers.filter((member) => member.role === "sales");

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <PropertyHero property={property} />
        <PropertyDetails property={property} />
        <PropertyInquiry property={property} salespeople={salespeople} />
        <CtaFooter />
      </main>
    </div>
  );
}
