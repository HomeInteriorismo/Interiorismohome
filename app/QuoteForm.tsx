"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; name: string };

export default function QuoteForm({ products }: { products: Product[] }) {
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    product: "",
    space: "",
  });
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const id = "L-" + Math.floor(1000 + Math.random() * 9000);
    await supabase.from("leads").insert({
      id,
      name: form.name,
      whatsapp: form.whatsapp,
      product: form.product,
      space: form.space,
      status: "Nuevo",
      origen: "Sitio web",
    });

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const msg = `Hola, soy ${form.name}. Me interesa cotizar ${form.product || "un proyecto"}${
      form.space ? " para " + form.space : ""
    }.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");

    setSaving(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl p-8 text-center border border-white/10">
        <p className="font-serif text-2xl mb-2">Solicitud enviada</p>
        <p className="text-sm text-[#E7DFCE]">
          Te contactaremos por WhatsApp. Si no se abrió, revisa que tu
          navegador permita ventanas emergentes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input
        required
        placeholder="Nombre"
        value={form.name}
        onChange={set("name")}
        className="bg-[#1A1611] border border-white/10 rounded-lg px-4 py-3 text-sm"
      />
      <input
        required
        placeholder="WhatsApp (10 dígitos)"
        type="tel"
        pattern="[0-9]{10}"
        value={form.whatsapp}
        onChange={set("whatsapp")}
        className="bg-[#1A1611] border border-white/10 rounded-lg px-4 py-3 text-sm"
      />
      <select
        value={form.product}
        onChange={set("product")}
        className="bg-[#1A1611] border border-white/10 rounded-lg px-4 py-3 text-sm"
      >
        <option value="">Producto de interés</option>
        {products.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        placeholder="Tipo de espacio (ej. Sala, Oficina)"
        value={form.space}
        onChange={set("space")}
        className="bg-[#1A1611] border border-white/10 rounded-lg px-4 py-3 text-sm"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3.5 rounded-full text-sm font-semibold bg-[#BE7A4E] text-[#0F0D0B] disabled:opacity-50"
      >
        {saving ? "Enviando..." : "Cotizar por WhatsApp"}
      </button>
    </form>
  );
}
