import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, Check, Users, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

function generateCode(name: string): string {
  const clean = name.trim().toLowerCase().replace(/\s+/g, "").slice(0, 6);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${clean}-${rand}`;
}

const Referral = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    const code = generateCode(name);

    const { error } = await supabase.from("referrals").insert({
      name: name.trim(),
      email: email.trim(),
      code,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Já tens um link!", description: "Usa o email para procurar o teu código existente.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: "Tenta novamente.", variant: "destructive" });
      }
    } else {
      setReferralCode(code);
      toast({ title: "Link criado! 🎉", description: "Partilha com os teus amigos." });
    }
    setLoading(false);
  };

  const referralLink = referralCode
    ? `https://www.royalcoast.pt?ref=${referralCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="ocean-gradient">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} className="text-primary-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-800 text-primary-foreground">Programa de Afiliados</h1>
            <p className="text-primary-foreground/70 text-sm">Indica amigos e ganha uma viagem grátis!</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {!referralCode ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* How it works */}
            <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={20} className="text-coral" />
                <h2 className="font-display text-lg font-800 text-foreground">Como funciona?</h2>
              </div>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Cria o teu link único de afiliado" },
                  { step: "2", text: "Partilha com amigos e conhecidos" },
                  { step: "3", text: "Quando 4 pessoas reservarem pelo teu link, ganhas uma viagem de 30 minutos de mota de água grátis! 🎉" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full ocean-gradient text-primary-foreground flex items-center justify-center font-display font-700 text-xs shrink-0">
                      {item.step}
                    </div>
                    <p className="text-sm text-muted-foreground pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
              <h3 className="font-display font-700 text-foreground">Cria o teu link</h3>
              <Input
                placeholder="O teu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="O teu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim() || !email.trim()}
                className="w-full sunset-gradient text-accent-foreground font-semibold rounded-full"
              >
                {loading ? "A criar..." : "Gerar o meu link"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-2xl shadow-card p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <Link2 size={28} className="text-secondary" />
              </div>
              <h2 className="font-display text-xl font-800 text-foreground">O teu link está pronto!</h2>
              <p className="text-sm text-muted-foreground">
                Partilha este link com amigos. Cada reserva feita por este link conta para a tua viagem grátis.
              </p>

              <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none font-mono truncate"
                />
                <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-secondary" />
                <h3 className="font-display font-700 text-foreground">Progresso</h3>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div className="h-3 rounded-full ocean-gradient" style={{ width: "0%" }} />
              </div>
              <p className="text-xs text-muted-foreground">0 de 4 reservas — faltam 4 para a viagem grátis!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Referral;
