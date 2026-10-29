"use client";

import * as React from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, useSpring } from "motion/react";
// Um arquivo por ícone: o pacote inteiro pesa ~500 kB.
import ArrowDown from "react-iconly/dist/Icons/ArrowDown.mjs";
import ArrowUp from "react-iconly/dist/Icons/ArrowUp.mjs";
import ChevronDown from "react-iconly/dist/Icons/ChevronDown.mjs";
import ChevronLeft from "react-iconly/dist/Icons/ChevronLeft.mjs";
import ChevronRight from "react-iconly/dist/Icons/ChevronRight.mjs";
import CloseSquare from "react-iconly/dist/Icons/CloseSquare.mjs";
import Document from "react-iconly/dist/Icons/Document.mjs";
import MoreCircle from "react-iconly/dist/Icons/MoreCircle.mjs";
import Search from "react-iconly/dist/Icons/Search.mjs";
import TickSquare from "react-iconly/dist/Icons/TickSquare.mjs";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type Breakpoint = "sm" | "md" | "lg" | "xl";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  /** Valor bruto: ordena, busca, totaliza e copia. Padrão: row[key]. */
  accessor?: (row: T) => unknown;
  cell?: (row: T) => React.ReactNode;
  numeric?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  hideBelow?: Breakpoint;
  className?: string;
  headerClassName?: string;
};

export type DataTableHelpers = {
  /** Remove linhas com animação de saída; a persistência fica com quem chama. */
  remove: (ids: Array<string | number>) => void;
  clearSelection: () => void;
};

export type DataTableRowAction<T> = {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
  onSelect: (row: T, helpers: DataTableHelpers) => void;
};

export type DataTableBulkAction<T> = {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onSelect: (rows: T[], helpers: DataTableHelpers) => void | Promise<void>;
};

export type DataTableLabels = {
  search: string;
  noResults: string;
  noResultsHint: string;
  clearFilters: string;
  selected: string;
  copy: string;
  copied: string;
  total: string;
  of: string;
  all: string;
  selectAllOf: (n: number) => string;
  allSelected: (n: number) => string;
  clearSelection: string;
  previousPage: string;
  nextPage: string;
  selectRow: string;
  selectPage: string;
  rowActions: string;
  expandRow: string;
  sortBy: (col: string) => string;
};

const DEFAULT_LABELS: DataTableLabels = {
  search: "Buscar",
  noResults: "Nenhum resultado",
  noResultsHint: "Tente outros termos ou filtros.",
  clearFilters: "Limpar filtros",
  selected: "selecionadas",
  copy: "Copiar",
  copied: "Copiado",
  total: "Total",
  of: "de",
  all: "Todos",
  selectAllOf: (n) => `Selecionar todas as ${n}`,
  allSelected: (n) => `Todas as ${n} linhas estão selecionadas.`,
  clearSelection: "Limpar seleção",
  previousPage: "Página anterior",
  nextPage: "Próxima página",
  selectRow: "Selecionar linha",
  selectPage: "Selecionar todas desta página",
  rowActions: "Ações da linha",
  expandRow: "Ver detalhes",
  sortBy: (c) => `Ordenar por ${c}`,
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId?: (row: T) => string | number;
  variant?: "default" | "minimal";
  /** Rótulo acessível da tabela. */
  caption: string;
  search?: boolean;
  searchPlaceholder?: string;
  quickFilter?: { key: string; options: { value: string; label: string }[] };
  totals?: string[];
  formatTotal?: (key: string, value: number) => string;
  selectable?: boolean;
  pinFirstColumn?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  renderDetail?: (row: T) => React.ReactNode;
  rowActions?: (row: T) => DataTableRowAction<T>[];
  bulkActions?: DataTableBulkAction<T>[];
  onRowClick?: (row: T) => void;
  onRemove?: (ids: Array<string | number>) => void;
  labels?: Partial<DataTableLabels>;
  emptyState?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const HIDE: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const numberPtBR = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const defaultFormatTotal = (_key: string, v: number) => numberPtBR.format(v);

/** Valor legível para copiar (TSV): datas e números em pt-BR. */
function printValue(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  if (typeof v === "number") return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

function compare(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
}

const icon = (C: React.ComponentType<{ set?: "light"; primaryColor?: string; size?: number; stroke?: "regular" | "light" }>, size = 16) => (
  <C set="light" primaryColor="currentColor" size={size} stroke="regular" />
);

/* ------------------------------------------------------------------ */
/* Total com spring escrito direto no DOM                              */
/* ------------------------------------------------------------------ */

function RollingTotal({ value, format }: { value: number; format: (v: number) => string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 170, damping: 26 });
  const f = React.useRef(format);
  f.current = format;
  React.useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  React.useEffect(() => spring.on("change", (v) => ref.current && (ref.current.textContent = f.current(v))), [spring]);
  return <span ref={ref}>{format(value)}</span>;
}

/* ------------------------------------------------------------------ */
/* Checkbox                                                            */
/* ------------------------------------------------------------------ */

function Check({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label: string }) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className="relative -m-2 grid size-8 cursor-pointer place-items-center coarse:size-11" onClick={(e) => e.stopPropagation()}>
      <input
        ref={ref}
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        aria-hidden
        className={cn(
          "grid size-4 place-items-center rounded-[5px] ring-1 ring-border-strong transition-[background-color,box-shadow,transform] duration-150 ease-out-strong peer-active:scale-[0.9] peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
          (checked || indeterminate) && "bg-primary ring-primary",
        )}
      >
        {indeterminate ? (
          <span className="h-[1.5px] w-2 rounded-full bg-primary-foreground" />
        ) : checked ? (
          <svg viewBox="0 0 12 12" className="size-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  data,
  columns,
  getRowId = (r) => (r as { id: string | number }).id,
  variant = "default",
  caption,
  search = true,
  searchPlaceholder,
  quickFilter,
  totals,
  formatTotal = defaultFormatTotal,
  selectable,
  pinFirstColumn,
  stickyHeader,
  maxHeight,
  pageSize = 10,
  initialSort,
  renderDetail,
  rowActions,
  bulkActions,
  onRowClick,
  onRemove,
  labels: labelsProp,
  emptyState,
  toolbarEnd,
  className,
}: DataTableProps<T>) {
  const L = { ...DEFAULT_LABELS, ...labelsProp };
  const reduce = useReducedMotion();
  const uid = React.useId();

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState(initialSort ?? null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string | number>>(new Set());
  const [expanded, setExpanded] = React.useState<string | number | null>(null);
  const [removed, setRemoved] = React.useState<Set<string | number>>(new Set());
  const [removing, setRemoving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [focusIndex, setFocusIndex] = React.useState(0);
  const rowRefs = React.useRef<Array<HTMLTableRowElement | null>>([]);

  const accessor = React.useCallback(
    (col: DataTableColumn<T> | undefined, row: T) => (col?.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col?.key ?? ""]),
    [],
  );
  const colByKey = React.useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  // Linhas removidas reaparecem se o dado de fora mudar (ex.: exclusão falhou e voltou).
  const live = React.useMemo(() => data.filter((r) => !removed.has(getRowId(r))), [data, removed, getRowId]);

  const filtered = React.useMemo(() => {
    let rows = live;
    if (quickFilter && filter) {
      const col = colByKey.get(quickFilter.key);
      rows = rows.filter((r) => String(accessor(col, r) ?? (r as Record<string, unknown>)[quickFilter.key]) === filter);
    }
    const q = normalize(query.trim());
    if (q) {
      const cols = columns.filter((c) => c.searchable !== false && !c.numeric);
      rows = rows.filter((r) => cols.some((c) => normalize(printValue(accessor(c, r))).includes(q)));
    }
    if (sort) {
      const col = colByKey.get(sort.key);
      rows = [...rows].sort((a, b) => compare(accessor(col, a), accessor(col, b)) * (sort.dir === "asc" ? 1 : -1));
    }
    return rows;
  }, [live, quickFilter, filter, query, sort, columns, colByKey, accessor]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  React.useEffect(() => setPage(0), [query, filter]);

  const filterCounts = React.useMemo(() => {
    if (!quickFilter) return null;
    const col = colByKey.get(quickFilter.key);
    const m = new Map<string, number>();
    for (const r of live) {
      const v = String(accessor(col, r) ?? (r as Record<string, unknown>)[quickFilter.key]);
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return m;
  }, [quickFilter, live, colByKey, accessor]);

  const totalValues = React.useMemo(() => {
    if (!totals?.length) return null;
    const out: Record<string, number> = {};
    for (const k of totals) {
      const col = colByKey.get(k);
      out[k] = filtered.reduce((a, r) => a + (Number(accessor(col, r)) || 0), 0);
    }
    return out;
  }, [totals, filtered, colByKey, accessor]);

  /* Seleção */
  const selectedRows = React.useMemo(() => live.filter((r) => selected.has(getRowId(r))), [live, selected, getRowId]);
  const pageIds = pageRows.map(getRowId);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(getRowId(r)));

  const toggle = (id: string | number, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const togglePage = (on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      for (const id of pageIds) {
        if (on) n.add(id);
        else n.delete(id);
      }
      return n;
    });
  const clearSelection = React.useCallback(() => setSelected(new Set()), []);

  const remove = React.useCallback(
    (ids: Array<string | number>) => {
      setRemoving(true);
      setRemoved((r) => new Set([...r, ...ids]));
      setSelected((s) => {
        const n = new Set(s);
        ids.forEach((id) => n.delete(id));
        return n;
      });
      onRemove?.(ids);
      window.setTimeout(() => setRemoving(false), 420);
    },
    [onRemove],
  );
  const helpers: DataTableHelpers = { remove, clearSelection };

  const copySelection = async () => {
    const cols = columns;
    const header = cols.map((c) => c.header).join("\t");
    const lines = selectedRows.map((r) => cols.map((c) => printValue(accessor(c, r))).join("\t"));
    try {
      await navigator.clipboard.writeText([header, ...lines].join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard negado: sem feedback falso */
    }
  };

  /* Teclado: setas movem o foco entre linhas, sem animação. */
  const onRowKeyDown = (e: React.KeyboardEvent, index: number, row: T) => {
    if (e.target !== e.currentTarget) return;
    const id = getRowId(row);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(0, Math.min(pageRows.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)));
      setFocusIndex(next);
      rowRefs.current[next]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (renderDetail) setExpanded((x) => (x === id ? null : id));
      else onRowClick?.(row);
    } else if (e.key === " " && selectable) {
      e.preventDefault();
      toggle(id, !selected.has(id));
    }
  };

  const onRowActivate = (row: T) => {
    const id = getRowId(row);
    if (renderDetail) setExpanded((x) => (x === id ? null : id));
    else onRowClick?.(row);
  };

  const minimal = variant === "minimal";
  const hasFilters = !!query || !!filter;
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0) + (renderDetail ? 1 : 0);
  const firstDataCol = columns[0]?.key;
  const pinLeft = selectable ? "left-11" : "left-0";

  const headCell = "h-10 px-3 text-left align-middle text-12 font-medium text-muted-foreground whitespace-nowrap";
  const bodyCell = cn("px-3 align-middle", minimal ? "h-12" : "h-14");

  return (
    <div className={cn(!minimal && "surface overflow-hidden", className)}>
      {/* Toolbar */}
      {(search || quickFilter || toolbarEnd) && (
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", minimal ? "pb-3" : "border-b border-border p-3")}>
          {quickFilter && filterCounts && (
            <LayoutGroup id={`${uid}-qf`}>
              <div
                role="radiogroup"
                aria-label="Filtro rápido"
                className="no-scrollbar -mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1 sm:max-w-full sm:shrink-0"
              >
                {[{ value: null as string | null, label: L.all }, ...quickFilter.options].map((o) => {
                  const active = filter === o.value;
                  const count = o.value == null ? live.length : (filterCounts.get(o.value) ?? 0);
                  return (
                    <button
                      key={o.label}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFilter(o.value)}
                      className={cn(
                        "relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-13 font-medium outline-hidden transition-[color,transform] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-11",
                        active ? "text-foreground" : "text-muted-foreground hover-fine:text-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="qf-pill"
                          className="absolute inset-0 rounded-full bg-muted ring-1 ring-border"
                          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative">{o.label}</span>
                      <span className="relative font-mono text-11 tabular text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            {search && (
              <label className="relative flex min-w-0 flex-1 items-center sm:w-64 sm:flex-none">
                <span className="pointer-events-none absolute left-3 text-muted-foreground">{icon(Search, 16)}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder ?? L.search}
                  aria-label={searchPlaceholder ?? L.search}
                  className="h-9 w-full rounded-control bg-background pl-9 pr-3 text-13 text-foreground ring-1 ring-border outline-hidden placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring coarse:h-11 [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            )}
            {toolbarEnd}
          </div>
        </div>
      )}

      {/* Barra de seleção */}
      <AnimatePresence initial={false}>
        {selectable && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, transform: reduce ? "none" : "translateY(-4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={cn("flex flex-wrap items-center gap-2 bg-accent px-3 py-2 text-13", minimal ? "mb-2 rounded-control" : "border-b border-border")}
            role="region"
            aria-label="Ações em lote"
          >
            <span className="font-medium text-accent-foreground">
              <span className="font-mono tabular">{selected.size}</span> {L.selected}
            </span>
            {pageAllSelected && !allFilteredSelected && filtered.length > pageRows.length && (
              <button
                className="text-accent-foreground underline decoration-accent-foreground/40 underline-offset-4 hover-fine:decoration-accent-foreground"
                onClick={() => setSelected(new Set(filtered.map(getRowId)))}
              >
                {L.selectAllOf(filtered.length)}
              </button>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <BarButton onClick={copySelection}>
                {copied ? icon(TickSquare) : icon(Document)}
                <span aria-live="polite">{copied ? L.copied : L.copy}</span>
              </BarButton>
              {bulkActions?.map((a) => (
                <BarButton key={a.label} destructive={a.destructive} onClick={() => a.onSelect(selectedRows, helpers)}>
                  {a.icon}
                  {a.label}
                </BarButton>
              ))}
              <BarButton onClick={clearSelection} aria-label={L.clearSelection}>
                {icon(CloseSquare)}
              </BarButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela */}
      <div className={cn("relative overflow-auto overscroll-x-contain", stickyHeader && "overscroll-y-contain")} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full border-separate border-spacing-0 text-14" aria-label={caption}>
          <thead className={cn(stickyHeader && "sticky top-0 z-2")}>
            <tr className={cn(minimal ? "bg-background" : "bg-card")}>
              {selectable && (
                <th
                  scope="col"
                  className={cn(
                    headCell,
                    "w-11 border-b border-border pl-4 pr-0",
                    pinFirstColumn && "sticky left-0 z-1",
                    minimal ? "bg-background" : "bg-card",
                  )}
                >
                  <Check checked={pageAllSelected} indeterminate={!pageAllSelected && pageSomeSelected} onChange={togglePage} label={L.selectPage} />
                </th>
              )}
              {columns.map((c) => {
                const sortable = c.sortable !== false;
                const active = sort?.key === c.key;
                const pinned = pinFirstColumn && c.key === firstDataCol;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      headCell,
                      "border-b border-border",
                      c.numeric && "text-right",
                      c.hideBelow && HIDE[c.hideBelow],
                      pinned && cn("sticky z-1", pinLeft, minimal ? "bg-background" : "bg-card"),
                      !selectable && c.key === firstDataCol && "pl-4",
                      c.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((s) =>
                            s?.key !== c.key
                              ? { key: c.key, dir: c.numeric ? "desc" : "asc" }
                              : s.dir === (c.numeric ? "desc" : "asc")
                                ? { key: c.key, dir: c.numeric ? "asc" : "desc" }
                                : null,
                          )
                        }
                        aria-label={L.sortBy(c.header)}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 outline-hidden transition-colors duration-150 hover-fine:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                          c.numeric && "flex-row-reverse",
                          active && "text-foreground",
                        )}
                      >
                        {c.header}
                        <span className={cn("transition-opacity duration-150", active ? "opacity-100" : "opacity-0")} aria-hidden>
                          {sort?.dir === "asc" && active ? icon(ArrowUp, 12) : icon(ArrowDown, 12)}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {renderDetail && (
                <th scope="col" className={cn(headCell, "w-10 border-b border-border")}>
                  <span className="sr-only">{L.expandRow}</span>
                </th>
              )}
              {rowActions && (
                <th scope="col" className={cn(headCell, "w-12 border-b border-border pr-4")}>
                  <span className="sr-only">{L.rowActions}</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false} mode="popLayout">
              {pageRows.flatMap((row, i) => {
                const id = getRowId(row);
                const isSel = selected.has(id);
                const isOpen = expanded === id;
                const actions = rowActions?.(row);
                const interactive = !!renderDetail || !!onRowClick;
                const pinBg = isSel ? "bg-row-selected" : minimal ? "bg-background" : "bg-card";
                const main = (
                  <motion.tr
                    key={id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    layout={removing && !reduce ? "position" : false}
                    exit={{ opacity: 0, transition: { duration: 0.16, ease: "easeOut" } }}
                    transition={{ type: "spring", stiffness: 380, damping: 36 }}
                    tabIndex={i === Math.min(focusIndex, pageRows.length - 1) ? 0 : -1}
                    onFocus={() => setFocusIndex(i)}
                    onKeyDown={(e) => onRowKeyDown(e, i, row)}
                    onClick={interactive ? () => onRowActivate(row) : undefined}
                    aria-selected={selectable ? isSel : undefined}
                    className={cn(
                      "group outline-hidden focus-visible:bg-row-hover [&>td]:border-b [&>td]:border-border [&>td]:transition-colors [&>td]:duration-100",
                      interactive && "cursor-pointer",
                      isSel ? "[&>td]:bg-row-selected" : "hover-fine:[&>td]:bg-row-hover",
                      isOpen && "[&>td]:border-transparent",
                      "focus-visible:[&>td:first-child]:shadow-[inset_2px_0_0_var(--ring)]",
                    )}
                  >
                    {selectable && (
                      <td className={cn(bodyCell, "w-11 pl-4 pr-0", pinFirstColumn && cn("sticky left-0 z-1", pinBg))}>
                        <Check checked={isSel} onChange={(v) => toggle(id, v)} label={L.selectRow} />
                      </td>
                    )}
                    {columns.map((c) => {
                      const pinned = pinFirstColumn && c.key === firstDataCol;
                      return (
                        <td
                          key={c.key}
                          className={cn(
                            bodyCell,
                            c.numeric && "text-right font-mono text-13 tabular whitespace-nowrap",
                            c.hideBelow && HIDE[c.hideBelow],
                            pinned && cn("sticky z-1", pinLeft, pinBg),
                            !selectable && c.key === firstDataCol && "pl-4",
                            c.className,
                          )}
                        >
                          {c.cell ? c.cell(row) : printValue(accessor(c, row))}
                        </td>
                      );
                    })}
                    {renderDetail && (
                      <td className={cn(bodyCell, "w-10 px-0 text-muted-foreground")}>
                        {/* Fora da ordem de Tab: a linha já abre com Enter. O botão existe para leitores de tela. */}
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-expanded={isOpen}
                          aria-label={L.expandRow}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowActivate(row);
                          }}
                          className="grid size-8 place-items-center rounded-[8px] outline-hidden hover-fine:text-foreground"
                        >
                          <span
                            className={cn(
                              "grid place-items-center transition-transform duration-200 ease-out-strong motion-reduce:transition-none",
                              isOpen && "rotate-180",
                            )}
                          >
                            {icon(ChevronDown, 16)}
                          </span>
                        </button>
                      </td>
                    )}
                    {actions && (
                      <td className={cn(bodyCell, "w-12 pr-4 text-right")} onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={L.rowActions}
                            className="inline-grid size-8 place-items-center rounded-[8px] text-muted-foreground outline-hidden transition-[transform,background-color,color] duration-150 hover-fine:bg-muted hover-fine:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground coarse:size-11"
                          >
                            {icon(MoreCircle, 18)}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {actions.map((a) => (
                              <React.Fragment key={a.label}>
                                {a.separatorBefore && <DropdownMenuSeparator />}
                                <DropdownMenuItem destructive={a.destructive} onSelect={() => a.onSelect(row, helpers)}>
                                  {a.icon}
                                  {a.label}
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </motion.tr>
                );
                if (!(renderDetail && isOpen)) return [main];
                return [
                  main,
                  <motion.tr key={`${id}-detail`} exit={{ opacity: 0, transition: { duration: 0.12 } }} className="[&>td]:border-b [&>td]:border-border">
                    <td colSpan={colSpan} className="bg-muted/40 p-0">
                      <motion.div
                        initial={{ opacity: 0, transform: reduce ? "none" : "translateY(-4px)" }}
                        animate={{ opacity: 1, transform: "translateY(0px)" }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="px-4 py-5 sm:px-6"
                      >
                        {renderDetail(row)}
                      </motion.div>
                    </td>
                  </motion.tr>,
                ];
              })}
            </AnimatePresence>
          </tbody>

          {totalValues && filtered.length > 0 && (
            <tfoot>
              <tr className={cn(minimal ? "bg-background" : "bg-card")}>
                {selectable && <td className={cn("h-12", pinFirstColumn && cn("sticky left-0 z-1", minimal ? "bg-background" : "bg-card"))} />}
                {columns.map((c, idx) => {
                  const pinned = pinFirstColumn && c.key === firstDataCol;
                  const isTotal = totalValues[c.key] != null;
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "h-12 px-3 text-13",
                        c.hideBelow && HIDE[c.hideBelow],
                        pinned && cn("sticky z-1", pinLeft, minimal ? "bg-background" : "bg-card"),
                        !selectable && idx === 0 && "pl-4",
                        isTotal && "text-right font-mono font-medium tabular text-foreground",
                      )}
                    >
                      {idx === 0 ? (
                        <span className="eyebrow text-muted-foreground">
                          {L.total} <span className="font-mono normal-case tracking-normal">· {filtered.length}</span>
                        </span>
                      ) : isTotal ? (
                        <RollingTotal value={totalValues[c.key]} format={(v) => formatTotal(c.key, v)} />
                      ) : null}
                    </td>
                  );
                })}
                {renderDetail && <td />}
                {rowActions && <td />}
              </tr>
            </tfoot>
          )}
        </table>

        {filtered.length === 0 && (
          <div className="grid place-items-center px-6 py-14 text-center">
            {data.length === 0 && emptyState ? (
              emptyState
            ) : (
              <div className="grid max-w-xs justify-items-center gap-1">
                <span className="mb-2 text-muted-foreground">{icon(Search, 22)}</span>
                <p className="text-14 font-medium text-foreground">{L.noResults}</p>
                <p className="text-13 text-muted-foreground">{L.noResultsHint}</p>
                {hasFilters && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter(null);
                    }}
                    className="mt-3 h-8 rounded-control px-3 text-13 font-medium text-primary ring-1 ring-border transition-[transform,background-color] duration-150 hover-fine:bg-muted active:scale-[0.96]"
                  >
                    {L.clearFilters}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paginação */}
      {filtered.length > pageSize && (
        <div className={cn("flex items-center justify-between gap-3 text-13 text-muted-foreground", minimal ? "pt-3" : "border-t border-border px-4 py-2.5")}>
          <span className="font-mono text-12 tabular">
            {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} {L.of} {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <PagerButton onClick={() => setPage(safePage - 1)} disabled={safePage === 0} label={L.previousPage}>
              {icon(ChevronLeft)}
            </PagerButton>
            <span className="min-w-12 text-center font-mono text-12 tabular">
              {safePage + 1}/{pageCount}
            </span>
            <PagerButton onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount - 1} label={L.nextPage}>
              {icon(ChevronRight)}
            </PagerButton>
          </div>
        </div>
      )}
    </div>
  );
}

function BarButton({ destructive, className, ...props }: React.ComponentProps<"button"> & { destructive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-13 font-medium outline-hidden transition-[transform,background-color] duration-150 ease-out-strong active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring coarse:h-11",
        destructive ? "text-destructive hover-fine:bg-cost-soft" : "text-accent-foreground hover-fine:bg-card/70",
        className,
      )}
      {...props}
    />
  );
}

function PagerButton({ label, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-8 place-items-center rounded-[8px] text-subtle-foreground outline-hidden transition-[transform,background-color] duration-150 ease-out-strong hover-fine:bg-muted active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring coarse:size-11"
      {...props}
    />
  );
}
