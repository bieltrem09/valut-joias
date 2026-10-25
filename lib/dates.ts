/**
 * Datas como strings "YYYY-MM-DD" no fuso de São Paulo. Tudo manual, sem
 * toLocaleDateString, para o servidor e o cliente renderizarem igual.
 */
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"] as const;

export type ISODate = string;

export function todaySP(now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA já sai como YYYY-MM-DD
}

function toUTC(d: ISODate) {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}

export function addDays(d: ISODate, n: number): ISODate {
  const t = new Date(toUTC(d) + n * 86_400_000);
  return t.toISOString().slice(0, 10);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86_400_000);
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function isISODate(s: unknown): s is ISODate {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUTC(s));
}

/** "25 out" */
export function shortDate(d: ISODate): string {
  const [, m, day] = d.split("-").map(Number);
  return `${day} ${MESES[m - 1]}`;
}

/** "25 out 2026" */
export function mediumDate(d: ISODate): string {
  const [y] = d.split("-");
  return `${shortDate(d)} ${y}`;
}

export function monthName(d: ISODate): string {
  return MESES_LONGOS[Number(d.split("-")[1]) - 1];
}

/** "há 3 dias", "hoje", "ontem" */
export function relativeDays(d: ISODate, today: ISODate): string {
  const n = diffDays(today, d);
  if (n <= 0) return "hoje";
  if (n === 1) return "ontem";
  if (n < 30) return `há ${n} dias`;
  const m = Math.round(n / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}
