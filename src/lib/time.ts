/** Hora atual em Americana (America/Sao_Paulo), independente do fuso do visitante. */
export function nowInSaoPaulo(d = new Date()) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  // 0 = Seg … 6 = Dom
  const wd = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].indexOf(get("weekday").replace(".", "").toLowerCase());
  return { hour, minute, dayIndex: wd < 0 ? 0 : wd, hhmm: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

export function turnoDaHora(h: number) {
  if (h < 6) return "madrugada" as const;
  if (h < 12) return "manha" as const;
  if (h < 18) return "tarde" as const;
  return "noite" as const;
}
