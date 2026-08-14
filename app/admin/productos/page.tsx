import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ProductosPage() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("*");

  return (
    <div className="min-h-screen bg-[#F6F3EC] p-8">
      <div className="max-w-5xl mx-auto">
        <p className="font-serif text-2xl text-[#221D17] mb-6">Productos</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl p-5 bg-white border border-[#E7E0D0]"
            >
              <p className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F6F3EC] text-[#786E5E] inline-block mb-3">
                {p.code}
              </p>
              <p className="text-sm font-semibold text-[#221D17] mb-1">
                {p.name}
              </p>
              <p className="text-xs text-[#786E5E]">{p.short}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
