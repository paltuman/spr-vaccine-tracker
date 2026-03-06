import { useState, useMemo } from "react";
import { buildInitialData, getDistrictStats, type ServiceRecord } from "@/data/sprData";
import { Search, Syringe, BarChart3, CheckCircle2, XCircle } from "lucide-react";

const StatusBadge = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: () => void;
}) => (
  <button
    onClick={onChange}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
      value
        ? "bg-success text-success-foreground shadow-md shadow-success/30 hover:shadow-lg hover:shadow-success/40"
        : "bg-danger text-danger-foreground shadow-md shadow-danger/30 hover:shadow-lg hover:shadow-danger/40"
    }`}
  >
    {value ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
    {value ? "SÍ" : "NO"}
  </button>
);

const PercentageBar = ({ value }: { value: number }) => {
  const color =
    value >= 80
      ? "bg-success"
      : value >= 50
      ? "bg-warning"
      : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={`text-xs font-bold min-w-[42px] text-right ${
          value >= 80
            ? "text-success"
            : value >= 50
            ? "text-warning"
            : "text-danger"
        }`}
      >
        {value.toFixed(1)}%
      </span>
    </div>
  );
};

export default function SPRTable() {
  const [records, setRecords] = useState<ServiceRecord[]>(buildInitialData);
  const [search, setSearch] = useState("");

  const toggle = (index: number, field: "disponibilidad" | "despachado") => {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  const stats = useMemo(() => getDistrictStats(records), [records]);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.distrito.toLowerCase().includes(q) ||
        r.servicio.toLowerCase().includes(q)
    );
  }, [records, search]);

  const globalStats = useMemo(() => {
    const total = records.length;
    const conDisp = records.filter((r) => r.disponibilidad).length;
    const desp = records.filter((r) => r.despachado).length;
    return { total, conDisp, desp };
  }, [records]);

  // Group filtered records by district
  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ record: ServiceRecord; originalIndex: number }>>();
    filtered.forEach((r) => {
      const origIdx = records.indexOf(r);
      const arr = map.get(r.distrito) ?? [];
      arr.push({ record: r, originalIndex: origIdx });
      map.set(r.distrito, arr);
    });
    return map;
  }, [filtered, records]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary">
            <Syringe className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Control de Vacuna SPR
            </h1>
            <p className="text-sm text-muted-foreground">
              Departamento de San Pedro — Monitoreo de disponibilidad por distrito
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <BarChart3 className="text-primary" size={20} />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Servicios</p>
              <p className="text-xl font-bold text-foreground">{globalStats.total}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="text-success" size={20} />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Con Disponibilidad</p>
              <p className="text-xl font-bold text-success">
                {globalStats.conDisp}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({((globalStats.conDisp / globalStats.total) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Syringe className="text-primary" size={20} />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Despachados</p>
              <p className="text-xl font-bold text-foreground">
                {globalStats.desp}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({((globalStats.desp / globalStats.total) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar distrito o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="text-left px-4 py-3 font-semibold">Distrito</th>
              <th className="text-left px-4 py-3 font-semibold">Servicio</th>
              <th className="text-center px-4 py-3 font-semibold">Disponibilidad SPR</th>
              <th className="text-center px-4 py-3 font-semibold">Despachado</th>
              <th className="text-left px-4 py-3 font-semibold min-w-[180px]">% Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([distrito, items]) => {
              const stat = stats.get(distrito);
              const pct = stat ? (stat.conDisp / stat.total) * 100 : 0;
              return items.map((item, idx) => (
                <tr
                  key={item.originalIndex}
                  className={`border-t border-border transition-colors hover:bg-accent/50 ${
                    idx % 2 === 0 ? "bg-card" : "bg-table-stripe"
                  }`}
                >
                  {idx === 0 ? (
                    <td
                      className="px-4 py-2.5 font-bold text-foreground bg-district-bg align-top"
                      rowSpan={items.length}
                    >
                      {distrito}
                    </td>
                  ) : null}
                  <td className="px-4 py-2.5 text-foreground">{item.record.servicio}</td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusBadge
                      value={item.record.disponibilidad}
                      onChange={() => toggle(item.originalIndex, "disponibilidad")}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusBadge
                      value={item.record.despachado}
                      onChange={() => toggle(item.originalIndex, "despachado")}
                    />
                  </td>
                  {idx === 0 ? (
                    <td className="px-4 py-2.5 bg-district-bg align-middle" rowSpan={items.length}>
                      <PercentageBar value={pct} />
                    </td>
                  ) : null}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <p className="max-w-7xl mx-auto mt-3 text-xs text-muted-foreground text-center">
        Haga clic en los indicadores SÍ/NO para actualizar el estado de cada servicio.
      </p>
    </div>
  );
}
