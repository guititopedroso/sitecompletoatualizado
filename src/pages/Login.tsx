import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ArrowLeft, Loader2, Mail, Lock, ShieldCheck, UserPlus, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/perfil";
  
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Bem-vindo de volta!",
        description: "Login efetuado com sucesso.",
      });
      navigate(redirectTo);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      let message = "Não foi possível entrar com a conta Google.";
      
      if (error.code === "auth/popup-closed-by-user") {
        message = "A janela de login foi fechada antes de terminar.";
      } else if (error.code === "auth/popup-blocked") {
        message = "O teu navegador bloqueou a janela de login. Por favor, ativa os popups.";
      } else if (error.code === "auth/unauthorized-domain") {
        message = "Este domínio não está autorizado na consola Firebase.";
      }

      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === "signup" && !name)) {
      toast({ title: "Preenche todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        toast({ title: "Bem-vindo!", description: "Login efetuado com sucesso." });
      } else {
        await signUpWithEmail(email, password, name);
        toast({ title: "Conta criada!", description: "Bem-vindo à Royal Coast." });
      }
      navigate(redirectTo);
    } catch (error: any) {
      let msg = "Ocorreu um erro. Tenta novamente.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        msg = "Email ou palavra-passe incorretos.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "Este email já está em uso.";
      } else if (error.code === "auth/weak-password") {
        msg = "A palavra-passe deve ter pelo menos 6 caracteres.";
      }
      toast({ title: "Erro na autenticação", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Header / Navigation */}
      <div className="ocean-gradient py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <button
            onClick={() => navigate("/")}
            className="group mb-8 inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/10 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest">Voltar à Página Inicial</span>
          </button>
          
          <h1 className="font-display text-4xl md:text-5xl font-900 text-white tracking-tighter leading-none mb-4">
            A Minha Conta
          </h1>
          <p className="text-white/70 max-w-md mx-auto">
            Acede às tuas reservas e gere o teu perfil Royal Coast num só lugar.
          </p>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex-1 max-w-md w-full mx-auto px-4 -translate-y-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 p-8 md:p-10 border border-border/40"
        >
          <div className="flex items-center gap-3 mb-10 border-b border-border/50 pb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-display text-xl font-800 text-foreground leading-tight">
                {mode === "login" ? "Iniciar Sessão" : "Criar Conta"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Acesso Seguro</p>
            </div>
          </div>

          <div className="space-y-6">
             <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 bg-white hover:bg-muted text-foreground border-2 border-border/50 rounded-2xl font-display font-800 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-black/5"
             >
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-primary" />
                ) : (
                    <>
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Entrar com Google
                    </>
                )}
             </Button>

             <div className="relative py-4 flex items-center gap-4">
                <div className="flex-1 h-px bg-border/50"></div>
                <span className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em]">Ou usa o teu email</span>
                <div className="flex-1 h-px bg-border/50"></div>
             </div>

             <form onSubmit={handleEmailAuth} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                        <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                            <Input
                                type="text"
                                placeholder="João Silva"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 pl-12 rounded-2xl border-border bg-muted/30 focus-visible:ring-primary/20"
                                required={mode === "signup"}
                            />
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                    <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                        <Input
                            type="email"
                            placeholder="o.teu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-14 pl-12 rounded-2xl border-border bg-muted/30 focus-visible:ring-primary/20"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Palavra-passe</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 pl-12 rounded-2xl border-border bg-muted/30 focus-visible:ring-primary/20"
                            required
                        />
                    </div>
                </div>
                <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 sunset-gradient text-white rounded-2xl font-display font-900 uppercase tracking-widest text-sm shadow-xl shadow-coral/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin" /> : mode === "login" ? "Entrar" : "Criar Conta"}
                </Button>
             </form>

             <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-xs font-bold text-primary hover:underline transition-all"
                >
                  {mode === "login" ? "Não tens conta? Cria uma aqui" : "Já tens conta? Inicia sessão"}
                </button>
             </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Ao entrar, concordas com os nossos{" "}
            <a href="/termos" className="text-primary font-bold hover:underline">Termos</a> e{" "}
            <a href="/privacidade" className="text-primary font-bold hover:underline">Privacidade</a>.
          </p>
        </motion.div>

        <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-secondary/5 px-6 py-3 rounded-2xl border border-secondary/10">
                <ShieldCheck size={16} className="text-secondary" />
                <p className="text-secondary font-display font-800 text-xs uppercase tracking-wider">
                    As tuas reservas estão seguras connosco
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
