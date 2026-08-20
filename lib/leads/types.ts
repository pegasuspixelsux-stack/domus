export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "visit_scheduled"
  | "negotiation"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  assignedTo: string;
  propertyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  source: string;
}

export type ActivityType = "call" | "whatsapp" | "email" | "note" | "status_change";

export interface Activity {
  id: string;
  type: ActivityType;
  note: string;
  createdAt: string;
  createdBy: string;
}
