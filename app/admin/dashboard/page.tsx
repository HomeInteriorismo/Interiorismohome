import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "../LogoutButton";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { count: leadsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "Nuevo");

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true });

  const isColaborador = profile?.role === "COLABORADOR";

  return (
    <div className="min-h-screen bg-[#F6F3EC] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-serif text-2xl text-[#221D17]">Dashboard</p>
            <p className="text-sm text-[#786E5E]">
              {profile?.name} · {profile?.role}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Nuevos prospectos" value={leadsCount ?? 0} />
          <StatCard
            label="Cotizaciones"
            value={isColaborador ? "—" : "Ver módulo"}
          />
          <StatCard label="Citas" value={appointmentsCount ?? 0} />
          <StatCard label="Proyectos" value={isColaborador ? "—" : "Ver módulo"} />
        </div>

        <p className="text-xs text-[#786E5E] mt-10">
          Este es el arranque del panel real. Las secciones de Prospectos,
          Cotizaciones, Clientes, Agenda, Proyectos, Productos y Usuarios se
          agregan igual que esta — cada una es una página en{" "}
          <code>app/admin/&lt;seccion&gt;/page.tsx</code> que lee su tabla
          correspondiente de Supabase.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-[#E7E0D0]">
      <p className="text-xs mb-3 text-[#786E5E]">{label}</p>
      <p className="text-3xl font-semibold text-[#221D17]">{value}</p>
    </div>
  );
}
