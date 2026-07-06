import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Portal Executivo — Hub Insight Corp" }] }),
  component: AuthPage,
});

/* ---------- Glassmorphism panel 1: bar + line chart ---------- */
function ChartPanel() {
  const bars = [40, 65, 45, 80, 55, 70];
  const ghost = [32, 52, 38, 68, 42, 58];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-medium text-blue-300/80 uppercase tracking-wider">
          Receita x Meta
        </span>
        <span className="text-[10px] font-semibold text-emerald-400">+12,3%</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {ghost.map((h, i) => (
          <div
            key={`g${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/15 to-blue-400/5"
            style={{ height: `${h}%` }}
          />
        ))}
        {bars.map((h, i) => (
          <div
            key={`b${i}`}
            className="flex-1 rounded-t bg-gradient-to-t from-cyan-400 to-blue-500"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      {/* mini line overlay */}
      <svg className="w-full h-6 mt-2" viewBox="0 0 120 20" preserveAspectRatio="none">
        <path
          d="M0,15 Q10,13 20,14 T40,10 T60,8 T80,6 T100,4 T120,3"
          fill="none" stroke="oklch(0.76 0.12 85 / 0.5)" strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

/* ---------- Glassmorphism panel 2: isometric buildings ---------- */
function BuildingsPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-medium text-blue-300/80 uppercase tracking-wider">
          Unificação de Terrenos
        </span>
        <span className="text-[10px] text-gold">+3 lotes</span>
      </div>
      <div className="flex items-end justify-center gap-1.5 h-20">
        {[
          { w: 8, h: 70, color: "bg-cyan-400" },
          { w: 12, h: 100, color: "bg-gradient-to-t from-cyan-500 to-blue-400" },
          { w: 10, h: 85, color: "bg-gradient-to-t from-cyan-400 to-blue-300" },
          { w: 7, h: 55, color: "bg-cyan-400/70" },
          { w: 14, h: 90, color: "bg-gradient-to-t from-cyan-500 to-blue-400" },
        ].map((b, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* isometric roof */}
            <div
              className="w-0 h-0"
              style={{
                borderLeft: `${b.w / 2}px solid transparent`,
                borderRight: `${b.w / 2}px solid transparent`,
                borderBottom: `6px solid ${i === 2 ? "oklch(0.76 0.12 85 / 0.6)" : "oklch(0.55 0.13 240 / 0.5)"}`,
              }}
            />
            <div
              className={`${b.color} rounded-sm`}
              style={{ width: `${b.w}px`, height: `${b.h}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Glassmorphism panel 3: speedometer gauge ---------- */
function GaugePanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-blue-300/80 uppercase tracking-wider">
          Eficiência Operacional
        </span>
        <span className="text-[10px] text-cyan-400 font-semibold">78%</span>
      </div>
      <svg className="w-full h-16" viewBox="0 0 120 50">
        {/* arc bg */}
        <path
          d="M10,45 A50,40 0 0,1 110,45"
          fill="none" stroke="oklch(0.5 0.12 240 / 0.2)" strokeWidth="6" strokeLinecap="round"
        />
        {/* arc value */}
        <path
          d="M10,45 A50,40 0 0,1 88,13"
          fill="none" stroke="oklch(0.65 0.18 210)" strokeWidth="6" strokeLinecap="round"
        />
        {/* needle */}
        <line
          x1="60" y1="42" x2="82" y2="18"
          stroke="oklch(0.65 0.18 210)" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="42" r="4" fill="oklch(0.65 0.18 210)" />
        {/* labels */}
        <text x="20" y="48" fontSize="5" fill="oklch(1 0 0 / 0.3)">0</text>
        <text x="112" y="48" fontSize="5" fill="oklch(1 0 0 / 0.3)">100</text>
        <text x="53" y="8" fontSize="6" fill="oklch(0.65 0.18 210 / 0.8)" textAnchor="middle">78%</text>
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-white/20">CRÍTICO</span>
        <span className="text-[8px] text-white/20">ÓTIMO</span>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/overview", replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/overview", replace: true });
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* ============ LEFT: Login ============ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* city lights bokeh background */}
        <div className="absolute inset-0 opacity-[0.12]" style={{
          background: `
            radial-gradient(ellipse at 20% 80%, oklch(0.65 0.18 210 / 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, oklch(0.76 0.12 85 / 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 100%, oklch(0.5 0.12 240 / 0.2) 0%, transparent 50%)
          `,
        }} />
        {/* horizontal lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, oklch(0.65 0.18 210 / 0.3) 40px, oklch(0.65 0.18 210 / 0.3) 41px)`,
        }} />

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-10">
            {/* gold building icon */}
            <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-gold/25 to-gold/5 border border-gold/20 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal HubImob</h1>
            <p className="text-sm text-white/40 mt-1">Hub Insight Corp</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
            <form onSubmit={signIn} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/50 text-xs font-medium uppercase tracking-wider">Usuário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@incorporadora.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs font-medium uppercase tracking-wider">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Acessar
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-3 text-white/25 tracking-wider">ou</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            >
              <ScanFace className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-medium">Face ID / Biometria</span>
            </button>
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            Ambiente seguro · Criptografia de ponta a ponta
          </p>
        </div>
      </div>

      {/* ============ RIGHT: Dashboard preview ============ */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-zinc-950 via-black to-zinc-950 overflow-hidden">
        {/* city map texture */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `
            linear-gradient(90deg, oklch(0.65 0.18 210 / 0.3) 1px, transparent 1px),
            linear-gradient(0deg, oklch(0.65 0.18 210 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* glow orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full bg-blue-600/5 blur-3xl" />
        {/* city dots */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `radial-gradient(circle, oklch(0.65 0.18 210 / 0.5) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />

        <div className="relative flex flex-col justify-center px-12 w-full">
          <div className="space-y-5 max-w-md mx-auto w-full">
            <ChartPanel />
            <div className="grid grid-cols-2 gap-5">
              <BuildingsPanel />
              <GaugePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
