export type PropertyStatus = "available" | "reserved" | "sold";

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: PropertyStatus;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PropertyInput {
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  tag: string;
  status: PropertyStatus;
  images: string[];
  features: string[];
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  featured: boolean;
}
