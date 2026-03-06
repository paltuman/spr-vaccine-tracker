export type Zona = "SAN PEDRO SUR" | "SAN PEDRO NORTE";

export interface ServiceRecord {
  distrito: string;
  servicio: string;
  zona: Zona;
  disponibilidad: boolean;
  despachado: boolean;
}

const raw: Array<{ distrito: string; servicios: string[]; zona: Zona }> = [
  // === SAN PEDRO SUR ===
  {
    distrito: "25 DE DICIEMBRE",
    zona: "SAN PEDRO SUR",
    servicios: [
      "PS CAÑADA DE LOURDES", "PS. MBOIY", "USF 25 de Diciembre",
      "USF. COLONIA NAVIDAD", "USF. POTRERO YBATE"
    ],
  },
  {
    distrito: "CAPIIBARY",
    zona: "SAN PEDRO SUR",
    servicios: [
      "CS Capiibary", "PS. 1RO. DE MARZO", "PS. POTRERITO", "PS. SIDEPAR",
      "USF. 3 DE NOVIEMBRE", "USF. ARA PYAHU 1", "USF. ARA PYAHU 2",
      "USF. CAPIIBARY 1", "USF. CAPIIBARY 2"
    ],
  },
  {
    distrito: "GENERAL ELIZARDO AQUINO",
    zona: "SAN PEDRO SUR",
    servicios: [
      "DI PINDOTY", "HD Gral. Aquino", "P.S. COLONIA ÑANDEJARA",
      "PS. COL. MBARETE", "PS. HUGUA REY", "PS. JURUHEI",
      "PS. TACUAROL", "USF. SANTA CLARA"
    ],
  },
  {
    distrito: "GUAJAYVI",
    zona: "SAN PEDRO SUR",
    servicios: [
      "PS Guajayvi", "PS. CALLE ASUNCION", "PS. LUZ BELLA",
      "USF. BO. SAN PEDRO", "USF. GUAJAYVI", "USF. GUAJAYVI 2",
      "USF. PRIMAVERA REAL", "USF. SANTO DOMINGO", "USF. TORO PIRU"
    ],
  },
  {
    distrito: "ITACURUBÍ DEL ROSARIO",
    zona: "SAN PEDRO SUR",
    servicios: [
      "CS Itacurubí del Rosario", "HOSP. TABEA", "IPS-PS Usufructo Friesland",
      "PS. AGUAPEY", "TUYANGO", "USF- GENERAL CÁCERES",
      "USF. SAN ALFREDO", "USF. SGTO. CASTIGLIONI"
    ],
  },
  {
    distrito: "SAN ESTANISLAO",
    zona: "SAN PEDRO SUR",
    servicios: [
      "HD San Estanislao", "IPS San Estanislao", "PS. 2000 BERTONI",
      "PS. 6000 DEF. DEL CHACO", "PS. COSTA BARRERO", "PS. KURURUO",
      "PS. TACUARA", "PS. VACA JHU", "PS. YHU RUGUA",
      "USF San José Obrero", "USF. 6000 BERTONI",
      "USF. MONTE ALTO", "USF. TACURUTY"
    ],
  },
  {
    distrito: "SAN JOSÉ DEL ROSARIO",
    zona: "SAN PEDRO SUR",
    servicios: [
      "HOSPITAL VOLENDAM", "P.S. ESCALERA", "USF SAN JOSE DEL ROSARIO"
    ],
  },
  {
    distrito: "UNIÓN",
    zona: "SAN PEDRO SUR",
    servicios: ["USF Unión 1", "USF. UNION 2"],
  },
  {
    distrito: "VILLA DEL ROSARIO",
    zona: "SAN PEDRO SUR",
    servicios: [
      "CS Villa del Rosario", "USF. PUERTO LA AMISTAD",
      "USF. SAN JOSE DEL R.", "USF. VILLA DEL ROSARIO"
    ],
  },
  {
    distrito: "YATAITY DEL NORTE",
    zona: "SAN PEDRO SUR",
    servicios: [
      "HOSP. BAS. YATAITY DEL NORTE", "USF. 12 DE JUNIO",
      "USF. GUAVIRA", "USF. YATAITY DEL NORTE"
    ],
  },
  {
    distrito: "YRYBUCUÁ",
    zona: "SAN PEDRO SUR",
    servicios: [
      "PS San Isidro Norte", "PS YRYBUCUA", "USF SANTA ISABEL",
      "USF Yrybucuá", "USF. SAN ISIDRO DEL NORTE", "USF. VYARENDA"
    ],
  },
  // === SAN PEDRO NORTE ===
  {
    distrito: "ANTEQUERA",
    zona: "SAN PEDRO NORTE",
    servicios: ["PS Poroto", "USF Antequera"],
  },
  {
    distrito: "CHORÉ",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "CS Chore", "PS Choremi", "PS La Niña", "PS. HUGUA POTY",
      "PS. MARTILLO", "PS. NACIENTE", "USF Kokuera",
      "USF San Francisco", "USF. LIBERACION NORTE", "USF.SAN LUIS"
    ],
  },
  {
    distrito: "GRAL. FCO. I. RESQUÍN",
    zona: "SAN PEDRO NORTE",
    servicios: ["PS. KIRAY", "USF Naranjito", "USF. GRAL. RESQUIN"],
  },
  {
    distrito: "LIBERACIÓN",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "PS. AQUIDABAN", "PS. ARROYO MOROTI", "PS. COLONIA FELICIDAD",
      "PS. JEJUI", "PS. JOAIHU", "USF Colonia Navidad Joaihu",
      "USF Cruce Liberación"
    ],
  },
  {
    distrito: "LIMA",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "HG. SANTA ROSA", "USF Lima", "USF SANGUINA CUE",
      "USF. PASO TUNA", "USF. PEDRO GIMENEZ", "USF. SGTO MONTANIA"
    ],
  },
  {
    distrito: "NUEVA GERMANIA",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "CS. NVA GERMANIA", "PS. LA GERMANINA", "USF. BARRIAL",
      "USF. KOE PYAHU", "USF. NUEVA GERMANIA", "USF.ARROYO ATA"
    ],
  },
  {
    distrito: "SAN PABLO",
    zona: "SAN PEDRO NORTE",
    servicios: ["PS San Pablo", "PS. SAN ANTONIO", "USF San Pablo - ex Cocuere"],
  },
  {
    distrito: "SAN PEDRO DEL YCUAMANDYYÚ",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "HR San Pedro", "IPS San Pedro", "PS Potrero Naranjo",
      "PS Puerto Santa Rosa", "PS YBAROTY", "PS. AGUARAY SECO",
      "PS. COLONIA SAN JUAN", "PS. CORPUS CHRISTY", "PS. NARANJATY",
      "PS. PIRI PUCU", "PS. SAN PEDRO POTY", "PS. YATEBO",
      "USF San Pedro Centro", "USF San Pedro Poty",
      "USF. COLONIA BARBERO", "USF. CORREA RUGUA",
      "USF. VILLA DEL MERCEDES", "USF. YBAPOVO"
    ],
  },
  {
    distrito: "SAN VICENTE PANCHOLO",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "PS Aravera", "PS. COSTA RICA", "PS. ESTRELLITA",
      "PS. SAN JOSE DEL NORTE", "USF - San Vicente Pancholo",
      "USF. CRESCENCIO GONZALEZ", "USF. SAN JOSÉ DEL NORTE",
      "USF. SAN VICENTE PANCHOLO"
    ],
  },
  {
    distrito: "SANTA ROSA DEL AGUARAY",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "HG Santa Rosa del Aguaray", "IPS SANTA ROSA DEL AGUARAY",
      "PS. KORORO'I", "PS. KURUPAYTY", "PS. SAN MIGUEL DEL NORTE",
      "PS. TAVA GUARANÍ", "USF Pedro Giménez", "USF PROSPERIDAD",
      "USF. AGUERITO", "USF. SANTA BARBARA", "USF. YAGUARETE FOREST"
    ],
  },
  {
    distrito: "TACUATÍ",
    zona: "SAN PEDRO NORTE",
    servicios: [
      "PS. 6 DE ENERO P1", "PS. 6 DE ENERO P2", "PS. CASTILLO CUE",
      "PS. PYAGUAPY", "USF Tacuati Centro",
      "USF. SENDERO DEL NORTE", "USF. PYAGUAPY"
    ],
  },
];

export function buildInitialData(): ServiceRecord[] {
  const records: ServiceRecord[] = [];
  for (const { distrito, servicios, zona } of raw) {
    for (const servicio of servicios) {
      records.push({
        distrito,
        servicio,
        zona,
        disponibilidad: false,
        despachado: false,
      });
    }
  }
  return records;
}

export function getDistrictStats(records: ServiceRecord[]) {
  const map = new Map<string, { total: number; conDisp: number; conDesp: number; zona: Zona }>();
  for (const r of records) {
    const entry = map.get(r.distrito) ?? { total: 0, conDisp: 0, conDesp: 0, zona: r.zona };
    entry.total++;
    if (r.disponibilidad) entry.conDisp++;
    if (r.despachado) entry.conDesp++;
    map.set(r.distrito, entry);
  }
  return map;
}
