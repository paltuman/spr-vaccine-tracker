import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { buildInitialData, getDistrictStats, type ServiceRecord, type Zona } from "@/data/sprData";
import {
  Search, Syringe, BarChart3, CheckCircle2, XCircle,
  Download, Filter, MapPin, TrendingUp, Activity, Loader2, RefreshCw,
  LogOut, MessageSquare, Package
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import headerBanner from "@/assets/header-banner.png";

/* ── Status Badge ── */
const StatusBadge = ({ value, onChange, disabled, loading }: { value: boolean; onChange: () => void; disabled?: boolean; loading?: boolean }) => (
  <button
    onClick={onChange}
    disabled={disabled || loading}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
      value
        ? "bg-success text-success-foreground shadow-md shadow-success/30 hover:shadow-lg"
        : "bg-danger text-danger-foreground shadow-md shadow-danger/30 hover:shadow-lg"
    }`}
  >
    {value ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
    {value ? "SÍ" : "NO"}
  </button>
);

/* ── Percentage Bar ── */
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

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string }) => (
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

/* ── Observaciones Popover ── */
const ObservacionesCell = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setText(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (text !== value) onChange(text);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, text, value, onChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-50 ${
          value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        } hover:bg-primary/20`}
      >
        <MessageSquare size={12} />
        {value ? (value.length > 15 ? value.slice(0, 14) + "…" : value) : "Agregar"}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-lg p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribir observación..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setText(value); setOpen(false); }} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
            <button
              onClick={() => { onChange(text); setOpen(false); }}
              className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground font-medium"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CHART_COLORS = ["hsl(142,71%,45%)", "hsl(0,84%,60%)"];
const ZONE_COLORS: Record<Zona, string> = {
  "SAN PEDRO NORTE": "hsl(210,80%,55%)",
  "SAN PEDRO SUR": "hsl(38,92%,50%)",
};

type FilterZona = "TODAS" | Zona;
type FilterDisp = "TODOS" | "CON_DISP" | "SIN_DISP";
type FilterLote = "TODOS" | string;

interface DbRecord extends ServiceRecord {
  recepcionado: boolean;
  observaciones: string;
  lote: string;
}

export default function SPRTable() {
  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;

  const [records, setRecords] = useState<DbRecord[]>([]);
  const [dbIds, setDbIds] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterZona, setFilterZona] = useState<FilterZona>("TODAS");
  const [filterDisp, setFilterDisp] = useState<FilterDisp>("TODOS");
  const [filterLote, setFilterLote] = useState<FilterLote>("TODOS");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("spr_servicios")
      .select("*")
      .order("zona")
      .order("distrito")
      .order("servicio");

    if (error || !data || data.length === 0) {
      const fallback = buildInitialData().map((r) => ({ ...r, recepcionado: false, observaciones: "" }));
      setRecords(fallback);
      setLoading(false);
      return;
    }

    const ids = new Map<string, string>();
    const recs: DbRecord[] = data.map((row) => {
      ids.set(`${row.distrito}|${row.servicio}`, row.id);
      return {
        distrito: row.distrito,
        servicio: row.servicio,
        zona: row.zona as Zona,
        disponibilidad: row.disponibilidad,
        despachado: row.despachado,
        recepcionado: row.recepcionado,
        observaciones: row.observaciones ?? "",
      };
    });
    setDbIds(ids);
    setRecords(recs);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateField = useCallback(async (index: number, field: string, value: boolean | string) => {
    const record = records[index];
    const key = `${record.distrito}|${record.servicio}`;
    const dbId = dbIds.get(key);

    setRecords((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    if (dbId) {
      setSaving(key);
      const { error } = await supabase
        .from("spr_servicios")
        .update({ [field]: value })
        .eq("id", dbId);

      if (error) {
        setRecords((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], [field]: field === "observaciones" ? record.observaciones : !value };
          return next;
        });
        toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      }
      setSaving(null);
    }
  }, [records, dbIds, toast]);

  const toggleField = useCallback((index: number, field: "disponibilidad" | "despachado" | "recepcionado") => {
    updateField(index, field, !records[index][field]);
  }, [records, updateField]);

  const updateObservaciones = useCallback((index: number, text: string) => {
    updateField(index, "observaciones", text);
  }, [updateField]);

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
    const recep = src.filter((r) => r.recepcionado).length;
    return { total, conDisp, desp, sinDisp: total - conDisp, recep };
  }, [records, filterZona]);

  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ record: DbRecord; originalIndex: number }>>();
    filtered.forEach((r) => {
      const origIdx = records.indexOf(r);
      const arr = map.get(r.distrito) ?? [];
      arr.push({ record: r, originalIndex: origIdx });
      map.set(r.distrito, arr);
    });
    return map;
  }, [filtered, records]);

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

  const pct = (n: number) => globalStats.total > 0 ? ((n / globalStats.total) * 100).toFixed(1) : "0";

  const exportExcel = () => {
    const data = records.map((r) => ({
      Zona: r.zona, Distrito: r.distrito, Servicio: r.servicio,
      "Disponibilidad SPR": r.disponibilidad ? "SÍ" : "NO",
      Despachado: r.despachado ? "SÍ" : "NO",
      Recepcionado: r.recepcionado ? "SÍ" : "NO",
      Observaciones: r.observaciones,
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
    const rows = records.map((r) => [r.zona, r.distrito, r.servicio, r.disponibilidad ? "SÍ" : "NO", r.despachado ? "SÍ" : "NO", r.recepcionado ? "SÍ" : "NO", r.observaciones]);
    autoTable(doc, {
      head: [["Zona", "Distrito", "Servicio", "Disp. SPR", "Despachado", "Recepcionado", "Observaciones"]],
      body: rows, startY: 28, styles: { fontSize: 6 }, headStyles: { fillColor: [30, 41, 59] },
      didParseCell: (data) => {
        if (data.section === "body") {
          const val = data.cell.raw as string;
          if (val === "SÍ") { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = "bold"; }
          else if (val === "NO") { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
        }
      },
    });
    doc.save("Control_SPR_San_Pedro.pdf");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Banner */}
        <div className="mb-4">
          <img src={headerBanner} alt="Gobierno del Paraguay - Ministerio de Salud Pública" className="w-full max-h-16 object-contain" />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Logo PAI" className="w-12 h-12 rounded-full object-cover shadow-md" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Control de Vacuna SPR</h1>
              <p className="text-sm text-muted-foreground">San Pedro — {isAuthenticated ? `Sesión: ${user?.email}` : "Solo lectura"}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAuthenticated && (
              <button onClick={signOut} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors">
                <LogOut size={16} /> Salir
              </button>
            )}
            <button onClick={loadData} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors">
              <RefreshCw size={16} /> Actualizar
            </button>
            <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download size={16} /> Excel
            </button>
            <button onClick={exportPDF} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-danger text-danger-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 mb-4 text-sm text-foreground">
            ⚠️ Estás en modo lectura. <strong>Iniciá sesión</strong> para modificar los datos.
          </div>
        )}

        {/* Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-1 grid grid-cols-2 gap-3">
            <StatCard icon={BarChart3} label="Total Servicios" value={globalStats.total} />
            <StatCard icon={CheckCircle2} label="Con Disponibilidad" value={globalStats.conDisp} sub={`(${pct(globalStats.conDisp)}%)`} accent="bg-success" />
            <StatCard icon={Syringe} label="Despachados" value={globalStats.desp} sub={`(${pct(globalStats.desp)}%)`} />
            <StatCard icon={Package} label="Recepcionados" value={globalStats.recep} sub={`(${pct(globalStats.recep)}%)`} accent="bg-primary" />
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> Disponibilidad General
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Con disp.</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger" /> Sin disp.</span>
            </div>
          </div>
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
                  {barData.map((entry, i) => <Cell key={i} fill={ZONE_COLORS[entry.zona]} />)}
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
            <input type="text" placeholder="Buscar distrito o servicio..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <select value={filterZona} onChange={(e) => setFilterZona(e.target.value as FilterZona)}
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="TODAS">Todas las zonas</option>
              <option value="SAN PEDRO NORTE">San Pedro Norte</option>
              <option value="SAN PEDRO SUR">San Pedro Sur</option>
            </select>
            <select value={filterDisp} onChange={(e) => setFilterDisp(e.target.value as FilterDisp)}
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
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
                <th className="text-left px-3 py-3 font-semibold">Zona</th>
                <th className="text-left px-3 py-3 font-semibold">Distrito</th>
                <th className="text-left px-3 py-3 font-semibold">Servicio</th>
                <th className="text-center px-3 py-3 font-semibold">Disp. SPR</th>
                <th className="text-center px-3 py-3 font-semibold">Despachado</th>
                <th className="text-center px-3 py-3 font-semibold">Recepcionado</th>
                <th className="text-left px-3 py-3 font-semibold">Observaciones</th>
                <th className="text-left px-3 py-3 font-semibold min-w-[150px]">% Disp.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([distrito, items]) => {
                const stat = stats.get(distrito);
                const distPct = stat ? (stat.conDisp / stat.total) * 100 : 0;
                return items.map((item, idx) => {
                  const key = `${item.record.distrito}|${item.record.servicio}`;
                  const isSaving = saving === key;
                  return (
                    <tr key={item.originalIndex} className={`border-t border-border transition-colors hover:bg-accent/50 ${idx % 2 === 0 ? "bg-card" : "bg-table-stripe"}`}>
                      {idx === 0 && (
                        <td className="px-3 py-2.5 font-medium text-xs text-muted-foreground bg-district-bg align-top" rowSpan={items.length}>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[item.record.zona] }} />
                            {item.record.zona === "SAN PEDRO NORTE" ? "Norte" : "Sur"}
                          </span>
                        </td>
                      )}
                      {idx === 0 && <td className="px-3 py-2.5 font-bold text-foreground bg-district-bg align-top text-xs" rowSpan={items.length}>{distrito}</td>}
                      <td className="px-3 py-2.5 text-foreground text-xs">{item.record.servicio}</td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge value={item.record.disponibilidad} onChange={() => toggleField(item.originalIndex, "disponibilidad")} disabled={!isAuthenticated} loading={isSaving} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge value={item.record.despachado} onChange={() => toggleField(item.originalIndex, "despachado")} disabled={!isAuthenticated} loading={isSaving} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge value={item.record.recepcionado} onChange={() => toggleField(item.originalIndex, "recepcionado")} disabled={!isAuthenticated} loading={isSaving} />
                      </td>
                      <td className="px-3 py-2.5">
                        <ObservacionesCell value={item.record.observaciones} onChange={(v) => updateObservaciones(item.originalIndex, v)} disabled={!isAuthenticated} />
                      </td>
                      {idx === 0 && <td className="px-3 py-2.5 bg-district-bg align-middle" rowSpan={items.length}><PercentageBar value={distPct} /></td>}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          {isAuthenticated
            ? "Los cambios se guardan automáticamente. Haga clic en SÍ/NO para actualizar."
            : "Iniciá sesión para poder modificar los datos."}
        </p>
      </div>
    </div>
  );
}
