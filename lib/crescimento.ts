/**
 * Crescimento de avaliações no Google a partir de MEDIÇÕES REAIS.
 *
 * O Google não entrega histórico: só o total de hoje. Por isso o painel
 * mede uma vez por dia (cron) e sempre que você atualiza. Cada medição é
 * um ponto real; entre dois pontos a linha é só ligação, nunca estimativa.
 *
 * Base ("avaliações no dia da placa"):
 *   1. o valor que você registrou à mão para a instalação, se houver;
 *   2. senão, a última medição feita até o dia da ativação da placa;
 *   3. senão, a primeira medição depois dela — aí o ganho é um piso (conta
 *      a partir dessa medição) e o painel diz isso com todas as letras.
 */
import { addDays, diffDays, eachDay, type ISODate } from "./dates";

export type Medicao = { data: ISODate; total: number; rating: number | null; fonte: "google" | "manual" };

export type Crescimento = {
  medicoes: Medicao[];
  instalacao: ISODate | null;
  base: number | null;
  /** De onde veio a base: valor informado, ou medição de qual dia. */
  baseOrigem: { tipo: "informada" } | { tipo: "medicao"; data: ISODate } | null;
  /** A base veio de uma medição posterior à placa: o ganho real é maior ou igual ao mostrado. */
  baseDepoisDaPlaca: boolean;
  atual: Medicao | null;
  ganho: number | null;
  diasDesde: number | null;
  /** Avaliações por semana desde a placa (só com ≥ 7 dias de placa). */
  ritmoDepois: number | null;
  /** Avaliações por semana antes da placa (só se houver ≥ 7 dias medidos antes). */
  ritmoAntes: number | null;
  notaNaInstalacao: number | null;
  notaAtual: number | null;
};

const porData = (a: Medicao, b: Medicao) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0);

export function calcularCrescimento(medicoesBrutas: Medicao[], instalacao: ISODate | null, baseInformada: number | null, hoje: ISODate): Crescimento {
  const medicoes = [...medicoesBrutas].sort(porData);
  const atual = medicoes.at(-1) ?? null;

  let base: number | null = null;
  let baseOrigem: Crescimento["baseOrigem"] = null;
  let notaNaInstalacao: number | null = null;

  if (instalacao) {
    const ateInstalacao = medicoes.filter((m) => m.data <= instalacao).at(-1);
    if (baseInformada != null) {
      base = baseInformada;
      baseOrigem = { tipo: "informada" };
    } else if (ateInstalacao) {
      base = ateInstalacao.total;
      baseOrigem = { tipo: "medicao", data: ateInstalacao.data };
    } else {
      const primeiraDepois = medicoes.find((m) => m.data > instalacao);
      if (primeiraDepois) {
        base = primeiraDepois.total;
        baseOrigem = { tipo: "medicao", data: primeiraDepois.data };
      }
    }
    notaNaInstalacao = ateInstalacao?.rating ?? null;
  }

  const diasDesde = instalacao ? Math.max(0, diffDays(hoje, instalacao)) : null;
  // "Ganho" só faz sentido com uma medição depois da instalação.
  const temDepois = !!(instalacao && atual && atual.data >= instalacao);
  const ganho = base != null && temDepois ? Math.max(0, atual!.total - base) : null;

  // O ritmo conta a partir de onde a base foi medida (a placa, ou a primeira medição depois dela).
  const inicioRitmo = instalacao && baseOrigem?.tipo === "medicao" && baseOrigem.data > instalacao ? baseOrigem.data : instalacao;
  const ritmoDepois = ganho != null && inicioRitmo && atual && diffDays(atual.data, inicioRitmo) >= 7 ? (ganho / diffDays(atual.data, inicioRitmo)) * 7 : null;

  let ritmoAntes: number | null = null;
  if (instalacao) {
    const antes = medicoes.filter((m) => m.data <= instalacao);
    if (antes.length >= 2) {
      const span = diffDays(antes.at(-1)!.data, antes[0].data);
      if (span >= 7) ritmoAntes = ((antes.at(-1)!.total - antes[0].total) / span) * 7;
    }
  }

  return {
    medicoes,
    instalacao,
    base,
    baseOrigem,
    baseDepoisDaPlaca: !!(instalacao && baseOrigem?.tipo === "medicao" && baseOrigem.data > instalacao),
    atual,
    ganho,
    diasDesde,
    ritmoDepois,
    ritmoAntes,
    notaNaInstalacao,
    notaAtual: atual?.rating ?? null,
  };
}

/**
 * Soma, dia a dia, as avaliações ganhas desde a placa em todos os clientes.
 * Cada dia usa a última medição conhecida de cada empresa (sem extrapolar
 * para frente da última medição). `medido` marca dias com medição nova.
 */
export function ganhoAgregado(
  empresas: { base: number | null; instalacao: ISODate | null; medicoes: Medicao[] }[],
  hoje: ISODate,
): { data: ISODate; ganho: number; medido: boolean }[] {
  const validas = empresas.filter((e) => e.base != null && e.instalacao && e.medicoes.some((m) => m.data >= e.instalacao!));
  if (!validas.length) return [];
  const inicio = validas.map((e) => e.instalacao!).sort()[0];
  const fim = validas
    .map((e) => [...e.medicoes].sort(porData).at(-1)!.data)
    .sort()
    .at(-1)!;
  const dias = eachDay(inicio, fim < hoje ? fim : hoje);

  return dias.map((d) => {
    let ganho = 0;
    let medido = false;
    for (const e of validas) {
      if (d < e.instalacao!) continue;
      const ate = e.medicoes.filter((m) => m.data <= d).sort(porData);
      const ultima = ate.at(-1);
      if (!ultima || ultima.data < e.instalacao!) continue;
      ganho += Math.max(0, ultima.total - e.base!);
      if (ultima.data === d) medido = true;
    }
    return { data: d, ganho, medido };
  });
}

/** Próxima medição automática (o cron roda todo dia às 9h de Brasília). */
export function proximaMedicao(hoje: ISODate): ISODate {
  return addDays(hoje, 1);
}
