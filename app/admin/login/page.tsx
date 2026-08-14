"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EC] px-5">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 border border-[#E7E0D0]">
        <p className="font-serif text-2xl mb-1 text-[#221D17]">Panel administrativo</p>
        <p className="text-sm mb-8 text-[#786E5E]">Home Interiorismo</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[#E7E0D0] rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[#E7E0D0] rounded-lg px-3 py-2.5 text-sm"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full py-3 text-sm font-semibold bg-[#221D17] text-white disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
