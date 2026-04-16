import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Anchor, 
  Archive, 
  LogOut, 
  LayoutDashboard,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Camera,
  User,
  Settings,
  Lock,
  Mail,
  CheckCircle2,
  Phone,
  Baby,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc } from "firebase/firestore";
import { format, isAfter, isBefore, parseISO, startOfToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  pack_name: string;
  booking_date: string;
  booking_time: string;
  num_people: number;
  location: string;
  price: number;
  created_at: string;
  status?: string;
}

const countryPrefixes = [
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+34", country: "Espanha", flag: "🇪🇸" },
  { code: "+33", country: "França", flag: "🇫🇷" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+49", country: "Alemanha", flag: "🇩🇪" },
  { code: "+1", country: "EUA", flag: "🇺🇸" },
  { code: "+55", country: "Brasil", flag: "🇧🇷" },
  { code: "+39", country: "Itália", flag: "🇮🇹" },
  { code: "+41", country: "Suíça", flag: "🇨🇭" },
  { code: "+32", country: "Bélgica", flag: "🇧🇪" },
  { code: "+31", country: "Holanda", flag: "🇳🇱" },
  { code: "+352", country: "Luxemburgo", flag: "🇱🇺" },
];

const Profile = () => {
  const { user, logout, updatePhoto, updateDisplayName, updateUserPassword, updateUserData, deleteUserAccount, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"active" | "past" | "settings">("active");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Settings state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+351");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab") as any;
    if (tab === "settings") setActiveTab("settings");
    else if (tab === "past") setActiveTab("past");
    else setActiveTab("active");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnPath = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${returnPath}`);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || user.displayName?.split(" ")[0] || "");
          setLastName(data.lastName || user.displayName?.split(" ").slice(1).join(" ") || "");
          setBirthDate(data.birthDate || "");
          setPhonePrefix(data.phonePrefix || "+351");
          setPhoneNumber(data.phoneNumber || "");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem demasiado grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setPhotoLoading(true);
    try {
      await updatePhoto(file);
      toast({ title: "Foto atualizada!", description: "A tua imagem de perfil foi alterada." });
    } catch (err) {
      toast({ title: "Erro ao atualizar foto", variant: "destructive" });
    } finally {
      setPhotoLoading(false);
    }
  };

  const capitalize = (str: string) => {
    return str.trim().split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    console.log("Starting profile update...");

    try {
      const fName = capitalize(firstName);
      const lName = capitalize(lastName);
      const fullName = `${fName} ${lName}`.trim();

      // 1. Auth Update (DisplayName)
      if (fullName !== user?.displayName) {
        console.log("Updating Auth DisplayName to:", fullName);
        await updateDisplayName(fullName);
      }

      // 2. Firestore Update
      console.log("Updating Firestore data...");
      await updateUserData({
        firstName: fName,
        lastName: lName,
        birthDate,
        phonePrefix,
        phoneNumber
      });

      // 3. Password Update (Optional)
      if (newPassword) {
        if (newPassword.length < 6) {
          toast({ title: "Erro na palavra-passe", description: "Mínimo de 6 caracteres.", variant: "destructive" });
          setSettingsLoading(false);
          return;
        }
        console.log("Updating password...");
        await updateUserPassword(newPassword);
        toast({ title: "Palavra-passe alterada!", description: "Conta segura." });
        setNewPassword("");
      }

      // Sync local state
      setFirstName(fName);
      setLastName(lName);

      toast({ title: "Perfil atualizado!", description: "As tuas informações foram guardadas." });
    } catch (err: any) {
      console.error("CRITICAL UPDATE ERROR:", err);
      let msg = "Não foi possível atualizar as definições.";
      
      if (err.code === "auth/requires-recent-login") {
        msg = "Para mudar a palavra-passe, precisas de fazer login novamente por segurança.";
      } else if (err.message) {
        msg = `Erro: ${err.message}`;
      }
      
      toast({ title: "Erro ao atualizar", description: msg, variant: "destructive" });
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.email) return;

      try {
        const q = query(
          collection(db, "bookings"),
          where("client_email", "==", user.email),
          orderBy("booking_date", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[];
        
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast({ title: "Até breve!", description: "Sessão terminada." });
    } catch (e) {
      toast({ title: "Erro ao sair", variant: "destructive" });
    }
  };

  const today = startOfToday();
  const handleDeleteAccount = async () => {
    if (!window.confirm("Tens a certeza que queres excluir permanentemente a tua conta? Esta ação não pode ser desfeita e perderás todo o teu histórico e progresso de afiliados.")) {
      return;
    }

    setSettingsLoading(true);
    try {
      await deleteUserAccount();
      toast({
        title: "Conta excluída",
        description: "A tua conta foi removida com sucesso. Esperamos ver-te de volta em breve!",
      });
      navigate("/");
    } catch (err: any) {
      console.error("Delete error:", err);
      if (err.code === 'auth/requires-recent-login') {
         toast({
           variant: "destructive",
           title: "Erro de Segurança",
           description: "Para excluir a conta, precisas de ter feito login recentemente. Por favor, sai da conta e volta a entrar para confirmar que és tu.",
         });
      } else {
         toast({
           variant: "destructive",
           title: "Erro ao excluir conta",
           description: "Ocorreu um problema técnico. Tenta novamente mais tarde.",
         });
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const activeBookings = bookings.filter(b => {
    try {
      const bDate = parseISO(b.booking_date);
      return isAfter(bDate, today) || format(bDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    } catch (e) {
      return false;
    }
  }).sort((a,b) => a.booking_date.localeCompare(b.booking_date));

  const pastBookings = bookings.filter(b => {
    try {
      const bDate = parseISO(b.booking_date);
      return isBefore(bDate, today) && format(bDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd");
    } catch (e) {
      return false;
    }
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="font-display font-800 text-muted-foreground uppercase tracking-widest text-sm">A carregar perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Dynamic Header */}
      <div className="ocean-gradient pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="relative group">
                    <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-2xl relative overflow-hidden flex items-center justify-center">
                       {photoLoading ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                            <Loader2 size={24} className="animate-spin text-primary" />
                         </div>
                       ) : null}
                       {user?.photoURL ? (
                         <img 
                           src={user.photoURL} 
                           alt="Profile" 
                           className="w-full h-full rounded-[1.8rem] object-cover"
                           onError={(e) => {
                             (e.target as HTMLImageElement).style.display = 'none';
                             const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon');
                             if (fallback) (fallback as HTMLElement).style.display = 'flex';
                           }}
                         />
                       ) : null}
                       <div className={cn("fallback-icon items-center justify-center w-full h-full bg-muted/50 rounded-[1.8rem]", user?.photoURL ? "hidden" : "flex")}>
                          <User size={40} className="text-muted-foreground/40" />
                       </div>
                       <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                          <Camera size={24} />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoChange}
                            disabled={photoLoading}
                          />
                       </label>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center border-4 border-[#1e4b6e] shadow-lg z-20">
                       <Zap size={18} fill="currentColor" />
                    </div>
                 </div>
                 <div>
                    <h1 className="font-display text-4xl font-900 text-white tracking-tighter leading-none mb-2">
                       Olá, {firstName || user?.displayName?.split(" ")[0] || "Explorador"}!
                    </h1>
                    <div className="flex items-center gap-3">
                       <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-900 text-white uppercase tracking-widest border border-white/10">
                          {user?.email}
                       </span>
                       <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                       <span className="text-white/60 text-xs font-semibold">Cliente Royal Coast</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <Button 
                    onClick={() => navigate("/")}
                    variant="outline" 
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-2xl h-12 px-6"
                 >
                    Ir para Home
                 </Button>
                 <Button 
                    onClick={handleLogout}
                    className="bg-coral hover:bg-coral/90 text-white rounded-2xl h-12 px-6 shadow-lg shadow-coral/20 border-none"
                 >
                    <LogOut size={18} className="mr-2" />
                    Sair
                 </Button>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -translate-y-16">
         {/* Tabs Navigation */}
         <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/5 p-2 mb-8 border border-border/40 flex gap-2 overflow-x-auto scroller-hidden">
            <button
               onClick={() => setActiveTab("active")}
               className={cn(
                  "flex-1 min-w-[150px] py-4 px-6 rounded-[1.5rem] font-display font-900 text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3",
                  activeTab === "active" 
                     ? "bg-primary text-white shadow-xl shadow-primary/20" 
                     : "text-muted-foreground hover:bg-muted/50"
               )}
            >
               <LayoutDashboard size={18} />
               Reservas
            </button>
            <button
               onClick={() => setActiveTab("past")}
               className={cn(
                  "flex-1 min-w-[150px] py-4 px-6 rounded-[1.5rem] font-display font-900 text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3",
                  activeTab === "past" 
                     ? "bg-primary text-white shadow-xl shadow-primary/20" 
                     : "text-muted-foreground hover:bg-muted/50"
               )}
            >
               <Archive size={18} />
               Histórico
            </button>
            <button
               onClick={() => setActiveTab("settings")}
               className={cn(
                  "flex-1 min-w-[150px] py-4 px-6 rounded-[1.5rem] font-display font-900 text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3",
                  activeTab === "settings" 
                     ? "bg-primary text-white shadow-xl shadow-primary/20" 
                     : "text-muted-foreground hover:bg-muted/50"
               )}
            >
               <Settings size={18} />
               Definições
            </button>
         </div>

         {/* Content Area */}
         <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
               {activeTab === "settings" ? (
                  <motion.div
                     key="settings"
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.98 }}
                     className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/40 p-8 md:p-12 max-w-2xl mx-auto"
                  >
                     <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border/50">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                           <Settings size={24} />
                        </div>
                        <div>
                           <h2 className="font-display text-2xl font-800 text-foreground">Definições da Conta</h2>
                           <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Gere o teu perfil e segurança</p>
                        </div>
                     </div>

                     <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Primeiro Nome</label>
                                 <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                    <Input 
                                       value={firstName}
                                       onChange={(e) => setFirstName(e.target.value)}
                                       className="h-14 pl-12 rounded-2xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 font-semibold"
                                       placeholder="Ex: João"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Apelido</label>
                                 <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                    <Input 
                                       value={lastName}
                                       onChange={(e) => setLastName(e.target.value)}
                                       className="h-14 pl-12 rounded-2xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 font-semibold"
                                       placeholder="Ex: Silva"
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                 <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Data de Nascimento</label>
                                 <div className="relative">
                                    <Baby className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                    <Input 
                                       type="date"
                                       value={birthDate}
                                       onChange={(e) => setBirthDate(e.target.value)}
                                       className="h-14 pl-12 rounded-2xl border-border/50 bg-muted/20 focus-visible:ring-primary/20"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Telemóvel</label>
                                 <div className="flex gap-2">
                                    <select 
                                       value={phonePrefix}
                                       onChange={(e) => setPhonePrefix(e.target.value)}
                                       className="w-[100px] h-14 rounded-2xl border border-border/50 bg-muted/20 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all px-3 appearance-none cursor-pointer"
                                    >
                                       {countryPrefixes.map(cp => (
                                          <option key={cp.code} value={cp.code}>
                                             {cp.flag} {cp.code}
                                          </option>
                                       ))}
                                    </select>
                                    <div className="relative flex-1">
                                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                       <Input 
                                          type="tel"
                                          value={phoneNumber}
                                          onChange={(e) => setPhoneNumber(e.target.value)}
                                          className="h-14 pl-12 rounded-2xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 font-semibold"
                                          placeholder="9XX XXX XXX"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Email</label>
                              <div className="relative opacity-60">
                                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                 <Input 
                                    value={user?.email || ""}
                                    disabled
                                    className="h-14 pl-12 rounded-2xl bg-muted/40 cursor-not-allowed border-border/50"
                                 />
                              </div>
                           </div>

                           <div className="space-y-3">
                              <label className="text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Nova Palavra-passe</label>
                              <div className="relative">
                                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                                 <Input 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="h-14 pl-12 rounded-2xl border-border/50 bg-muted/20 focus-visible:ring-primary/20"
                                    placeholder="Deixa em branco para não alterar"
                                 />
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium ml-1">Segurança mínima: 6 caracteres.</p>
                           </div>
                        </div>

                        <Button 
                           type="submit"
                           disabled={settingsLoading}
                           className="w-full h-14 sunset-gradient text-white rounded-2xl font-display font-900 uppercase tracking-widest text-xs shadow-xl shadow-coral/20 hover:scale-[1.01] transition-all"
                        >
                           {settingsLoading ? <Loader2 className="animate-spin" /> : "Guardar Alterações"}
                        </Button>
                     </form>

                     <div className="mt-12 p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex items-start gap-4">
                        <CheckCircle2 size={24} className="text-secondary shrink-0" />
                        <div>
                           <h4 className="font-display font-800 text-sm text-foreground">Conta Segura</h4>
                           <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              As tuas informações estão encriptadas e são usadas apenas para as tuas reservas na Royal Coast. 
                           </p>
                        </div>
                     </div>

                     <div className="mt-8 pt-8 border-t border-border/50">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                           <AlertTriangle size={18} />
                           <h4 className="font-display font-800 text-sm uppercase tracking-widest">Zona de Perigo</h4>
                        </div>
                        <div className="bg-destructive/5 border border-destructive/10 rounded-3xl p-6 flex items-center justify-between gap-4 group hover:bg-destructive/10 transition-colors">
                           <div className="flex-1">
                              <p className="text-xs font-bold text-foreground">Excluir Conta Permanentemente</p>
                              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                 Ao excluir a conta, todos os teus dados, reservas e progresso de afiliados serão eliminados.
                              </p>
                           </div>
                           <Button 
                              onClick={handleDeleteAccount}
                              variant="outline" 
                              className="border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-xl h-10 px-4 text-[10px] font-900 uppercase tracking-widest transition-all"
                           >
                              <Trash2 size={14} className="mr-2" />
                              Excluir
                           </Button>
                        </div>
                     </div>
                  </motion.div>
               ) : (
                  <motion.div
                     key={activeTab}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                     {(activeTab === "active" ? activeBookings : pastBookings).length > 0 ? (
                        (activeTab === "active" ? activeBookings : pastBookings).map((booking) => (
                           <div 
                              key={booking.id}
                              className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/40 overflow-hidden group hover:border-primary/30 transition-all hover:scale-[1.01]"
                           >
                              <div className="bg-muted/30 p-6 flex items-center justify-between border-b border-border/40">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                       <Anchor size={20} />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-900 text-muted-foreground uppercase tracking-widest">{booking.id.slice(0, 8)}</p>
                                       <h3 className="font-display font-800 text-foreground truncate max-w-[150px]">{booking.pack_name}</h3>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-lg font-display font-900 text-primary">{booking.price}€</p>
                                    <span className={cn(
                                       "inline-block px-3 py-1 rounded-full text-[10px] font-900 uppercase tracking-widest",
                                       activeTab === "active" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"
                                    )}>
                                       {activeTab === "active" ? "Confirmada" : "Concluída"}
                                    </span>
                                 </div>
                              </div>
                              
                              <div className="p-8 grid grid-cols-2 gap-y-6 gap-x-8">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground">
                                       <Calendar size={12} className="text-primary" />
                                       Data
                                    </div>
                                    <p className="font-display font-900 text-foreground text-sm uppercase">
                                       {format(parseISO(booking.booking_date), "dd MMMM yyyy", { locale: pt })}
                                    </p>
                                 </div>

                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground">
                                       <Clock size={12} className="text-primary" />
                                       Hora
                                    </div>
                                    <p className="font-display font-900 text-foreground text-sm">{booking.booking_time}</p>
                                 </div>

                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground">
                                       <MapPin size={12} className="text-primary" />
                                       Local
                                    </div>
                                    <p className="font-display font-900 text-foreground text-sm truncate uppercase">{booking.location}</p>
                                 </div>

                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground">
                                       <Users size={12} className="text-primary" />
                                       Pessoas
                                    </div>
                                    <p className="font-display font-900 text-foreground text-sm uppercase">{booking.num_people} Pessoas</p>
                                 </div>
                              </div>

                              <div className="px-8 pb-8 flex items-center justify-between">
                                 <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                    <ShieldCheck size={14} className="text-primary" />
                                    <span className="text-[10px] font-900 text-primary uppercase tracking-widest">Reserva Validada</span>
                                 </div>
                                 <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                    Ver Detalhes <ChevronRight size={14} />
                                 </button>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/40 p-16 text-center col-span-2">
                           <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                              {activeTab === "active" ? <Zap size={32} /> : <Archive size={32} />}
                           </div>
                           <h3 className="font-display text-2xl font-800 text-foreground mb-2">
                              {activeTab === "active" ? "Não tens reservas ativas" : "O teu histórico está vazio"}
                           </h3>
                           <p className="text-muted-foreground max-w-xs mx-auto mb-8 font-medium">
                              Parece que ainda não tens nenhuma viagem marcada. Estás pronto para a tua próxima aventura?
                           </p>
                           <Button 
                              onClick={() => navigate("/reservar")}
                              className="sunset-gradient text-white rounded-2xl h-14 px-10 font-display font-900 uppercase tracking-widest text-xs"
                           >
                              Reservar Agora
                           </Button>
                        </div>
                     )}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Footer Support */}
         <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground font-medium">
               Precisas de ajuda com uma reserva? <a href="/#contact" className="text-primary font-900 hover:underline">Fala connosco</a>
            </p>
         </div>
      </div>
    </div>
  );
};

export default Profile;
