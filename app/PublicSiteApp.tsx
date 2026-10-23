"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Menu, X, ArrowRight, ArrowUpRight, MessageCircle, ChevronRight, ChevronLeft,
  Check, LogOut, LayoutDashboard, Users, CalendarDays, Package, Layers,
  Settings, UserCircle2, Search, Plus, MoreHorizontal, Home as HomeIcon,
  Bed, Briefcase, UtensilsCrossed, DoorOpen, MoveHorizontal, Lock, Mail,
  Eye, EyeOff, Bell, FileText, ClipboardList, Trash2, StickyNote, Phone,
  ChevronDown, Building2, LogIn, Facebook
} from "lucide-react";
import catalogData from "@/data/catalog.json";

const PH_OFICINA = "/img/ph_oficina.jpg";
const PH_SALA = "/img/ph_sala.jpg";
const PH_MARMOL = "/img/ph_marmol.jpg";
const PH_HERO = "/img/ph_hero.jpg";
const PH_BEFORE_TV = "/img/ph_before_tv.jpg";
const PH_AFTER_TV = "/img/ph_after_tv.jpg";
const PVC_ROMA = "/img/pvc_roma.jpg";
const PVC_VIENA = "/img/pvc_viena.jpg";
const PVC_PRAGA = "/img/pvc_praga.jpg";
const PVC_PARIS = "/img/pvc_paris.jpg";
const PVC_LONDRES = "/img/pvc_londres.jpg";
const PVC_BERLIN = "/img/pvc_berlin.jpg";
const PVC_MADRID = "/img/pvc_madrid.jpg";
const MS_CALACATTA_REAL = "/img/ms_calacatta_real.jpg";
const LOGO_HI = "/img/logo_hi.jpg";
const PH_TAPICERIA = "/img/ph_tapiceria.jpg";

/* ============================================================
   DEMO_CONFIG — reemplazar por datos reales del cliente
   ============================================================ */
const DEMO_CONFIG = {
  brand: "Home Interiorismo",
  whatsappNumber: "527551142934",
  city: "Zihuatanejo, Guerrero",
  facebookUrl: "https://www.facebook.com/share/1Bhm6eSPbs/?mibextid=wwXIfr",
};

/* Videos del Hero: viven dentro del propio sitio (public/videos), ya no en Supabase,
   así que no dependen de ningún servicio externo. Cada uno trae su foto de portada:
   si el navegador bloquea la reproducción (iPhone en bajo consumo) o el video falla,
   se queda la portada y la página nunca se ve vacía. */
const HERO_VIDEOS = [
  { src: "/videos/hero2.mp4", poster: "/videos/hero2.jpg", label: "Persianas" },
  { src: "/videos/toldo.mp4", poster: "/videos/toldo.jpg", label: "Toldo retráctil" },
];

/* ============================================================
   Paleta / tipografía — tokens de diseño
   ============================================================ */
const C = {
  carbon: "#0F0D0B",
  panel: "#1A1611",
  panel2: "#221C16",
  cream: "#F6F1E7",
  creamDim: "#E7DFCE",
  beige: "#D9CBB2",
  walnut: "#5C4030",
  oak: "#A9814F",
  copper: "#BE7A4E",
  copperSoft: "#8A5A3C",
  line: "rgba(246,241,231,0.13)",
  lineStrong: "rgba(246,241,231,0.22)",
};
const A = {
  bg: "#F6F3EC",
  panel: "#FFFFFF",
  ink: "#221D17",
  sub: "#786E5E",
  line: "#E7E0D0",
  accent: "#BE7A4E",
  green: "#3F6B4A",
  amber: "#AD7C2C",
  red: "#A6432F",
  slate: "#5A6470",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');";

const PD_WALNUT_ELIPSE = "/img/pd_walnut_elipse.jpg";
const PD_BIRCH_EMBER = "/img/pd_birch_ember.jpg";
const PD_COCOA_ASH = "/img/pd_cocoa_ash.jpg";
const PD_MAPLE_DUSK = "/img/pd_maple_dusk.jpg";
const PD_ASH_NOMAD = "/img/pd_ash_nomad.jpg";
const PD_IVORY_ELM = "/img/pd_ivory_elm.jpg";
const PERSIANA_ZEBRA_AZUL = "/img/persiana_zebra_azul.jpg";
const PERSIANA_ZEBRA_NEGRA = "/img/persiana_zebra_negra.jpg";
const PERSIANA_ZEBRA_TAUPE = "/img/persiana_zebra_taupe.jpg";
const PERSIANA_SHEER_MAR = "/img/persiana_sheer_mar.jpg";
const PERSIANA_SCREEN_EXT = "/img/persiana_screen_ext.jpg";
const PROY_MARMOL_ORO = "/img/proy_marmol_oro.jpg";
const PROY_MARMOL_NEGRO = "/img/proy_marmol_negro.jpg";
const PROY_MARMOL_COMEDOR = "/img/proy_marmol_comedor.jpg";
const PROY_PASTO_ANDADOR = "/img/proy_pasto_andador.jpg";
const PROY_PASTO_COLUMPIO = "/img/proy_pasto_columpio.jpg";
const PROY_LAMBRIN_RECEPCION = "/img/proy_lambrin_recepcion.jpg";
const PROY_LAMBRIN_PUERTA = "/img/proy_lambrin_puerta.jpg";
const PROY_LAMBRIN_ALBERCA = "/img/proy_lambrin_alberca.jpg";
const PROY_MALLA_DELFINARIO = "/img/proy_malla_delfinario.jpg";
const PROY_MURO_VERDE_LOCAL = "/img/proy_muro_verde_local.jpg";
const PROY_MURO_VERDE_FUENTE = "/img/proy_muro_verde_fuente.jpg";
const PROY_LAMBRIN_PLAYA = "/img/proy_lambrin_playa.jpg";
const PH_CORTINAS_TELA = "/img/ph_cortinas_tela.jpg";
const PH_SHEER_ELEGANCE = "/img/ph_sheer_elegance.jpg";
const PASTO_PATIO_BAR = "/img/pasto_patio_bar.jpg";
const PASTO_JARDIN_FLORES = "/img/pasto_jardin_flores.jpg";
const PANELES_DECO_COVER = "/img/paneles_deco_cover.jpg";
const MURO_VERDE_RUBENS_RESTAURANTE = "/img/muro_verde_rubens_restaurante.jpg";
const PISO_WPC_COVER_SALA = "/img/piso_wpc_cover_sala.jpg";
const WPC_TV_LISTONES = "/img/wpc_tv_listones.jpg";
const WPC_CABECERA_CAMA = "/img/wpc_cabecera_cama.jpg";
const WPC_MURO_MARMOL_BARRA = "/img/wpc_muro_marmol_barra.jpg";
const PASTO_PATIO_LADRILLO = "/img/pasto_patio_ladrillo.jpg";
const PASTO_PALMERAS_PIEDRA = "/img/pasto_palmeras_piedra.jpg";
const PASTO_ANDADOR_NOCTURNO = "/img/pasto_andador_nocturno.jpg";
const BLACKOUT_CAFE_LADRILLO = "/img/blackout_cafe_ladrillo.jpg";
const BLACKOUT_GRIS_ALBERCA = "/img/blackout_gris_alberca.jpg";
const BLACKOUT_GRIS_LAMPARA = "/img/blackout_gris_lampara.jpg";
const CORTINA_SHEER_ARMCHAIRS = "/img/cortina_sheer_armchairs.jpg";
const SCREEN_PALAPA_TERRAZA = "/img/screen_palapa_terraza.jpg";
const SCREEN_VISTA_MAR_1 = "/img/screen_vista_mar_1.jpg";
const SCREEN_VISTA_MAR_2 = "/img/screen_vista_mar_2.jpg";
const TAP_CAMASTROS_AZULES = "/img/tap_camastros_azules.jpg";
const TAP_SALA_CURVA_AZUL = "/img/tap_sala_curva_azul.jpg";
const SHEER_GRIS_INFANTIL = "/img/sheer_gris_infantil.jpg";
const SHEER_AZUL_PASILLO = "/img/sheer_azul_pasillo.jpg";
const SHEER_TAUPE_ESQUINA = "/img/sheer_taupe_esquina.jpg";
const SHEER_AZUL_TRAGALUZ = "/img/sheer_azul_tragaluz.jpg";
const TOLDO_VERTICAL_JARDIN = "/img/toldo_vertical_jardin.jpg";
const PALAPA_TEXTURA_NATURAL = "/img/palapa_textura_natural.jpg";
const PALAPA_SHOWROOM = "/img/palapa_showroom.jpg";
const PALAPA_MATERIAL_SINTETICO = "/img/palapa_material_sintetico.jpg";
const PERSIANA_SALA_COJINES = "/img/persiana_sala_cojines.jpg";
const VPVC_CAFE = "/img/vpvc_cafe.jpg";
const VPVC_HUESO = "/img/vpvc_hueso.jpg";
const VPVC_NARANJA = "/img/vpvc_naranja.jpg";
const VPVC_REAL_1 = "/img/vpvc_real_1.jpg";
const VPVC_REAL_2 = "/img/vpvc_real_2.jpg";
const WPC_PLAFON = "/img/wpc_plafon.jpg";
const WPC_MURO_ALBERCA = "/img/wpc_muro_alberca.jpg";
const CORTINA_ONDULADA = "/img/cortina_ondulada.jpg";
const CORTINA_PLISADA = "/img/cortina_plisada.jpg";
const TOLDO_VELA_RESTAURANTE = "/img/toldo_vela_restaurante.jpg";
const TOLDO_VELA_INSTALACION = "/img/toldo_vela_instalacion.jpg";
const TOLDO_RETRACTIL_ALBERCA = "/img/toldo_retractil_alberca.jpg";
const PALAPA_APEX_ESTRUCTURA = "/img/palapa_apex_estructura.jpg";
const PALAPA_EXTERIOR_REAL = "/img/palapa_exterior_real.jpg";
const PERSIANA_MADERA_VENTANA = "/img/persiana_madera_ventana.jpg";
const PERSIANA_PASILLO_CRISTAL = "/img/persiana_pasillo_cristal.jpg";
const PH_MURO_VERDE_ALTAR = "/img/ph_muro_verde_altar.jpg";
const PH_MURO_VERDE_TECHO_RESTAURANTE = "/img/ph_muro_verde_techo_restaurante.jpg";
const PH_TAPICERIA_MESA_LARGA = "/img/ph_tapiceria_mesa_larga.jpg";
const PH_TAPICERIA_BANCA = "/img/ph_tapiceria_banca.jpg";
const PH_TAPICERIA_SOFA_GRIS = "/img/ph_tapiceria_sofa_gris.jpg";
const PH_MURO_VERDE_MURAL_ALBERCA = "/img/ph_muro_verde_mural_alberca.jpg";
const PH_VERTICAL_PVC = "/img/ph_vertical_pvc.jpg";
const PH_PERSIANA_BLACKOUT = "/img/ph_persiana_blackout.jpg";
const PH_PERSIANA_SCREEN = "/img/ph_persiana_screen.jpg";

const PH_WPC_GRAY_2025 = "/img/ph_wpc_gray_2025.jpg";
const PH_WPC_BLANCO_2025 = "/img/ph_wpc_blanco_2025.jpg";
const PH_WPC_PAROTA = "/img/ph_wpc_parota.jpg";
const PH_WPC_FRESNO = "/img/ph_wpc_fresno.jpg";
const PH_WPC_ARENA = "/img/ph_wpc_arena.jpg";
const PH_WPC_SAND = "/img/ph_wpc_sand.jpg";
const PH_WPC_NEGRO_2025 = "/img/ph_wpc_negro_2025.jpg";
const PH_WPC_NOGAL_2025 = "/img/ph_wpc_nogal_2025.jpg";
const PH_WPC_OAK = "/img/ph_wpc_oak.jpg";
const PH_WPC_OSTION = "/img/ph_wpc_ostion.jpg";
const ROOM_WPC_GRAY = "/img/room_wpc_gray.jpg";
const ROOM_WPC_NEGRO = "/img/room_wpc_negro.jpg";
const ROOM_WPC_NOGAL = "/img/room_wpc_nogal.jpg";
const ROOM_WPC_BLANCO = "/img/room_wpc_blanco.jpg";
const ROOM_WPC_PAROTA = "/img/room_wpc_parota.jpg";
const ROOM_WPC_FRESNO = "/img/room_wpc_fresno.jpg";
const ROOM_WPC_ARENA = "/img/room_wpc_arena.jpg";
const ROOM_WPC_SAND = "/img/room_wpc_sand.jpg";
const ROOM_WPC_OAK = "/img/room_wpc_oak.jpg";
const ROOM_WPC_OSTION = "/img/room_wpc_ostion.jpg";

/* Fotografía de referencia proporcionada por el usuario (espacios genéricos,
   sin marca de terceros) — usada para dar look fotográfico real al demo.
   TODO producción: sustituir por fotografía propia del cliente. */
const ROOM_PHOTOS = {
  sala: PH_SALA,
  oficina: PH_OFICINA,
  recepcion: PH_MARMOL,
  restaurante: PH_HERO,
  recamara: PH_SALA,   // TODO: sustituir por foto real de recámara — se reutiliza temporalmente
  otro: PH_HERO,        // TODO: sustituir por foto real — se reutiliza temporalmente
};

/* Fotografías reales de "SALA" renderizadas por el cliente, una por cada acabado
   de Lambrín WPC — permiten mostrar la sala real con el color exacto en vez de
   un tinte simulado. Solo cubre espacio "sala" por ahora. */
const WPC_SALA_PHOTOS: Record<string, string> = {
  "wpc-gris-ondulado": ROOM_WPC_GRAY,
  "wpc-negro-ondulado": ROOM_WPC_NEGRO,
  "wpc-nogal-ondulado": ROOM_WPC_NOGAL,
  "wpc-blanco-ondulado": ROOM_WPC_BLANCO,
  "wpc-parota": ROOM_WPC_PAROTA,
  "wpc-fresno": ROOM_WPC_FRESNO,
  "wpc-arena": ROOM_WPC_ARENA,
  "wpc-sand": ROOM_WPC_SAND,
  "wpc-oak": ROOM_WPC_OAK,
  "wpc-ostion": ROOM_WPC_OSTION,
};
/* ============================================================
   CATÁLOGO — viene de data/catalog.json, que se genera al publicar desde
   Supabase (scripts/sync-catalog.mjs). Lo edita el dueño en /admin.
   ============================================================ */
type CatalogPhoto = { path: string; model: string; caption: string; sort: number };
type CatalogProduct = {
  id: string; code: string; name: string; short: string; description: string; cover: string | null;
  sort: number; price: number | null; price_unit: string; price_mode: string; photos: CatalogPhoto[];
};
const CATALOG: CatalogProduct[] = ((catalogData as any).products || []) as CatalogProduct[];
const PRODUCT_PHOTOS: Record<string, string | null> = Object.fromEntries(CATALOG.map((p) => [p.id, p.cover]));
const PRODUCT_GALLERY: Record<string, string[]> = Object.fromEntries(CATALOG.map((p) => [p.id, p.photos.map((f) => f.path)]));
const NAMED_GALLERY: Record<string, string[]> = Object.fromEntries(CATALOG.map((p) => [p.id, p.photos.map((f) => f.caption)]));
const MODEL_GALLERY: Record<string, string[]> = Object.fromEntries(CATALOG.map((p) => [p.id, p.photos.map((f) => f.model)]));
const REVESTIMIENTOS = ["lambrin-wpc", "panel-pvc", "marmol-sintetico", "paneles-decorativos"];

const UNIT_LABEL: Record<string, string> = { m2: "m²", ml: "metro lineal", pieza: "pieza" };
/* "Desde $1,250 / m²" · "$980 / pieza" · null si es "a cotizar" o no tiene precio */
function formatPrice(p: any): string | null {
  if (!p || p.price === null || p.price === undefined || p.price_unit === "cotizar") return null;
  const n = Number(p.price).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return `${p.price_mode === "desde" ? "Desde " : ""}${n} / ${UNIT_LABEL[p.price_unit] || p.price_unit}`;
}

/* ============================================================
   DEMO_DATA — capa de datos ficticios (sustituible por Supabase)
   ============================================================ */
const DEMO_DATA = {
  products: CATALOG.map((p) => ({
    id: p.id, code: p.code, name: p.name, short: p.short, description: p.description,
    price: p.price, price_unit: p.price_unit, price_mode: p.price_mode,
    family: REVESTIMIENTOS.includes(p.id) ? "wood" : "simple", simple: !REVESTIMIENTOS.includes(p.id),
    catalogGroup: REVESTIMIENTOS.includes(p.id) ? "revestimientos" : "exterior", featured: true,
  })),

  finishes: [
    // Lambrín WPC — fotografía real de muestrario
    { id: "wpc-gris-ondulado", productId: "lambrin-wpc", index: "WPC-01", name: "Gray", desc: "Relieve ondulado, tono gris.", base: "#6B6B6B", dark: "#454545", light: "#8C8C8C", photo: PH_WPC_GRAY_2025 },
    { id: "wpc-negro-ondulado", productId: "lambrin-wpc", index: "WPC-02", name: "Negro", desc: "Relieve ondulado, tono negro.", base: "#242424", dark: "#121212", light: "#3A3A3A", photo: PH_WPC_NEGRO_2025 },
    { id: "wpc-nogal-ondulado", productId: "lambrin-wpc", index: "WPC-03", name: "Nogal", desc: "Relieve ondulado, tono nogal.", base: "#5C3D2A", dark: "#3A2416", light: "#7A5A3D", photo: PH_WPC_NOGAL_2025 },
    { id: "wpc-blanco-ondulado", productId: "lambrin-wpc", index: "WPC-04", name: "Blanco", desc: "Relieve ondulado, tono claro.", base: "#D8D3C8", dark: "#B0AA9C", light: "#EDE9DE", photo: PH_WPC_BLANCO_2025 },
    { id: "wpc-parota", productId: "lambrin-wpc", index: "WPC-05", name: "Parota", desc: "Relieve estriado, tono café cálido con veta marcada.", base: "#8A5A34", dark: "#5C3A20", light: "#AD7B4E", photo: PH_WPC_PAROTA },
    { id: "wpc-fresno", productId: "lambrin-wpc", index: "WPC-06", name: "Fresno", desc: "Relieve estriado, tono miel claro.", base: "#B98F5C", dark: "#8C6538", light: "#D4AD7C", photo: PH_WPC_FRESNO },
    { id: "wpc-arena", productId: "lambrin-wpc", index: "WPC-07", name: "Arena", desc: "Relieve estriado, tono arena grisáceo.", base: "#A8A18F", dark: "#7C7666", light: "#C4BCA8", photo: PH_WPC_ARENA },
    { id: "wpc-sand", productId: "lambrin-wpc", index: "WPC-08", name: "Sand", desc: "Relieve estriado, tono beige claro.", base: "#C4BCA8", dark: "#9A9280", light: "#DDD5C2", photo: PH_WPC_SAND },
    { id: "wpc-oak", productId: "lambrin-wpc", index: "WPC-09", name: "Oak", desc: "Relieve estriado, tono roble natural.", base: "#A87C4E", dark: "#7A5836", light: "#C79E6C", photo: PH_WPC_OAK },
    { id: "wpc-ostion", productId: "lambrin-wpc", index: "WPC-10", name: "Ostion", desc: "Relieve estriado, tono hueso mate.", base: "#D8D2C0", dark: "#B0A992", light: "#E8E3D4", photo: PH_WPC_OSTION },

    // Paneles PVC (laminado interior) — línea real "Urbana", fotografía propia
    { id: "pvc-roma", productId: "panel-pvc", index: "PVC-01", name: "Roma", desc: "Nogal oscuro, veta marcada.", base: "#4A3728", dark: "#2C2015", light: "#6B5138", photo: PVC_ROMA },
    { id: "pvc-viena", productId: "panel-pvc", index: "PVC-02", name: "Viena", desc: "Café profundo, tono uniforme.", base: "#4E3A2A", dark: "#2E2217", light: "#70573D", photo: PVC_VIENA },
    { id: "pvc-praga", productId: "panel-pvc", index: "PVC-03", name: "Praga", desc: "Café rojizo intenso.", base: "#5B3A28", dark: "#3A2416", light: "#7D5A3F", photo: PVC_PRAGA },
    { id: "pvc-paris", productId: "panel-pvc", index: "PVC-04", name: "París", desc: "Miel cálido, veta natural.", base: "#8C6A42", dark: "#5E4729", light: "#AC895E", photo: PVC_PARIS },
    { id: "pvc-londres", productId: "panel-pvc", index: "PVC-05", name: "Londres", desc: "Gris envejecido, look urbano.", base: "#8A8378", dark: "#5F594F", light: "#A9A296", photo: PVC_LONDRES },
    { id: "pvc-berlin", productId: "panel-pvc", index: "PVC-06", name: "Berlín", desc: "Gris frío, minimalista.", base: "#9A9793", dark: "#6C6965", light: "#B8B5B0", photo: PVC_BERLIN },
    { id: "pvc-madrid", productId: "panel-pvc", index: "PVC-07", name: "Madrid", desc: "Gris claro, tono uniforme.", base: "#B4AFA6", dark: "#87827A", light: "#D0CBC1", photo: PVC_MADRID },

    // Mármol Sintético
    { id: "ms-calacatta", productId: "marmol-sintetico", index: "MS-01", name: "Calacatta", desc: "Blanco marfil, veta gris.", base: "#ECE6DA", vein: "#B79B6E", base2: "#F8F5EC", marble: true, photo: MS_CALACATTA_REAL },
    { id: "ms-nero-marquina", productId: "marmol-sintetico", index: "MS-02", name: "Nero Marquina", desc: "Negro profundo, veta blanca.", base: "#1B1A1B", vein: "#C9AD7C", base2: "#2E2C2D", marble: true },
    { id: "ms-emperador", productId: "marmol-sintetico", index: "MS-03", name: "Emperador", desc: "Café oscuro, veta cobre.", base: "#4A342A", vein: "#C79A63", base2: "#6B4B3A", marble: true },

    // Paneles Decorativos — Lambrín en acabado liso, fotografía real de muestrario
    { id: "pd-walnut-elipse", productId: "paneles-decorativos", index: "PD-01", name: "Walnut Elipse", desc: "Nogal profundo con veta marcada, acabado liso.", base: "#6B3F27", dark: "#432717", light: "#8A5A38", photo: PD_WALNUT_ELIPSE },
    { id: "pd-birch-ember", productId: "paneles-decorativos", index: "PD-02", name: "Birch Ember", desc: "Miel cálido, acabado liso.", base: "#B87F3E", dark: "#875C29", light: "#D2A05F", photo: PD_BIRCH_EMBER },
    { id: "pd-cocoa-ash", productId: "paneles-decorativos", index: "PD-03", name: "Cocoa Ash", desc: "Café grisáceo, acabado liso.", base: "#8C7A63", dark: "#5E5142", light: "#AC9A82", photo: PD_COCOA_ASH },
    { id: "pd-maple-dusk", productId: "paneles-decorativos", index: "PD-04", name: "Maple Dusk", desc: "Arce claro y luminoso, acabado liso.", base: "#D6C6A8", dark: "#AB9873", light: "#E8DCC4", photo: PD_MAPLE_DUSK },
    { id: "pd-ash-nomad", productId: "paneles-decorativos", index: "PD-05", name: "Ash Nomad", desc: "Piedra gris veteada, acabado liso.", base: "#8B8B8C", dark: "#5F5F60", light: "#ACACAD", photo: PD_ASH_NOMAD },
    { id: "pd-ivory-elm", productId: "paneles-decorativos", index: "PD-06", name: "Ivory Elm", desc: "Blanco hueso con textura de tela, acabado liso.", base: "#E6E3DC", dark: "#C2BFB6", light: "#F2F0EB", photo: PD_IVORY_ELM },

    // Tapicería de Exterior — sin fotografía real todavía, textura de referencia
    { id: "tap-generico", productId: "tapiceria-exterior", index: "TAP-01", name: "Tapizado color crema", desc: "Cojines en tono crema con estructura de madera — nuestro acabado más solicitado.", base: "#8A5A3C", accent: "#D9CBB2", deco: true },
  ],

  applications: [
    { id: "sala", name: "Sala", icon: "sala" },
    { id: "recamara", name: "Recámara", icon: "recamara" },
    { id: "oficina", name: "Oficina", icon: "oficina" },
    { id: "restaurante", name: "Restaurante", icon: "restaurante" },
    { id: "recepcion", name: "Recepción", icon: "recepcion" },
    { id: "otro", name: "Otro espacio", icon: "otro" },
  ],
};

/* ============================================================
   Helpers — texturas CSS (evita depender de fotografía externa)
   ============================================================ */
function onduladoStyle(base, dark, light) {
  // simula el relieve ondulado/corrugado (ritmo de crestas), para acabados sin foto real todavía
  return {
    backgroundColor: base,
    backgroundImage: `repeating-linear-gradient(95deg, ${light} 0px, ${base} 6px, ${dark} 12px, ${base} 18px, ${light}99 22px, ${base} 28px)`,
  };
}

function textureStyle(finish) {
  if (!finish) return { backgroundColor: C.beige };
  if (finish.photo) {
    return { backgroundImage: `url(${finish.photo})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (finish.ondulado) {
    return onduladoStyle(finish.base, finish.dark, finish.light);
  }
  if (finish.marble) {
    return {
      backgroundColor: finish.base,
      backgroundImage: `radial-gradient(120% 90% at 12% 15%, ${finish.vein}30, transparent 42%), radial-gradient(100% 80% at 85% 75%, ${finish.vein}22, transparent 46%), conic-gradient(from 210deg at 50% 45%, ${finish.base2}, ${finish.base}, ${finish.vein}40, ${finish.base}, ${finish.base2})`,
      backgroundBlendMode: "overlay, overlay, normal",
    };
  }
  if (finish.deco) {
    return {
      backgroundColor: finish.base,
      backgroundImage: `repeating-linear-gradient(45deg, ${finish.accent}30 0, ${finish.accent}30 2px, transparent 2px, transparent 16px), repeating-linear-gradient(-45deg, ${finish.accent}1c 0, ${finish.accent}1c 2px, transparent 2px, transparent 16px)`,
    };
  }
  // madera
  return {
    backgroundColor: finish.base,
    backgroundImage: `repeating-linear-gradient(95deg, ${finish.dark}3d 0px, transparent 1px, transparent 3px, ${finish.dark}26 4px, transparent 5px, transparent 10px), repeating-linear-gradient(95deg, ${finish.dark}4d 0px, transparent 2px, transparent 46px, ${finish.dark}30 48px, transparent 50px, transparent 96px), linear-gradient(155deg, ${finish.light}, ${finish.base} 55%, ${finish.dark})`,
  };
}

function tintStyle(finish) {
  // tinte plano derivado del acabado — para superponer sobre fotografía real de un espacio
  // (a diferencia de textureStyle, nunca usa la foto del acabado, solo su color base)
  if (!finish) return { backgroundColor: C.beige };
  return { backgroundColor: finish.base || C.beige };
}

function buildWaLink({ product, finish, space, largo, alto, name }: any = {}) {
  let msg = "Hola, me interesa cotizar";
  if (product) msg += ` ${product}`;
  if (finish) msg += ` ${finish}`;
  if (space) msg += ` para ${space === "Otro espacio" ? "un espacio" : `una ${space.toLowerCase()}`}`;
  if (largo && alto) msg += ` de aproximadamente ${largo} x ${alto} m`;
  msg += ".";
  if (name) msg = `Hola, soy ${name}. ` + msg.replace("Hola, ", "");
  return `https://wa.me/${DEMO_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

function roomIcon(id, props) {
  const map = { sala: HomeIcon, recamara: Bed, oficina: Briefcase, restaurante: UtensilsCrossed, recepcion: DoorOpen, otro: Building2 };
  const Ico = map[id] || HomeIcon;
  return <Ico {...props} />;
}

const STATUS_STYLES = {
  "Nuevo": { bg: "#EAF1EC", fg: A.green },
  "Contactado": { bg: "#EFF2F6", fg: A.slate },
  "Cotización enviada": { bg: "#FBF1E3", fg: A.amber },
  "Seguimiento": { bg: "#FBF1E3", fg: A.amber },
  "Ganado": { bg: "#EAF1EC", fg: A.green },
  "Perdido": { bg: "#F7EBE8", fg: A.red },
};

const QUOTE_STATUS_STYLES = {
  "Borrador": { bg: "#EFF2F6", fg: A.slate },
  "Enviada": { bg: "#FBF1E3", fg: A.amber },
  "Aceptada": { bg: "#EAF1EC", fg: A.green },
  "Rechazada": { bg: "#F7EBE8", fg: A.red },
};

function money(n) {
  return (Number(n) || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

function quoteTotal(quote) {
  return quote.items.reduce((sum, it) => sum + (Number(it.m2) || 0) * (Number(it.precioM2) || 0), 0);
}

/* Ajusta un color hex hacia claro (amt>0) u oscuro (amt<0) — para generar dark/light a partir de un solo color base */
function shadeHex(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

/* ============================================================
   CONTEXTO DE DATOS DE PRODUCTO — compartido entre sitio público y admin
   para que Productos/Acabados editados en el admin se reflejen en vivo
   ============================================================ */
const ProductDataContext = React.createContext(null);
function useProductData() {
  return React.useContext(ProductDataContext);
}

/* ============================================================
   APP RAÍZ — separa SITIO PÚBLICO / ADMIN
   ============================================================ */
export default function PublicSiteApp() {
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState(DEMO_DATA.products);
  const [finishes, setFinishes] = useState(DEMO_DATA.finishes);

  const goAdmin = () => {
    window.location.href = "/admin";
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        .font-display { font-family: 'Fraunces', serif; }
        ::selection { background: ${C.copper}; color: ${C.carbon}; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid ${C.copper}; outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      ` }} />

      <ProductDataContext.Provider value={{ products, setProducts, finishes, setFinishes }}>
        <PublicSite onGoAdmin={goAdmin} leads={leads} setLeads={setLeads} />
      </ProductDataContext.Provider>
    </div>
  );
}

/* ============================================================
   ============  SITIO PÚBLICO  ================================
   ============================================================ */
function PublicSite({ onGoAdmin, leads, setLeads }: any) {
  const { products } = useProductData();
  const [mobileNav, setMobileNav] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null); // página de producto
  const [quotePrefill, setQuotePrefill] = useState(null);
  const savedScroll = useRef(0);

  /* Cada producto tiene su propia dirección (#persianas, #lambrin-wpc…): así el botón
     "atrás" del celular regresa al catálogo en vez de salirse del sitio, y el link
     de un producto se puede compartir por WhatsApp. */
  useEffect(() => {
    const sync = () => {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      const p = products.find((x: any) => x.id === id) || null;
      setActiveProduct(p);
      if (p) window.scrollTo(0, 0);
      else setTimeout(() => window.scrollTo(0, savedScroll.current), 0);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [products]);

  const openProduct = (p: any) => {
    savedScroll.current = window.scrollY;
    window.history.pushState({ product: p.id }, "", `#${p.id}`);
    setActiveProduct(p);
    window.scrollTo(0, 0);
  };
  const leaveProductUrl = () => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };
  const closeProduct = () => {
    if (window.history.state && window.history.state.product) { window.history.back(); return; }
    leaveProductUrl();
    setActiveProduct(null);
    setTimeout(() => window.scrollTo(0, savedScroll.current), 0);
  };

  const scrollTo = (id) => {
    setMobileNav(false);
    leaveProductUrl();
    setActiveProduct(null);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  const openQuote = (prefill) => {
    setQuotePrefill(prefill || null);
    leaveProductUrl();
    setActiveProduct(null);
    setTimeout(() => document.getElementById("cotizador")?.scrollIntoView({ behavior: "smooth" }), 30);
  };

  const addLead = (lead) => setLeads((prev) => [lead, ...prev]);

  if (activeProduct) {
    return <ProductPage product={activeProduct} onBack={closeProduct} onQuote={openQuote} />;
  }

  return (
    <div style={{ background: C.carbon, color: C.cream, minHeight: "100vh" }}>
      <PublicNav onNav={scrollTo} mobileNav={mobileNav} setMobileNav={setMobileNav} onGoAdmin={onGoAdmin} />

      <Hero onNav={scrollTo} />

      <FeaturedSection onSelect={openProduct} />

      <VisualizadorEspacioSection onSelect={openProduct} />

      <GaleriaMaterialesSection onSelect={openProduct} />

      <ProjectsStrip />

      <div id="cotizador">
        <QuoteSection prefill={quotePrefill} onSubmit={addLead} />
      </div>

      <Footer onNav={scrollTo} onGoAdmin={onGoAdmin} />

      <FloatingWhatsApp context={quotePrefill} />
    </div>
  );
}

const NAV_LINKS = [
  ["inicio", "Inicio"],
  ["materiales", "Catálogo"],
  ["proyectos", "Proyectos"],
  ["antes-despues", "Antes y después"],
  ["aplicaciones", "Lambrín en tu espacio"],
  ["cotizador", "Cotizar"],
];

function PublicNav({ onNav, mobileNav, setMobileNav, onGoAdmin }: any) {
  const links = NAV_LINKS;
  return (
    <header
      style={{ borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(10px)" }}
      className="bg-black/40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 md:px-10 py-4">
        <button onClick={() => onNav("inicio")} className="flex items-center gap-2.5">
          <img src={LOGO_HI} alt={DEMO_CONFIG.brand} className="w-8 h-8 rounded-md object-cover" />
          <span className="font-display tracking-wide text-sm md:text-base" style={{ color: C.cream, letterSpacing: "0.1em" }}>{DEMO_CONFIG.brand}</span>
        </button>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map(([id, label]) => (
            <button key={id} onClick={() => onNav(id)} className="text-sm tracking-wide" style={{ color: C.creamDim }}>
              {label}
            </button>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={buildWaLink({})}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
            style={{ background: C.copper, color: C.carbon, fontWeight: 600 }}
          >
            <MessageCircle size={16} /> Cotizar por WhatsApp
          </a>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setMobileNav((v) => !v)} style={{ color: C.cream }}>
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {mobileNav && (
        <div className="lg:hidden px-5 pb-5 flex flex-col gap-4" style={{ borderTop: `1px solid ${C.line}` }}>
          {links.map(([id, label]) => (
            <button key={id} onClick={() => onNav(id)} className="text-left text-sm py-1" style={{ color: C.creamDim }}>
              {label}
            </button>
          ))}
          <a href={buildWaLink({})} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-full mt-2" style={{ background: C.copper, color: C.carbon, fontWeight: 600 }}>
            <MessageCircle size={16} /> Cotizar por WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}

const HERO_VIDEO_CSS = `.hero-video::-webkit-media-controls,.hero-video::-webkit-media-controls-start-playback-button,.hero-video::-webkit-media-controls-overlay-play-button{display:none!important;-webkit-appearance:none}`;

/* Videos del Hero a pantalla completa, uno a la vez con transición suave.
   - Al terminar un video (o a los 12 s, por si se atora) pasa al siguiente.
   - Si el navegador bloquea el autoplay (iPhone en bajo consumo), las portadas
     siguen alternándose como presentación y el video arranca al primer toque. */
function HeroVideoBackground({ className = "absolute inset-0", children }: any) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = HERO_VIDEOS.length;
  const vids = () => Array.from(wrapRef.current?.querySelectorAll("video") || []) as HTMLVideoElement[];
  const playActive = (k: number, restart: boolean) => vids().forEach((v, i) => {
    try {
      if (i === k) { v.muted = true; if (restart) v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    } catch {}
  });
  const next = () => setActive((a) => (a + 1) % n);

  useEffect(() => {
    playActive(active, true);
    const t = setTimeout(next, 12000);
    return () => clearTimeout(t);
  }, [active]); // eslint-disable-line

  useEffect(() => {
    const once = () => { playActive(activeRef.current, false); cleanup(); };
    const evs = ["touchstart", "click", "scroll", "pointerdown"];
    const onVisible = () => { if (document.visibilityState === "visible") playActive(activeRef.current, false); };
    const cleanup = () => evs.forEach((e) => window.removeEventListener(e, once));
    evs.forEach((e) => window.addEventListener(e, once, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    return () => { cleanup(); document.removeEventListener("visibilitychange", onVisible); };
  }, []); // eslint-disable-line
  const activeRef = useRef(0);
  activeRef.current = active;

  return (
    <div ref={wrapRef} className={className}>
      <style dangerouslySetInnerHTML={{ __html: HERO_VIDEO_CSS }} />
      {HERO_VIDEOS.map((v, i) => (
        <div key={v.src} className="absolute inset-0 overflow-hidden transition-opacity duration-1000" style={{ opacity: i === active ? 1 : 0 }}>
          {/* Relleno: la portada difuminada cubre lo que sobre a los lados; el video se ve completo */}
          <div className="absolute -inset-8" style={{ backgroundImage: `url(${v.poster})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(28px) brightness(0.55)" }} />
          <video
            className="hero-video absolute inset-0 w-full h-full object-contain"
            poster={v.poster}
            muted
            playsInline
            preload={i === 0 ? "auto" : "metadata"}
            disablePictureInPicture
            onEnded={() => { if (i === active) next(); }}
          >
            {/* MP4 (iPhone, Safari, Chrome) y WebM de respaldo; si ninguno carga, se oculta
                el video y queda la foto de portada */}
            <source src={v.src} type="video/mp4" />
            <source
              src={v.src.replace(/\.mp4$/, ".webm")}
              type="video/webm"
              onError={(e: any) => { try { (e.currentTarget.parentElement as HTMLVideoElement).style.display = "none"; } catch {} }}
            />
          </video>
        </div>
      ))}
      {children}
      {/* Qué producto se ve + indicador de video (tocar cambia de video) */}
      <div className="absolute z-10 right-4 bottom-4 md:right-10 md:bottom-10 flex items-center gap-3">
        <span className="text-[11px] md:text-xs tracking-[0.18em] uppercase px-3 py-1.5 rounded-full"
          style={{ background: "rgba(15,13,11,0.45)", color: C.cream, backdropFilter: "blur(6px)" }}>
          {HERO_VIDEOS[active].label}
        </span>
        <div className="flex gap-1.5">
          {HERO_VIDEOS.map((v, i) => (
            <button key={v.src} onClick={() => setActive(i)} aria-label={`Ver video: ${v.label}`}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === active ? 22 : 8, background: i === active ? C.cream : "rgba(245,239,228,0.45)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Portada: el video es el protagonista.
   - Computadora: video a pantalla completa; el texto, compacto, abajo a la izquierda
     con una sombra suave solo detrás de él.
   - Celular: el video se ve completo (horizontal) y el texto va debajo, sin taparlo. */
function Hero({ onNav }: any) {
  return (
    <section id="inicio" className="relative overflow-hidden md:h-[min(calc(100svh-65px),56.25vw)] md:min-h-[520px]" style={{ background: C.carbon }}>
      <HeroVideoBackground className="relative w-full aspect-video md:absolute md:inset-0 md:aspect-auto">
        <div className="absolute inset-0 pointer-events-none hidden md:block"
          style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.82) 0%, rgba(15,13,11,0.45) 24%, rgba(15,13,11,0) 46%)" }} />
        <div className="absolute inset-0 pointer-events-none hidden md:block"
          style={{ background: "radial-gradient(ellipse 60% 55% at 0% 100%, rgba(15,13,11,0.55), rgba(15,13,11,0) 70%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none md:hidden"
          style={{ background: `linear-gradient(0deg, ${C.carbon}, rgba(15,13,11,0))` }} />
      </HeroVideoBackground>

      <div className="relative md:absolute md:inset-x-0 md:bottom-0 z-10 md:pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 md:px-10 pt-6 pb-12 md:pb-14 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <div className="max-w-3xl" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35), 0 2px 18px rgba(0,0,0,0.45)" }}>
            <p className="text-[11px] md:text-xs tracking-[0.3em] font-medium" style={{ color: C.cream, opacity: 0.9 }}>INTERIORISMO Y EXTERIORES · {DEMO_CONFIG.city.toUpperCase()}</p>
            <h1 className="font-display mt-3" style={{ fontSize: "clamp(2.3rem, 4.6vw, 4.2rem)", lineHeight: 1.02, color: C.cream, fontWeight: 500 }}>
              Transforma tu espacio.
            </h1>
            <p className="mt-3 text-sm md:text-base" style={{ color: C.creamDim }}>
              Suministro e instalación a la medida.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => onNav("materiales")} className="px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2" style={{ background: C.cream, color: C.carbon }}>
              Ver catálogo <ArrowRight size={16} />
            </button>
            <a href={buildWaLink({})} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2"
              style={{ border: `1px solid rgba(245,239,228,0.45)`, color: C.cream, background: "rgba(15,13,11,0.25)", backdropFilter: "blur(6px)" }}>
              <MessageCircle size={16} /> Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p, onSelect, large }: any) {
  const { finishes } = useProductData();
  const heroFinish = finishes.find((f) => f.productId === p.id);
  const photo = PRODUCT_PHOTOS[p.id];
  const bgStyle = photo
    ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" }
    : textureStyle(heroFinish);
  return (
    <button
      onClick={() => onSelect(p)}
      className="group text-left rounded-2xl overflow-hidden relative w-full"
      style={{ border: `1px solid ${C.line}`, background: C.panel }}
    >
      <div className={large ? "h-72 md:h-96 relative" : "h-64 md:h-80 relative"} style={bgStyle}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.75), transparent 55%)" }} />
        <span className="absolute top-5 left-5 text-xs tracking-[0.2em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>
          {p.code}
        </span>
      </div>
      <div className="p-7">
        <h3 className="font-display text-2xl mb-2" style={{ color: C.cream }}>{p.name}</h3>
        <p className="text-sm mb-5" style={{ color: C.creamDim }}>{p.short}</p>
        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: C.copper }}>
          Explorar <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </button>
  );
}

function FeaturedProductCard({ p, onSelect }: any) {
  const photo = PRODUCT_PHOTOS[p.id];
  const gallery = PRODUCT_GALLERY[p.id] || [];
  const photos = [photo, ...gallery].filter(Boolean);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % photos.length), 3400);
    return () => clearInterval(t);
  }, [photos.length]);
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % photos.length);
  };
  return (
    <button
      onClick={() => onSelect(p)}
      className="group text-left rounded-xl overflow-hidden relative w-full"
      style={{ border: `1px solid ${C.line}`, background: C.panel }}
    >
      <div className="h-40 sm:h-44 relative">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${p.name} ${i + 1}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === index ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.7), transparent 55%)" }} />
        {photos.length > 1 && (
          <span
            role="button"
            tabIndex={0}
            onClick={next}
            onKeyDown={(e: any) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(e); } }}
            aria-label="Siguiente foto"
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
            style={{ background: "rgba(15,13,11,0.6)" }}
          >
            <ChevronRight size={14} color={C.cream} />
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base mb-1" style={{ color: C.cream }}>{p.name}</h3>
        <p className="text-xs line-clamp-2" style={{ color: C.creamDim }}>{p.short}</p>
      </div>
    </button>
  );
}

function FeaturedSection({ onSelect }: any) {
  const { products } = useProductData();
  const featured = products.filter((p) => p.featured);
  return (
    <section id="materiales" className="max-w-7xl mx-auto px-5 md:px-10 pt-20 md:pt-28 pb-6">
      <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>CATÁLOGO</p>
      <h2 className="font-display mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>
        Elige lo que tu espacio necesita.
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {featured.map((p) => <FeaturedProductCard key={p.id} p={p} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

/* ---------- Visualízalo en tu espacio (fotos reales por acabado de Lambrín WPC) ---------- */
function VisualizadorEspacioSection({ onSelect }: any) {
  const { finishes: allFinishes, products } = useProductData();
  const lambrin = products.find((p: any) => p.id === "lambrin-wpc");
  const wpcFinishes = allFinishes.filter((f) => f.productId === "lambrin-wpc" && WPC_SALA_PHOTOS[f.id]);
  const [finishId, setFinishId] = useState(wpcFinishes[0]?.id || "");
  const finish = wpcFinishes.find((f) => f.id === finishId) || wpcFinishes[0];
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!finish) return null;

  return (
    <section id="aplicaciones" className="max-w-7xl mx-auto px-5 md:px-10 py-24 md:py-32">
      <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>VISUALÍZALO EN TU ESPACIO</p>
      <h2 className="font-display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>
        La misma sala, en cada color de Lambrín WPC.
      </h2>
      <p className="max-w-lg mb-12 text-sm md:text-base" style={{ color: C.creamDim }}>
        Elige un acabado y mira cómo cambia el espacio — fotografía real, no una simulación.
      </p>

      <div className="grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={() => setLightbox(WPC_SALA_PHOTOS[finish.id])}
            className="relative rounded-2xl overflow-hidden w-full text-left block"
            style={{ border: `1px solid ${C.line}`, aspectRatio: "4/3", cursor: "zoom-in" }}
          >
            <div className="absolute inset-0" style={{ backgroundImage: `url(${WPC_SALA_PHOTOS[finish.id]})`, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 0.4s ease" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.35), transparent 40%)" }} />
            <span className="absolute bottom-4 left-4 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>
              {finish.name}
            </span>
          </button>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-8">
          <div>
            <p className="text-xs tracking-[0.2em] mb-3" style={{ color: C.creamDim, opacity: 0.7 }}>ACABADO — Lambrín WPC</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-3">
              {wpcFinishes.map((f) => (
                <button key={f.id} onClick={() => setFinishId(f.id)} className="text-left">
                  <div className="w-full aspect-square rounded-lg mb-1.5 relative" style={{ ...textureStyle(f), outline: f.id === finishId ? `2px solid ${C.copper}` : `1px solid ${C.line}`, outlineOffset: "2px" }}>
                    {f.id === finishId && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-full p-1" style={{ background: C.copper }}>
                        <Check size={10} color={C.carbon} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: C.cream }}>{f.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            {lambrin && (
              <button
                onClick={() => onSelect(lambrin)}
                className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold"
                style={{ background: C.copper, color: C.carbon }}
              >
                Ver trabajos de Lambrín WPC
              </button>
            )}
            <a
              href={buildWaLink({ product: "Lambrín WPC", finish: finish.name, space: "Sala" })}
              target="_blank" rel="noopener noreferrer"
              className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
              style={{ border: `1px solid ${C.lineStrong}`, color: C.cream }}
            >
              <MessageCircle size={16} /> Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>
      {lightbox && <PhotoLightbox items={[{ src: lightbox, group: `Lambrín WPC — ${finish.name}` }]} index={0} onIndex={() => {}} onClose={() => setLightbox(null)} />}
    </section>
  );
}

/* ---------- Configurador (homepage) ---------- */
/* ---------- Galería rápida (una foto por material, sin selector de color) ---------- */
function GaleriaMaterialesSection({ onSelect }: any) {
  const { products } = useProductData();
  const [cat, setCat] = useState("todos");

  const cats = [
    { id: "todos", label: "Todos" },
    { id: "lambrin", label: "Lambrín y Paneles", productId: "lambrin-wpc" },
    { id: "marmol", label: "Mármol Sintético", productId: "marmol-sintetico" },
    { id: "pasto", label: "Pasto Sintético", productId: "pasto-sintetico" },
    { id: "persianas", label: "Persianas y Cortinas", productId: "persianas" },
    { id: "malla", label: "Malla y Toldos", productId: "malla-toldos" },
    { id: "muro-verde", label: "Muro Verde", productId: "muro-verde" },
  ];

  const shots = [
    { cat: "lambrin", photo: PROY_LAMBRIN_RECEPCION, title: "Muro de alberca en WPC exterior", place: "WPC exterior" },
    { cat: "lambrin", photo: WPC_TV_LISTONES, title: "Muro de TV con mueble a medida", place: "Lambrín WPC" },
    { cat: "lambrin", photo: PROY_LAMBRIN_PUERTA, title: "Vigas giratorias", place: "Paneles Decorativos" },
    { cat: "lambrin", photo: PROY_LAMBRIN_ALBERCA, title: "Muro con barra de mármol", place: "Lambrín WPC" },
    { cat: "marmol", photo: PROY_MARMOL_ORO, title: "Muro con veta dorada y repisas", place: "Mármol Sintético" },
    { cat: "marmol", photo: PROY_MARMOL_NEGRO, title: "Área de espera — mármol negro", place: "Mármol Sintético" },
    { cat: "marmol", photo: PROY_MARMOL_COMEDOR, title: "Comedor — mármol con lambrín", place: "Mármol + Lambrín" },
    { cat: "pasto", photo: PROY_PASTO_ANDADOR, title: "Andador con iluminación de piso", place: "Pasto Sintético" },
    { cat: "pasto", photo: PROY_PASTO_COLUMPIO, title: "Área de juegos", place: "Pasto Sintético" },
    { cat: "persianas", photo: PERSIANA_SHEER_MAR, title: "Terraza con vista al mar", place: "Persiana Sheer" },
    { cat: "persianas", photo: PERSIANA_ZEBRA_AZUL, title: "Salón — Sheer Elegance azul", place: "Sheer Elegance" },
    { cat: "persianas", photo: PERSIANA_ZEBRA_NEGRA, title: "Recámara — Sheer Elegance negra", place: "Sheer Elegance" },
    { cat: "persianas", photo: PERSIANA_ZEBRA_TAUPE, title: "Recámara esquinera — Sheer Elegance", place: "Sheer Elegance" },
    { cat: "persianas", photo: PERSIANA_SCREEN_EXT, title: "Terraza exterior — screen", place: "Persiana Screen" },
    { cat: "malla", photo: PROY_MALLA_DELFINARIO, title: "Delfinario — vela de sombra sobre alberca", place: "Malla Sombra" },
    { cat: "lambrin", photo: PROY_LAMBRIN_PLAYA, title: "Casa de playa — celosía frente al mar", place: "Lambrín WPC exterior" },
    { cat: "muro-verde", photo: PROY_MURO_VERDE_LOCAL, title: "Fachada de local — muro verde con flor", place: "Muro Verde" },
    { cat: "muro-verde", photo: PROY_MURO_VERDE_FUENTE, title: "Patio con fuente y muro verde", place: "Muro Verde" },
    { cat: "muro-verde", photo: PH_MURO_VERDE_TECHO_RESTAURANTE, title: "Plafón de restaurante con muro verde y lámparas colgantes", place: "Muro Verde" },
    { cat: "muro-verde", photo: PH_MURO_VERDE_ALTAR, title: "Nicho decorativo con muro verde", place: "Muro Verde" },
    { cat: "muro-verde", photo: PH_MURO_VERDE_MURAL_ALBERCA, title: "Alberca con mural y muro verde", place: "Muro Verde" },
  ];

  const filtered = cat === "todos" ? shots : shots.filter((s) => s.cat === cat);
  const [lb, setLb] = useState<number | null>(null);
  const items = filtered.map((sh) => ({ src: sh.photo, group: sh.place, caption: sh.title }));
  const linkedProduct = products.find((p) => p.id === (cats.find((c) => c.id === cat) || {}).productId);
  const pick = (id: string) => { setCat(id); setLb(null); };

  return (
    <section id="proyectos" className="py-24 md:py-32" style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>NUESTROS TRABAJOS</p>
        <h2 className="font-display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>
          Proyectos reales, instalados por nosotros.
        </h2>
        <p className="max-w-lg mb-10 text-sm md:text-base" style={{ color: C.creamDim }}>
          Casas, oficinas y negocios de la zona. Toca cualquier foto para verla en grande.
        </p>

        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap">
          {cats.map((c) => (
            <button key={c.id} onClick={() => pick(c.id)} className="text-xs px-4 py-2 rounded-full font-semibold whitespace-nowrap shrink-0"
              style={{ background: cat === c.id ? C.cream : "transparent", color: cat === c.id ? C.carbon : C.creamDim, border: `1px solid ${cat === c.id ? C.cream : C.lineStrong}` }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((sh, k) => (
            <button key={sh.photo} type="button" onClick={() => setLb(k)}
              className="group relative rounded-xl overflow-hidden text-left cursor-zoom-in"
              style={{ aspectRatio: "4/3", border: `1px solid ${C.line}`, background: C.carbon }}>
              <img src={sh.photo} alt={sh.title} loading="lazy" decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.85), rgba(15,13,11,0) 55%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <p className="text-[10px] tracking-[0.18em] mb-0.5" style={{ color: C.copper }}>{sh.place.toUpperCase()}</p>
                <p className="text-xs md:text-sm leading-snug line-clamp-2" style={{ color: C.cream }}>{sh.title}</p>
              </div>
            </button>
          ))}
        </div>

        {linkedProduct && (
          <div className="mt-8">
            <button onClick={() => onSelect(linkedProduct)} className="px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2"
              style={{ background: C.copper, color: C.carbon }}>
              Ver todo {linkedProduct.name} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
      {lb !== null && <PhotoLightbox items={items} index={lb} onIndex={setLb} onClose={() => setLb(null)} groupNoun="material" />}
    </section>
  );
}


function ConfiguradorSection({ onQuote }: any) {
  return (
    <section id="configurador" className="py-24 md:py-32" style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>EL CONFIGURADOR</p>
        <h2 className="font-display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>
          Encuentra el acabado que imaginas.
        </h2>
        <p className="max-w-lg mb-14 text-sm md:text-base" style={{ color: C.creamDim }}>
          Combina material, acabado y espacio como si tuvieras el muestrario físico frente a ti.
        </p>
        <Configurador onQuote={onQuote} />
      </div>
    </section>
  );
}

function Configurador({ lockProduct, onQuote }: any) {
  const { products: allProducts, finishes: allFinishes } = useProductData();
  // Lambrín WPC ya tiene su propio visualizador dedicado arriba ("Visualízalo en tu espacio"),
  // así que en el listado libre (sin lockProduct) no se muestra ahí — pero si esta instancia
  // viene "fija" a un producto específico (ej. desde la página del propio producto), se respeta.
  const products = lockProduct ? allProducts.filter((p) => !p.simple) : allProducts.filter((p) => !p.simple && p.id !== "lambrin-wpc");
  const [productId, setProductId] = useState(lockProduct ? lockProduct.id : (products[0]?.id || ""));
  const activeFinishes = allFinishes.filter((f) => f.productId === productId);
  const [finishId, setFinishId] = useState(activeFinishes[0]?.id || "");
  const finish = activeFinishes.find((f) => f.id === finishId) || activeFinishes[0];
  const [mode, setMode] = useState("vista"); // 'vista' | 'antes-despues'
  const [lightbox, setLightbox] = useState<string | null>(null);
  const product = products.find((p) => p.id === productId);

  const handleProductChange = (pid) => {
    setProductId(pid);
    const first = allFinishes.find((f) => f.productId === pid);
    setFinishId(first ? first.id : "");
  };

  if (!product) {
    return <p className="text-sm" style={{ color: C.creamDim }}>Aún no hay productos con acabados configurados.</p>;
  }
  if (!finish) {
    return <p className="text-sm" style={{ color: C.creamDim }}>{product.name} todavía no tiene acabados agregados — ve a Productos en el admin para agregar alguno.</p>;
  }

  return (
    <div className="grid lg:grid-cols-5 gap-10">
      {/* Visual — muestra real del acabado seleccionado */}
      <div className="lg:col-span-3">
        <button
          type="button"
          onClick={() => finish.photo && setLightbox(finish.photo)}
          className="relative rounded-2xl overflow-hidden w-full text-left block"
          style={{ border: `1px solid ${C.line}`, aspectRatio: "4/3", background: C.carbon, cursor: finish.photo ? "zoom-in" : "default" }}
        >
          {finish.photo ? (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${finish.photo})`, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 0.3s ease" }} />
          ) : (
            <div className="absolute inset-0" style={{ ...textureStyle(finish), transition: "background 0.3s ease" }} />
          )}
          <span className="absolute bottom-4 left-4 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>
            {finish.name}
          </span>
        </button>
      </div>

      {/* Controles */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        {!lockProduct && (
          <div>
            <p className="text-xs tracking-[0.2em] mb-3" style={{ color: C.creamDim, opacity: 0.7 }}>MATERIAL</p>
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button key={p.id} onClick={() => handleProductChange(p.id)} className="text-xs px-3.5 py-2 rounded-full" style={{ background: p.id === productId ? C.cream : "transparent", color: p.id === productId ? C.carbon : C.creamDim, border: `1px solid ${p.id === productId ? C.cream : C.lineStrong}`, fontWeight: 600 }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs tracking-[0.2em] mb-3" style={{ color: C.creamDim, opacity: 0.7 }}>ACABADO — {product.name}</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-3">
            {activeFinishes.map((f) => (
              <button key={f.id} onClick={() => setFinishId(f.id)} className="text-left">
                <div className="w-full aspect-square rounded-lg mb-1.5 relative overflow-hidden" style={{ ...(f.photo ? {} : textureStyle(f)), backgroundImage: f.photo ? `url(${f.photo})` : undefined, backgroundSize: "cover", backgroundPosition: "center", outline: f.id === finishId ? `2px solid ${C.copper}` : `1px solid ${C.line}`, outlineOffset: "2px" }}>
                  {f.id === finishId && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-full p-1" style={{ background: C.copper }}>
                      <Check size={10} color={C.carbon} />
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: C.cream }}>{f.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => onQuote({ product: product.name, finish: finish.name })}
            className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold"
            style={{ background: C.copper, color: C.carbon }}
          >
            Cotizar este acabado
          </button>
          <a
            href={buildWaLink({ product: product.name, finish: finish.name })}
            target="_blank" rel="noopener noreferrer"
            className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
            style={{ border: `1px solid ${C.lineStrong}`, color: C.cream }}
          >
            <MessageCircle size={16} /> Cotizar por WhatsApp
          </a>
        </div>
      </div>
      {lightbox && <PhotoLightbox items={[{ src: lightbox, group: finish.name }]} index={0} onIndex={() => {}} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function RoomVisualizer({ finish, space }: any) {
  const realPhoto = space.id === "sala" ? WPC_SALA_PHOTOS[finish.id] : null;
  const photo = ROOM_PHOTOS[space.id];
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, aspectRatio: "4/3" }}>
      {realPhoto ? (
        <>
          {/* fotografía real de la sala renderizada con este acabado exacto — sin tinte */}
          <div className="absolute inset-0" style={{ backgroundImage: `url(${realPhoto})`, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 0.4s ease" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.35), transparent 40%)" }} />
        </>
      ) : photo ? (
        <>
          {/* fotografía real del espacio */}
          <div className="absolute inset-0" style={{ backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 0.4s ease" }} />
          {/* tinte del acabado seleccionado, sobre el muro */}
          <div className="absolute inset-0" style={{ ...tintStyle(finish), opacity: 0.45, mixBlendMode: "multiply", transition: "background-color 0.4s ease" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.35), transparent 40%)" }} />
        </>
      ) : (
        <>
          {/* muro con textura (sin foto de referencia para este espacio) */}
          <div className="absolute inset-0" style={{ ...textureStyle(finish), transition: "background 0.4s ease" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(15,13,11,0.4), transparent 45%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-[22%]" style={{ background: `linear-gradient(0deg, ${C.carbon}, transparent)` }} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-90" style={{ color: "rgba(15,13,11,0.55)" }}>
            {roomIcon(space.icon, { size: 84, strokeWidth: 1 })}
          </div>
        </>
      )}
      <span className="absolute top-5 left-5 text-xs tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>
        {space.name.toUpperCase()}
      </span>
      <span className="absolute top-5 right-5 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>
        {finish.index}
      </span>
      {!photo && !realPhoto && (
        <span className="absolute bottom-5 left-5 text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.5)", color: C.creamDim, opacity: 0.8 }}>
          Vista ilustrativa — pendiente fotografía real
        </span>
      )}
    </div>
  );
}

function BeforeAfterSlider({ finish }: any) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onDown = (e) => { dragging.current = true; update(e.clientX ?? e.touches?.[0]?.clientX); };
  const onMove = (e) => { if (dragging.current) update(e.clientX ?? e.touches?.[0]?.clientX); };
  const onUp = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      className="relative rounded-2xl overflow-hidden select-none touch-none"
      style={{ border: `1px solid ${C.line}`, aspectRatio: "4/3", cursor: "ew-resize" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
    >
      {/* AFTER (full) */}
      <div className="absolute inset-0" style={textureStyle(finish)} />
      <span className="absolute bottom-5 right-5 text-xs tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>DESPUÉS</span>
      {/* BEFORE (clipped) */}
      <div className="absolute inset-0" style={{ width: `${pos}%`, overflow: "hidden" }}>
        <div className="absolute inset-y-0 left-0" style={{ width: ref.current?.getBoundingClientRect().width || "100vw", background: `linear-gradient(160deg, ${C.creamDim}, ${C.beige})` }} />
        <span className="absolute bottom-5 left-5 text-xs tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>ANTES</span>
      </div>
      {/* handle */}
      <div className="absolute inset-y-0" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-px" style={{ background: C.cream }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.cream }}>
          <MoveHorizontal size={16} color={C.carbon} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Antes/Después con fotografía real (caso real del cliente) ---------- */
function PhotoBeforeAfter({ before, after, beforeLabel = "ANTES", afterLabel = "DESPUÉS" }: any) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onDown = (e) => { dragging.current = true; update(e.clientX ?? e.touches?.[0]?.clientX); };
  const onMove = (e) => { if (dragging.current) update(e.clientX ?? e.touches?.[0]?.clientX); };
  const onUp = () => { dragging.current = false; };

  return (
    <div
      ref={ref}
      className="relative rounded-2xl overflow-hidden select-none touch-none"
      style={{ border: `1px solid ${C.line}`, aspectRatio: "1/1", cursor: "ew-resize" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
    >
      <div className="absolute inset-0" style={{ backgroundImage: `url(${after})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <span className="absolute bottom-5 right-5 text-xs tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>{afterLabel}</span>
      <div className="absolute inset-0" style={{ width: `${pos}%`, overflow: "hidden" }}>
        <div className="absolute inset-y-0 left-0" style={{ width: ref.current?.getBoundingClientRect().width || "100vw", backgroundImage: `url(${before})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <span className="absolute bottom-5 left-5 text-xs tracking-[0.15em] px-3 py-1 rounded-full" style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}>{beforeLabel}</span>
      </div>
      <div className="absolute inset-y-0" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-px" style={{ background: C.cream }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.cream }}>
          <MoveHorizontal size={16} color={C.carbon} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Categoría simple (persianas, pasto, palapa) — sin selector de acabados ---------- */
/* ---------- Carrusel automático de fotos de trabajos reales ---------- */
function AutoPhotoCarousel({ photos, alt, onExpand }: any) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!photos || photos.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 3200);
    return () => clearInterval(t);
  }, [photos]);
  if (!photos || photos.length === 0) return null;
  return (
    <div
      className="relative w-full h-full"
      style={{ cursor: onExpand ? "zoom-in" : "default" }}
      onClick={() => onExpand && onExpand(photos[index])}
    >
      {photos.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
            loading="lazy"
            decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
          {photos.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                background: i === index ? C.copper : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Agrupa las fotos de una galería por "modelo" — usa el texto antes del
   guión largo (—) como clave (ej. "Sheer Elegance — pasillo azul marino"
   y "Sheer Elegance — instalación" caen en el mismo grupo "Sheer Elegance").
   Nombres sin guión forman su propio grupo con una sola foto. */
function groupGalleryByModel(gallery: any[], names: string[], models: string[] = []) {
  const groups: any[] = [];
  const index: Record<string, number> = {};
  gallery.forEach((photo, i) => {
    const fullName = names[i] || "";
    const key = (models[i] || "").trim() || fullName.split(" — ")[0].trim() || fullName || "Trabajos";
    if (index[key] === undefined) {
      index[key] = groups.length;
      groups.push({ key, photos: [photo], captions: [fullName] });
    } else {
      groups[index[key]].photos.push(photo);
      groups[index[key]].captions.push(fullName);
    }
  });
  return groups;
}

function ModelGroupCard({ group, onExpand }: any) {
  const [i, setI] = useState(0);
  const multi = group.photos.length > 1;
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden"
        style={{ background: C.panel }}
        onClick={() => onExpand(group.photos[i])}
      >
        <img src={group.photos[i]} alt={group.captions[i] || group.key} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        {multi && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setI((p) => (p - 1 + group.photos.length) % group.photos.length); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, background: "rgba(15,13,11,0.6)", color: C.cream }}
              aria-label="Anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setI((p) => (p + 1) % group.photos.length); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
              style={{ width: 32, height: 32, background: "rgba(15,13,11,0.6)", color: C.cream }}
              aria-label="Siguiente"
            >
              <ChevronRight size={14} />
            </button>
            <span
              className="absolute top-1.5 right-1.5 text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(15,13,11,0.55)", color: C.cream }}
            >
              {i + 1}/{group.photos.length}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-xs truncate" style={{ color: C.cream }}>{group.key}</p>
        {multi && <p className="text-[10px] shrink-0" style={{ color: C.creamDim, opacity: 0.7 }}>{group.photos.length} fotos</p>}
      </div>
    </div>
  );
}

/* Visor de fotos a pantalla completa.
   items: [{ src, group?, caption? }] — "group" es el modelo (ej. "Sheer Elegance").
   Flechas/teclado/deslizar: foto anterior/siguiente. "Siguiente modelo": salta al
   primer foto del siguiente grupo, para brincar entre modelos del mismo producto. */
function PhotoLightbox({ items, index, onIndex, onClose, groupNoun = "modelo" }: any) {
  const list = (items || []).filter((it: any) => it && it.src);
  const n = list.length;
  const i = Math.max(0, Math.min(index || 0, n - 1));
  const cur = list[i];
  const touchX = useRef<number | null>(null);

  const go = useCallback((d: number) => { if (n > 1) onIndex((i + d + n) % n); }, [i, n, onIndex]);

  const groups: string[] = [];
  list.forEach((it: any) => { if (it.group && !groups.includes(it.group)) groups.push(it.group); });
  const gi = cur?.group ? groups.indexOf(cur.group) : -1;
  const goGroup = (d: number) => {
    if (groups.length < 2) return;
    const target = groups[(gi + d + groups.length) % groups.length];
    const k = list.findIndex((it: any) => it.group === target);
    if (k >= 0) onIndex(k);
  };
  const inGroup = cur?.group ? list.filter((it: any) => it.group === cur.group) : [];
  const posInGroup = cur?.group ? inGroup.indexOf(cur) + 1 : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [go, onClose]);

  // precarga la foto anterior y la siguiente para que el cambio sea inmediato
  useEffect(() => {
    if (n < 2) return;
    [list[(i + 1) % n], list[(i - 1 + n) % n]].forEach((it: any) => { const im = new Image(); im.src = it.src; });
  }, [i, n]); // eslint-disable-line

  if (!cur) return null;
  const navBtn = "rounded-full flex items-center justify-center transition-colors";
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "#0A0908" }}
      role="dialog"
      aria-modal="true"
      aria-label="Foto ampliada"
      onClick={onClose}
      onTouchStart={(e: any) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e: any) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          {cur.group && <p className="text-[11px] tracking-[0.2em] truncate" style={{ color: C.copper }}>{cur.group.toUpperCase()}{inGroup.length > 1 ? ` · ${posInGroup}/${inGroup.length}` : ""}</p>}
          {cur.caption && cur.caption !== cur.group && <p className="text-sm truncate" style={{ color: C.creamDim }}>{cur.caption}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {n > 1 && <span className="text-xs tabular-nums" style={{ color: C.creamDim }}>{i + 1} / {n}</span>}
          <button onClick={onClose} className={navBtn} style={{ width: 40, height: 40, background: "rgba(255,255,255,0.1)", color: C.cream }} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 md:px-20">
        <img
          key={cur.src}
          src={cur.src}
          alt={cur.caption || cur.group || "Foto"}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full rounded-lg object-contain select-none"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          draggable={false}
        />
        {n > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} className={`${navBtn} absolute left-2 md:left-5 top-1/2 -translate-y-1/2`}
              style={{ width: 46, height: 46, background: "rgba(15,13,11,0.7)", border: `1px solid ${C.lineStrong}`, color: C.cream }} aria-label="Foto anterior">
              <ChevronLeft size={22} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} className={`${navBtn} absolute right-2 md:right-5 top-1/2 -translate-y-1/2`}
              style={{ width: 46, height: 46, background: "rgba(15,13,11,0.7)", border: `1px solid ${C.lineStrong}`, color: C.cream }} aria-label="Foto siguiente">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {groups.length > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => goGroup(-1)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full"
            style={{ border: `1px solid ${C.lineStrong}`, color: C.cream }}>
            <ChevronLeft size={14} /> {groupNoun === "modelo" ? "Modelo anterior" : "Anterior"}
          </button>
          <span className="text-xs hidden sm:inline" style={{ color: C.creamDim }}>{groupNoun === "modelo" ? "Modelo" : "Material"} {gi + 1} de {groups.length}</span>
          <button onClick={() => goGroup(1)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full"
            style={{ background: C.copper, color: C.carbon }}>
            {groupNoun === "modelo" ? "Siguiente modelo" : "Siguiente material"} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* Convierte la galería de un producto (agrupada por modelo) en la lista plana
   que recorre el visor — portada incluida si no está ya en la galería. */
function productLightboxItems(product: any) {
  const cover = PRODUCT_PHOTOS[product.id];
  const groups = groupGalleryByModel(PRODUCT_GALLERY[product.id] || [], NAMED_GALLERY[product.id] || [], MODEL_GALLERY[product.id] || []);
  const items: any[] = [];
  groups.forEach((g: any) => g.photos.forEach((src: string, j: number) => items.push({ src, group: g.key || product.name, caption: g.captions[j] })));
  if (cover && !items.some((it) => it.src === cover)) items.unshift({ src: cover, group: product.name });
  return items;
}

function ProductPage({ product, onBack, onQuote }: any) {
  const items = useMemo(() => productLightboxItems(product), [product]);
  const cover = PRODUCT_PHOTOS[product.id];
  const carouselPhotos = Array.from(new Set([cover, ...items.map((it: any) => it.src)].filter(Boolean)));
  const groups = groupGalleryByModel(PRODUCT_GALLERY[product.id] || [], NAMED_GALLERY[product.id] || [], MODEL_GALLERY[product.id] || []);
  const [lb, setLb] = useState<number | null>(null);
  const openBySrc = (src: string) => { const k = items.findIndex((it: any) => it.src === src); setLb(k >= 0 ? k : 0); };
  return (
    <div style={{ background: C.carbon, color: C.cream, minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${C.line}` }} className="sticky top-0 z-40 backdrop-blur bg-black/40">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm" style={{ color: C.creamDim }}>
            <ChevronLeft size={16} /> Catálogo
          </button>
          <span className="font-display text-sm tracking-widest">{DEMO_CONFIG.brand}</span>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pt-14 pb-10">
        <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>TRABAJOS REALES · {DEMO_CONFIG.city.toUpperCase()}</p>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 500 }}>{product.name}</h1>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-10 pb-16">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}`, aspectRatio: "4/3", background: C.panel }}>
            {carouselPhotos.length > 0 && <AutoPhotoCarousel photos={carouselPhotos} alt={product.name} onExpand={openBySrc} />}
          </div>
          <div className="lg:col-span-2 flex flex-col justify-center gap-6">
            {formatPrice(product) && (
              <div>
                <p className="font-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", color: C.cream }}>{formatPrice(product)}</p>
                <p className="text-xs mt-1" style={{ color: C.creamDim, opacity: 0.7 }}>Precio de referencia. El total depende de las medidas y la instalación.</p>
              </div>
            )}
            {product.description && (
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-line" style={{ color: C.creamDim }}>{product.description}</p>
            )}
            <p className="text-sm" style={{ color: C.creamDim }}>
              Cuéntanos las medidas de tu espacio y te cotizamos por WhatsApp.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onQuote({ product: product.name })}
                className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold"
                style={{ background: C.copper, color: C.carbon }}
              >
                Cotizar {product.name.toLowerCase()}
              </button>
              <a
                href={buildWaLink({ product: product.name })}
                target="_blank" rel="noopener noreferrer"
                className="w-full text-center px-5 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
                style={{ border: `1px solid ${C.lineStrong}`, color: C.cream }}
              >
                <MessageCircle size={16} /> Cotizar por WhatsApp
              </a>
              {items.length > 1 && (
                <button onClick={() => setLb(0)} className="w-full text-center px-5 py-3 rounded-full text-sm flex items-center justify-center gap-2"
                  style={{ color: C.creamDim }}>
                  Ver las {items.length} fotos en grande <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {groups.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 md:px-10 pb-28">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 mb-6">
            <p className="text-xs tracking-[0.3em]" style={{ color: C.copper }}>MODELOS — {product.name.toUpperCase()}</p>
            <p className="text-xs" style={{ color: C.creamDim, opacity: 0.7 }}>{groups.length} {groups.length === 1 ? "modelo" : "modelos"} · toca para ampliar</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {groups.map((group: any, i: number) => (
              <ModelGroupCard key={i} group={group} onExpand={openBySrc} />
            ))}
          </div>
        </section>
      )}
      {lb !== null && <PhotoLightbox items={items} index={lb} onIndex={setLb} onClose={() => setLb(null)} />}
    </div>
  );
}

function ProjectsStrip() {
  return (
    <section id="antes-despues" className="py-24 md:py-32" style={{ background: C.panel, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>ANTES Y DESPUÉS</p>
        <h2 className="font-display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>
          De obra gris a terminado.
        </h2>
        <p className="max-w-lg mb-10 text-sm md:text-base" style={{ color: C.creamDim }}>
          Arrastra el control para comparar el muro antes y después de instalar el pasto sintético y el muro verde.
        </p>
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <PhotoBeforeAfter before={PH_BEFORE_TV} after={PH_AFTER_TV} />
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs mb-2" style={{ color: C.creamDim, opacity: 0.6 }}>CASO REAL</p>
            <p className="font-display text-2xl mb-3" style={{ color: C.cream }}>Pasto Sintético — muro verde</p>
            <p className="text-sm mb-6" style={{ color: C.creamDim }}>
              Del muro en obra gris al acabado terminado: pasto sintético, lambrín de madera y piedra laja, con iluminación integrada.
            </p>
            <a
              href={buildWaLink({ product: "Pasto Sintético", space: "Muro" })}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full"
              style={{ background: C.copper, color: C.carbon }}
            >
              <MessageCircle size={15} /> Quiero algo así
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuoteSection({ prefill, onSubmit }: any) {
  const { products } = useProductData();
  const [form, setForm] = useState({
    name: "", whatsapp: "", space: prefill?.space || "", product: prefill?.product || "",
    finish: prefill?.finish || "", largo: "", alto: "", message: "",
  });
  const [sent, setSent] = useState(false);
  React.useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, space: prefill.space || f.space, product: prefill.product || f.product, finish: prefill.finish || f.finish }));
  }, [prefill]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const waLink = buildWaLink({ ...form });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Abrir WhatsApp de inmediato (antes de cualquier await) para que Safari/iOS no lo bloquee como ventana emergente
    try { window.open(waLink, "_blank"); } catch {}
    onSubmit({
      id: "L-" + Math.floor(1000 + Math.random() * 9000),
      name: form.name || "Prospecto sin nombre",
      whatsapp: form.whatsapp,
      product: form.product,
      finish: form.finish,
      space: form.space,
      medidas: form.largo && form.alto ? `${form.largo} x ${form.alto} m` : "—",
      status: "Nuevo",
      date: new Date().toISOString().slice(0, 10),
      origen: "Sitio web",
    });
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: insertError } = await supabase.from("leads").insert({
        name: form.name || "Prospecto sin nombre",
        whatsapp: form.whatsapp,
        product: form.product,
        finish: form.finish,
        space: form.space,
        medidas: form.largo && form.alto ? `${form.largo} x ${form.alto} m` : null,
        message: form.message || null,
        status: "Nuevo",
        origen: "Sitio web",
      });
      if (insertError) console.warn("No se pudo registrar la cotización (se envió por WhatsApp).");
    } catch {
      console.warn("No se pudo registrar la cotización (se envió por WhatsApp).");
    }
    setSent(true);
  };

  return (
    <section className="max-w-4xl mx-auto px-5 md:px-10 py-24 md:py-32">
      <p className="text-xs tracking-[0.3em] mb-4" style={{ color: C.copper }}>COTIZADOR</p>
      <h2 className="font-display mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: C.cream, fontWeight: 500 }}>Cotiza tu proyecto.</h2>
      <p className="mb-12 text-sm md:text-base" style={{ color: C.creamDim }}>Cuéntanos sobre tu espacio y te contactamos por WhatsApp con una propuesta.</p>

      {sent ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: `1px solid ${C.lineStrong}` }}>
          <Check size={28} style={{ color: C.copper }} className="mx-auto mb-4" />
          <h3 className="font-display text-2xl mb-2">Solicitud enviada</h3>
          <p className="text-sm" style={{ color: C.creamDim }}>Abrimos WhatsApp con tu mensaje. Si no se abrió automáticamente, usa el botón flotante.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
          <Field label="Nombre"><input required value={form.name} onChange={set("name")} className="qi" /></Field>
          <Field label="WhatsApp"><input required value={form.whatsapp} onChange={set("whatsapp")} type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="10 dígitos, sin espacios ni guiones" placeholder="10 dígitos" className="qi" /></Field>
          <Field label="Tipo de espacio">
            <select value={form.space} onChange={set("space")} className="qi">
              <option value="">Selecciona</option>
              {DEMO_DATA.applications.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Producto">
            <select value={form.product} onChange={set("product")} className="qi">
              <option value="">Selecciona</option>
              {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Acabado (opcional)"><input value={form.finish} onChange={set("finish")} className="qi" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Largo (m)"><input value={form.largo} onChange={set("largo")} className="qi" /></Field>
            <Field label="Alto (m)"><input value={form.alto} onChange={set("alto")} className="qi" /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Mensaje (opcional)"><textarea value={form.message} onChange={set("message")} rows={3} className="qi" /></Field>
          </div>
          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 mt-2">
            <button type="submit" className="flex-1 px-5 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2" style={{ background: C.copper, color: C.carbon }}>
              <MessageCircle size={16} /> Cotizar por WhatsApp
            </button>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `.qi { width:100%; background:${C.panel2}; border:1px solid ${C.line}; border-radius:10px; padding:12px 14px; color:${C.cream}; font-size:14px; } .qi:focus { outline:2px solid ${C.copper}; }` }} />
        </form>
      )}
    </section>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="block text-xs mb-2" style={{ color: "rgba(246,241,231,0.6)" }}>{label}</span>
      {children}
    </label>
  );
}

function Footer({ onNav, onGoAdmin }: any) {
  return (
    <footer className="px-5 md:px-10 py-16" style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        <div>
          <p className="font-display tracking-widest text-lg mb-3">{DEMO_CONFIG.brand}</p>
          <p className="text-sm max-w-xs" style={{ color: C.creamDim, opacity: 0.7 }}>Revestimientos, persianas y soluciones de exterior, con instalación. {DEMO_CONFIG.city}.</p>
        </div>
        <div className="flex gap-14 flex-wrap">
          <div>
            <p className="text-xs tracking-[0.2em] mb-3" style={{ color: C.creamDim, opacity: 0.5 }}>NAVEGACIÓN</p>
            {NAV_LINKS.filter(([id]) => id !== "inicio").map(([id, label]) => (
              <button key={id} onClick={() => onNav(id)} className="block text-sm py-1 text-left" style={{ color: C.creamDim }}>{label}</button>
            ))}
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] mb-3" style={{ color: C.creamDim, opacity: 0.5 }}>CONTACTO</p>
            <a href={buildWaLink({})} target="_blank" rel="noopener noreferrer" className="block text-sm py-1" style={{ color: C.creamDim }}>WhatsApp</a>
            <a href={DEMO_CONFIG.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm py-1 flex items-center gap-2" style={{ color: C.creamDim }}><Facebook size={14} /> Facebook</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-14 pt-6 flex justify-between items-center flex-wrap gap-3" style={{ borderTop: `1px solid ${C.line}` }}>
        <p className="text-xs" style={{ color: C.creamDim, opacity: 0.4 }}>© 2026 {DEMO_CONFIG.brand}</p>
        <a href="/admin" rel="nofollow" className="text-xs" style={{ color: C.creamDim, opacity: 0.4 }}>Acceso personal</a>
      </div>
    </footer>
  );
}

function FloatingWhatsApp({ context }: any) {
  return (
    <a
      href={buildWaLink(context || {})}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg lg:hidden"
      style={{ background: C.copper }}
    >
      <MessageCircle size={24} color={C.carbon} />
    </a>
  );
}

/* ============================================================
   ============  PANEL ADMINISTRATIVO  =========================
   ============================================================ */
