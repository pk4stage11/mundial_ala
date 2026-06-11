import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/grupos");

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-pitch to-pitch-dark px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center text-white mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/trionda.png"
            alt="Balón Trionda - Mundial 2026"
            className="w-24 h-24 mx-auto mb-3 rounded-full object-cover shadow-lg ring-2 ring-white/30"
          />
          <h1 className="text-2xl font-bold leading-tight">Quiniela Mundial 2026</h1>
          <p className="text-white/70 text-sm mt-1">
            Predice los partidos y compite por aciertos
          </p>
        </div>
        <div className="bg-surface rounded-2xl shadow-xl p-6">
          <LoginForm />
        </div>
        <p className="text-center text-white/50 text-xs mt-6">
          Canadá · México · Estados Unidos
        </p>
      </div>
    </main>
  );
}
