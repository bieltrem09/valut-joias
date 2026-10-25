import { addDays, diffDays, isISODate, shortDate, todaySP, type ISODate } from "./dates";

export const PERIOD_KEYS = ["hoje", "ontem", "7d", "30d", "custom"] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];
export const DEFAULT_PERIOD: PeriodKey = "30d";

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7d": "7 dias",
  "30d": "30 dias",
  custom: "Personalizado",
};

export type Period = {
  key: PeriodKey;
  de: ISODate;
  ate: ISODate;
  dias: number;
  anterior: { de: ISODate; ate: ISODate };
  /** "nos últimos 30 dias", "hoje", "de 2 out a 9 out" */
  frase: string;
  /** "o período anterior", "ontem", "anteontem" */
  fraseAnterior: string;
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parsePeriod(sp: SP, today: ISODate = todaySP()): Period {
  const raw = first(sp.p);
  const key: PeriodKey = (PERIOD_KEYS as readonly string[]).includes(raw ?? "") ? (raw as PeriodKey) : DEFAULT_PERIOD;

  let de: ISODate;
  let ate: ISODate = today;
  let frase: string;
  let fraseAnterior = "o período anterior";

  switch (key) {
    case "hoje":
      de = today;
      frase = "hoje";
      fraseAnterior = "ontem";
      break;
    case "ontem":
      de = ate = addDays(today, -1);
      frase = "ontem";
      fraseAnterior = "anteontem";
      break;
    case "7d":
      de = addDays(today, -6);
      frase = "nos últimos 7 dias";
      fraseAnterior = "os 7 dias anteriores";
      break;
    case "custom": {
      const a = first(sp.de);
      const b = first(sp.ate);
      if (isISODate(a) && isISODate(b)) {
        [de, ate] = a <= b ? [a, b] : [b, a];
        if (ate > today) ate = today;
        if (de > ate) de = ate;
      } else {
        de = addDays(today, -29);
      }
      frase = de === ate ? `em ${shortDate(de)}` : `de ${shortDate(de)} a ${shortDate(ate)}`;
      break;
    }
    default:
      de = addDays(today, -29);
      frase = "nos últimos 30 dias";
      fraseAnterior = "os 30 dias anteriores";
  }

  const dias = diffDays(ate, de) + 1;
  const anterior = { de: addDays(de, -dias), ate: addDays(de, -1) };
  return { key, de, ate, dias, anterior, frase, fraseAnterior };
}

/** Monta a query string preservando o período. */
export function periodQuery(p: Pick<Period, "key" | "de" | "ate">) {
  if (p.key === "custom") return `?p=custom&de=${p.de}&ate=${p.ate}`;
  return `?p=${p.key}`;
}
