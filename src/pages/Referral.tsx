import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, Check, Users, ArrowLeft, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Referral = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${returnPath}`);
      toast({ 
        title: "Inicia sessão primeiro", 
        description: "Precisas de ter uma conta para ver o teu link de afiliado.", 
        variant: "destructive" 
      });
      return;
    }

    const fetchReferralData = async () => {
      if (!user) return;
      try {
        // Fetch user's code from their profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const code = userDoc.data().referralCode;
          setReferralCode(code);

          if (code) {
            // Fetch how many bookings used this code
            const q = query(
              collection(db, "bookings"), 
              where("referralCode", "==", code),
              where("confirmed", "==", true)
            );
            const snap = await getDocs(q);
            setReferralCount(snap.size);
          }
        }
      } catch (err) {
        console.error("Error fetching referral data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReferralData();
    }
  }, [user, authLoading, navigate]);

  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const progress = Math.min((referralCount / 4) * 100, 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="ocean-gradient">
        <div className="max-w-3xl mx-auto px-4 py-8 flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-900 text-white tracking-tight">Programa de Afiliados</h1>
            <p className="text-white/70 text-sm font-medium">Recomenda a Royal Coast e ganha aventuras!</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Main Link Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/40 p-8 md:p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
               <Gift size={120} />
            </div>

            <div className="w-20 h-20 rounded-3xl bg-secondary/10 flex items-center justify-center mx-auto mb-6 text-secondary transform -rotate-3 group-hover:rotate-0 transition-transform">
              <Link2 size={36} />
            </div>
            
            <h2 className="font-display text-2xl font-900 text-foreground mb-3">O teu link exclusivo</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium">
              Por cada 4 amigos que reservem através do teu link, ganhas uma experiência grátis de 30 min!
            </p>

            <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/50 rounded-2xl p-2 border border-border/50">
              <div className="flex-1 px-4 py-3 text-sm font-mono text-foreground/80 truncate w-full text-center md:text-left">
                {referralLink}
              </div>
              <Button 
                onClick={copyLink} 
                className={cn(
                  "w-full md:w-auto h-12 px-8 rounded-xl font-display font-900 uppercase tracking-widest text-xs transition-all",
                  copied ? "bg-green-500 hover:bg-green-600" : "sunset-gradient"
                )}
              >
                {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
            </div>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/40 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={20} />
                </div>
                <h3 className="font-display font-800 text-foreground">O teu progresso</h3>
              </div>
              <span className="text-xs font-900 text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                {referralCount} / 4 Reservas
              </span>
            </div>

            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute inset-y-0 left-0 ocean-gradient rounded-full"
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-900 text-muted-foreground uppercase tracking-widest px-1">
               <span>Início</span>
               <span className={cn(referralCount >= 4 ? "text-secondary" : "")}>
                  {referralCount >= 4 ? "Prémio Disponível! 🎉" : `${4 - referralCount} faltam para o prémio`}
               </span>
               <span>Meta</span>
            </div>
          </motion.div>

          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { icon: <Link2 className="w-6 h-6" />, title: "Partilha", desc: "Envia o link a amigos" },
               { icon: <Users className="w-6 h-6" />, title: "Reservam", desc: "Eles fazem a reserva" },
               { icon: <Gift className="w-6 h-6" />, title: "Ganha", desc: "Viagem grátis p/ ti!" }
             ].map((item, i) => (
               <div key={i} className="bg-white shadow-lg shadow-black/5 border border-border/20 p-6 rounded-[2rem] text-center">
                  <div className="text-primary mb-3 flex justify-center">{item.icon}</div>
                  <h4 className="font-display font-800 text-sm mb-1">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium leading-tight">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
