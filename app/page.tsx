import { createClient } from "@/lib/supabase/server";
import QuoteForm from "./QuoteForm";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();

  import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Se puede ignorar si se llama desde un Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Se puede ignorar si se llama desde un Server Component
          }
        },
      },
    }
  );
}

  return (
    <main>
      {/* HERO */}
      <section className="min-h-[70vh] flex flex-col justify-center px-6 md:px-10 max-w-5xl mx-auto">
        <p className="text-xs tracking-[0.3em] text-[#BE7A4E] mb-4">
          REVESTIMIENTOS · PERSIANAS · EXTERIOR
        </p>
        <h1 className="font-serif text-5xl md:text-7xl mb-6" style={{ fontWeight: 500 }}>
          Transforma
          <br />
          tu espacio.
        </h1>
        <p className="max-w-md text-[#E7DFCE] mb-8">
          Home Interiorismo — revestimientos, persianas, pasto sintético y
          palapa para tu proyecto.
        </p>
        <a
          href="#cotizar"
          className="inline-block w-fit px-6 py-3.5 rounded-full text-sm font-semibold bg-[#F6F1E7] text-[#0F0D0B]"
        >
          Cotizar mi proyecto
        </a>
      </section>

      {/* CATÁLOGO — datos reales desde Supabase */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-20">
        <p className="text-xs tracking-[0.3em] text-[#BE7A4E] mb-4">CATÁLOGO</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-10">
          Elige lo que tu espacio necesita.
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl overflow-hidden border border-white/10 bg-[#1A1611]"
            >
              <div
                className="h-56 bg-cover bg-center"
                style={{
                  backgroundImage: p.cover_photo_url
                    ? `url(${p.cover_photo_url})`
                    : undefined,
                  backgroundColor: "#2A2019",
                }}
              />
              <div className="p-6">
                <h3 className="font-serif text-xl mb-2">{p.name}</h3>
                <p className="text-sm text-[#E7DFCE]">{p.short}</p>
              </div>
            </div>
          ))}
        </div>
        {(!products || products.length === 0) && (
          <p className="text-sm text-[#E7DFCE]">
            Aún no hay productos cargados — revisa que el seed.sql se haya
            corrido en Supabase.
          </p>
        )}
      </section>

      {/* COTIZADOR — inserta un lead real en Supabase */}
      <section id="cotizar" className="max-w-2xl mx-auto px-6 md:px-10 py-20">
        <p className="text-xs tracking-[0.3em] text-[#BE7A4E] mb-4">COTIZADOR</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-8">
          Cotiza tu proyecto.
        </h2>
        <QuoteForm products={products ?? []} />
      </section>

      <footer className="px-6 md:px-10 py-10 border-t border-white/10 text-center text-xs text-[#E7DFCE]">
        © 2026 Home Interiorismo —{" "}
        <a href="/admin/login" className="underline">
          Acceso administradores
        </a>
      </footer>
    </main>
  );
}
