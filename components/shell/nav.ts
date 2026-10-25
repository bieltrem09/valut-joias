import { ChartNoAxesColumn, Nfc, Radar, Receipt, Store, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; short: string; icon: LucideIcon; period: boolean };

export const NAV: NavItem[] = [
  { href: "/", label: "Minhas vendas", short: "Vendas", icon: ChartNoAxesColumn, period: true },
  { href: "/placas", label: "Placas NFC", short: "Placas", icon: Nfc, period: false },
  { href: "/clientes", label: "Clientes", short: "Clientes", icon: Store, period: false },
  { href: "/despesas", label: "Despesas", short: "Despesas", icon: Receipt, period: true },
  { href: "/prospeccao", label: "Prospecção", short: "Leads", icon: Radar, period: false },
];

export const EXTRA_TITLES: Record<string, string> = { "/configuracoes": "Configurações" };

export function activeNav(pathname: string) {
  return NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));
}
