import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Copy, Check, Users, ArrowLeft, Crown, Loader2, Gem, Sparkles, Trophy, Zap, Gift, Waves } from "lucide-react";
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
      return;
    }

    const fetchReferralData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const code = userDoc.data().referralCode;
          setReferralCode(code);
          if (code) {
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

    if (user) fetchReferralData();
  }, [user, authLoading, navigate]);

  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "💎 Link Elite Copiado!" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="relative">
           <Loader2 className="animate-spin text-primary" size={48} />
           <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    );
  }

  const progress = Math.min((referralCount / 4) * 100, 100);

  return (
    <div className="min-h-screen bg-[#020817] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Section */}
      <div className="relative border-b border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
          >
            <ArrowLeft size={28} />
          </motion.button>
          <div>
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2 mb-1"
            >
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Elite Partner</span>
            </motion.div>
            <h1 className="font-display text-3xl font-900 tracking-tight flex items-center gap-3">
              RoyalCoast <span className="text-primary italic">Elite</span> <Crown className="text-primary" size={28} />
            </h1>
          </div>
        </div>
      </div>

      <main className="relative max-w-5xl mx-auto px-6 py-16 space-y-16">
        
        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Card VIP Link (Left) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 h-full overflow-hidden">
               {/* Pattern Background */}
               <div className="absolute top-0 right-0 p-12 opacity-[0.05] rotate-12 pointer-events-none">
                  <Waves size={240} className="text-white" />
               </div>

               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-[1px]">
                        <div className="w-full h-full bg-[#020817] rounded-2xl flex items-center justify-center">
                           <Gift size={32} className="text-primary" />
                        </div>
                     </div>
                     <div>
                        <h2 className="text-2xl font-900 tracking-tight">Convida e Navega 🌊</h2>
                        <p className="text-white/50 text-sm font-medium">Recomenda aos teus amigos e ganha viagens</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-lg text-white/80 leading-relaxed font-inter">
                        Partilha o teu link exclusivo. Por cada 4 amigos que confirmem uma reserva, a tua próxima aventura de <span className="text-primary font-black italic">15 minutos de mota de água é oferta nossa.</span>
                     </p>
                  </div>

                  <div className="space-y-3 pt-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2 flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> O Teu Link Pessoal
                     </label>
                     <div className="flex flex-col md:flex-row items-stretch gap-3 bg-white/5 p-3 rounded-[2rem] border border-white/5">
                        <div className="flex-1 px-5 py-4 text-sm font-mono text-white/90 truncate bg-black/40 rounded-2xl flex items-center border border-white/5">
                           {referralLink}
                        </div>
                        <motion.button 
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={copyLink} 
                           className={cn(
                             "h-14 px-10 rounded-2xl font-900 uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-3",
                             copied ? "bg-green-500 text-white" : "sunset-gradient text-accent-foreground"
                           )}
                        >
                           {copied ? <Check size={20} /> : <Copy size={20} />}
                           {copied ? "Copiado" : "Copiar Link"}
                        </motion.button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Mini Stats (Right) */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
               initial={{ opacity: 0, x: 30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Trophy size={80} />
               </div>
               <h3 className="text-lg font-900 mb-6 flex items-center gap-3"><Sparkles className="text-primary" size={20}/> Meta de Viagem</h3>
               
               <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-900 text-primary">{referralCount}<span className="text-white/20 text-sm px-2">/ 4</span></span>
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Amigos a bordo</span>
               </div>
               
               <div className="relative h-5 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-secondary rounded-full shadow-[0_0_20px_rgba(255,107,0,0.4)]"
                  />
               </div>

               <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[11px] font-900 uppercase tracking-widest text-primary italic">
                     {referralCount >= 4 ? "JÁ GANHASTE UMA VIAGEM! 🔥" : `Faltam ${4 - referralCount} para navegar à borla`}
                  </p>
               </div>
            </motion.div>

            <motion.div
               initial={{ opacity: 0, x: 30 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] p-8"
            >
               <h4 className="text-sm font-black uppercase tracking-widest mb-4">Vantagens Elite</h4>
               <ul className="space-y-4">
                  {[
                    "Viagens grátis ilimitadas por metas",
                    "Ganha 15 min de mota de água p/ 4 amigos",
                    "Desconto especial no teu dia de anos",
                    "Passeios exclusivos para o teu grupo"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-white/60 font-medium">
                       <Check size={14} className="text-primary mt-0.5 shrink-0" />
                       {benefit}
                    </li>
                  ))}
               </ul>
            </motion.div>
          </div>
        </div>

        {/* Steps Section */}
        <section className="pt-10">
           <div className="text-center mb-12 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Missão Elite</h3>
              <h2 className="text-3xl font-900 tracking-tight">O teu caminho até à água</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Link2 size={32} />, title: "Partilha", color: "text-primary", desc: "Envia o link aos teus amigos mais aventureiros" },
                { icon: <Users size={32} />, title: "Eles Reservam", color: "text-white", desc: "Os teus amigos vivem a experiência Royal Coast" },
                { icon: <Waves size={32} />, title: "Tu Navegas", color: "text-secondary", desc: "Recebes o prémio e vais para a água de borla" }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center hover:bg-white/[0.08] transition-all group"
                >
                   <div className={cn("mb-6 flex justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-transform", step.color)}>{step.icon}</div>
                   <h4 className="font-display font-900 text-xl mb-3 tracking-tight">{step.title}</h4>
                   <p className="text-sm text-white/50 font-medium leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Footer CTA */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           className="text-center pt-10"
        >
           <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4">Dúvidas sobre o sistema de prémios?</p>
           <a href="/#contactos" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-primary transition-colors border-b border-white/20 pb-1">
              Falar com a equipa Royal Coast
           </a>
        </motion.div>

      </main>
    </div>
  );
};

export default Referral;
