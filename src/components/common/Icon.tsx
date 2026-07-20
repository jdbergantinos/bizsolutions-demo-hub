import {
  Anchor, Banknote, Briefcase, Building2, Calculator, Car, Church, Cpu,
  Dumbbell, Factory, Fish, Flower2, GraduationCap, Handshake, HardHat,
  Headset, HeartHandshake, Hotel, Landmark, Megaphone, Mountain, Network,
  Newspaper, PackageCheck, PartyPopper, PawPrint, Presentation, Recycle,
  Scale, Shield, ShieldCheck, Ship, ShoppingBag, Sparkles, Stethoscope,
  Store, Sun, Truck, Users, UtensilsCrossed, Warehouse, Wheat, Wifi, Wrench,
  Boxes, CalendarCheck, ClipboardList, FileCheck2, FileText, Gauge,
  KanbanSquare, LayoutDashboard, ListChecks, Package, Receipt, School,
  Ticket, UserRound, Workflow, CircleHelp, type LucideIcon,
} from "lucide-react";

// Central registry so industry/module icons can be configured as strings.
const ICONS: Record<string, LucideIcon> = {
  Anchor, Banknote, Briefcase, Building2, Calculator, Car, Church, Cpu,
  Dumbbell, Factory, Fish, Flower2, GraduationCap, Handshake, HardHat,
  Headset, HeartHandshake, Hotel, Landmark, Megaphone, Mountain, Network,
  Newspaper, PackageCheck, PartyPopper, PawPrint, Presentation, Recycle,
  Scale, Shield, ShieldCheck, Ship, ShoppingBag, Sparkles, Stethoscope,
  Store, Sun, Truck, Users, UtensilsCrossed, Warehouse, Wheat, Wifi, Wrench,
  Boxes, CalendarCheck, ClipboardList, FileCheck2, FileText, Gauge,
  KanbanSquare, LayoutDashboard, ListChecks, Package, Receipt, School,
  Ticket, UserRound, Workflow,
};

/** Icons for the 20 demo module types. */
export const MODULE_ICONS: Record<string, string> = {
  crm: "KanbanSquare",
  booking: "CalendarCheck",
  inventory: "Boxes",
  ordering: "Receipt",
  procurement: "Package",
  quotation: "FileText",
  projects: "ClipboardList",
  portal: "UserRound",
  approvals: "FileCheck2",
  scheduling: "CalendarCheck",
  tasks: "ListChecks",
  documents: "FileText",
  delivery: "Truck",
  maintenance: "Wrench",
  membership: "Ticket",
  learning: "School",
  billing: "Receipt",
  dashboard: "LayoutDashboard",
  production: "Factory",
  universal: "Workflow",
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? CircleHelp;
  return <Cmp className={className} aria-hidden="true" />;
}
