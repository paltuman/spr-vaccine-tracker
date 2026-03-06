import { useState, useMemo, useCallback } from "react";
import { buildInitialData, getDistrictStats, type ServiceRecord, type Zona } from "@/data/sprData";
import {
  Search, Syringe, BarChart3, CheckCircle2, XCircle,
  Download, Filter, MapPin, TrendingUp, Activity
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── Status Badge ─────────────────────────────── */
const StatusBadge = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
      value
        ? "bg-success text-success-foreground shadow-md shadow-success/30 hover:shadow-lg"
        : "bg-danger text-danger-foreground shadow-md shadow-danger/30 hover:shadow-lg"
    }`}
  >
    {value ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
    {value ? "SÍ" : "NO"}
  </button>
);

/* ── Percentage Bar ───────────────────────────── */
const PercentageBar = ({ value }: { value: number }) => {
  const color = value >= 80 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-danger";
  const textColor = value >= 80 ? "text-success" : value >= 50 ? "text-warning" : "text-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-bold min-w-[42px] text-right ${textColor}`}>{value.toFixed(1)}%</span>
    </div>
  );
};

/* ── Stat Card ────────────────────────────────── */
const StatCard = ({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
    <div className={`p-2 rounded-lg ${accent ?? "bg-primary/10"}`}>
      <Icon className={accent ? "text-card-foreground" : "text-primary"} size={18} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold text-foreground">
        {value} {sub && <span className="text-sm font-normal text-muted-foreground">{sub}</span>}
      </p>
    </div>
  </div>
);

const CHART_COLORS = ["hsl(142,71%,45%)", "hsl(0,84%,60%)"];
const ZONE_COLORS: Record<Zona, string> = {
  "SAN PEDRO NORTE": "hsl(210,80%,55%)",
  "SAN PEDRO SUR": "hsl(38,92%,50%)",
};

type FilterZona = "TODAS" | Zona;
type FilterDisp = "TODOS" | "CON_DISP" | "SIN_DISP";

export default function SPRTable() {
  const [records, setRecords] = useState<ServiceRecord[]>(buildInitialData);
  const [search, setSearch] = useState("");
  const [filterZona, setFilterZona] = useState<FilterZona>("TODAS");
  const [filterDisp, setFilterDisp] = useState<FilterDisp>("TODOS");

  const toggle = useCallback((index: number, field: "disponibilidad" | "despachado") => {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  }, []);

  const stats = useMemo(() => getDistrictStats(records), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterZona !== "TODAS" && r.zona !== filterZona) return false;
      if (filterDisp === "CON_DISP" && !r.disponibilidad) return false;
      if (filterDisp === "SIN_DISP" && r.disponibilidad) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.distrito.toLowerCase().includes(q) && !r.servicio.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, search, filterZona, filterDisp]);

  const globalStats = useMemo(() => {
    const src = filterZona === "TODAS" ? records : records.filter((r) => r.zona === filterZona);
    const total = src.length;
    const conDisp = src.filter((r) => r.disponibilidad).length;
    const desp = src.filter((r) => r.despachado).length;
    return { total, conDisp, desp, sinDisp: total - conDisp };
  }, [records, filterZona]);

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

  /* ── Chart data ── */
  const pieData = useMemo(() => [
    { name: "Con disponibilidad", value: globalStats.conDisp },
    { name: "Sin disponibilidad", value: globalStats.sinDisp },
  ], [globalStats]);

  const barData = useMemo(() => {
    const arr: Array<{ distrito: string; pct: number; zona: Zona }> = [];
    stats.forEach((v, k) => {
      if (filterZona !== "TODAS" && v.zona !== filterZona) return;
      arr.push({ distrito: k.length > 15 ? k.slice(0, 14) + "…" : k, pct: v.total > 0 ? (v.conDisp / v.total) * 100 : 0, zona: v.zona });
    });
    return arr;
  }, [stats, filterZona]);

  /* ── Export ── */
  const exportExcel = () => {
    const data = records.map((r) => ({
      Zona: r.zona,
      Distrito: r.distrito,
      Servicio: r.servicio,
      "Disponibilidad SPR": r.disponibilidad ? "SÍ" : "NO",
      Despachado: r.despachado ? "SÍ" : "NO",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Control SPR");
    XLSX.writeFile(wb, "Control_SPR_San_Pedro.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Control de Vacuna SPR — San Pedro", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-PY")}`, 14, 22);

    const rows = records.map((r) => [
      r.zona, r.distrito, r.servicio,
      r.disponibilidad ? "SÍ" : "NO",
      r.despachado ? "SÍ" : "NO",
    ]);

    autoTable(doc, {
      head: [["Zona", "Distrito", "Servicio", "Disponibilidad SPR", "Despachado"]],
      body: rows,
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 41, 59] },
      didParseCell: (data) => {
        if (data.section === "body") {
          const val = data.cell.raw as string;
          if (val === "SÍ") {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "NO") {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
    doc.save("Control_SPR_San_Pedro.pdf");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary">
              <Syringe className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Control de Vacuna SPR
              </h1>
              <p className="text-sm text-muted-foreground">
                Departamento de San Pedro — Monitoreo de disponibilidad
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download size={16} /> Excel
            </button>
            <button onClick={exportPDF} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-danger-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Stats cards */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Total Servicios" value={globalStats.total} />
            <StatCard icon={CheckCircle2} label="Con Disponibilidad" value={globalStats.conDisp} sub={`(${((globalStats.conDisp / globalStats.total) * 100).toFixed(1)}%)`} accent="bg-success" />
            <StatCard icon={Syringe} label="Despachados" value={globalStats.desp} sub={`(${((globalStats.desp / globalStats.total) * 100).toFixed(1)}%)`} />
            <StatCard icon={Activity} label="Sin Disponibilidad" value={globalStats.sinDisp} sub={`(${((globalStats.sinDisp / globalStats.total) * 100).toFixed(1)}%)`} accent="bg-danger" />
          </div>

          {/* Pie chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Disponibilidad General
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Con disp.</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> Sin disp.</span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> % Disponibilidad por Distrito
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="distrito" width={100} tick={{ fontSize: 8 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={ZONE_COLORS[entry.zona]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ZONE_COLORS["SAN PEDRO NORTE"] }} /> Norte</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ZONE_COLORS["SAN PEDRO SUR"] }} /> Sur</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Buscar distrito o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value as FilterZona)}
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="TODAS">Todas las zonas</option>
              <option value="SAN PEDRO NORTE">San Pedro Norte</option>
              <option value="SAN PEDRO SUR">San Pedro Sur</option>
            </select>
            <select
              value={filterDisp}
              onChange={(e) => setFilterDisp(e.target.value as FilterDisp)}
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="CON_DISP">Con disponibilidad</option>
              <option value="SIN_DISP">Sin disponibilidad</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="text-left px-4 py-3 font-semibold">Zona</th>
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
                    className={`border-t border-border transition-colors hover:bg-accent/50 ${idx % 2 === 0 ? "bg-card" : "bg-table-stripe"}`}
                  >
                    {idx === 0 && (
                      <td className="px-4 py-2.5 font-medium text-xs text-muted-foreground bg-district-bg align-top" rowSpan={items.length}>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[item.record.zona] }} />
                          {item.record.zona === "SAN PEDRO NORTE" ? "Norte" : "Sur"}
                        </span>
                      </td>
                    )}
                    {idx === 0 && (
                      <td className="px-4 py-2.5 font-bold text-foreground bg-district-bg align-top" rowSpan={items.length}>
                        {distrito}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-foreground">{item.record.servicio}</td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge value={item.record.disponibilidad} onChange={() => toggle(item.originalIndex, "disponibilidad")} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge value={item.record.despachado} onChange={() => toggle(item.originalIndex, "despachado")} />
                    </td>
                    {idx === 0 && (
                      <td className="px-4 py-2.5 bg-district-bg align-middle" rowSpan={items.length}>
                        <PercentageBar value={pct} />
                      </td>
                    )}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          Haga clic en los indicadores SÍ/NO para actualizar el estado. Los cambios se reflejan en el dashboard automáticamente.
        </p>
      </div>
    </div>
  );
}
