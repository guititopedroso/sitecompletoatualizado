import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Clock, Check, Users, Mail, Loader2, Anchor, Gauge, Info, ChevronRight, X, Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isBefore, startOfToday, set } from "date-fns";
import { pt } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import emailjs from "@emailjs/browser";
import { toast } from "@/hooks/use-toast";
import LegalDialog from "@/components/LegalDialog";
import { useLanguage } from "@/i18n/LanguageContext";

const EMAILJS_SERVICE_ID = "service_souo4bi";
const EMAILJS_TEMPLATE_ID = "template_lyoryda";
const EMAILJS_PUBLIC_KEY = "YAyeqW_hAHwLaV3Ho";
const ADMIN_EMAIL = "setwave.business@gmail.com";

type PackInfo = {
  name: string;
  basePrice: number;
  price: string;
  duration: string;
  isJetski?: boolean;
  isBoat?: boolean;
  isTour?: boolean;
  price4h?: number;
  price8h?: number;
  maxPeople?: number;
  theme?: "turquoise-light" | "coral" | "ocean" | "turquoise-dark";
  tourPacks?: { duration: string; price: string }[];
  extraOptions?: { name: string; price: number; perPerson: boolean; perHour: boolean; details?: string[] }[];
};

const allPacks: Record<string, PackInfo> = {
  "15-minutos": { name: "Jet Ski – 15 Minutos", basePrice: 60, price: "60€", duration: "15 min", isJetski: true, theme: "turquoise-light" },
  "30-minutos": { name: "Jet Ski – 30 Minutos", basePrice: 90, price: "90€", duration: "30 min", isJetski: true, theme: "coral" },
  "1-hora": { name: "Jet Ski – 1 Hora", basePrice: 150, price: "150€", duration: "1h", isJetski: true, theme: "ocean" },
  "pack-grupo": { name: "Jet Ski – Pack Grupo (Fotos Incluídas)", basePrice: 550, price: "550€", duration: "1h", isJetski: true, theme: "turquoise-dark" },
  "experiencia-sunset": { 
    name: "Experiência Sunset", 
    basePrice: 150, 
    price: "150€", 
    duration: "1h", 
    theme: "coral",
    extraOptions: [
      { name: "Catering Premium", price: 45, perPerson: true, perHour: false, details: ["Sushi", "Espumante", "Frutas Tropicais"] },
      { name: "DJ Privado", price: 150, perPerson: false, perHour: true, details: ["Sound System", "Deep House Mix", "Set de 2 horas"] }
    ]
  },
  // Boats
  "kelt-azura": { name: "Kelt Azura – 5 mts", basePrice: 190, price: "190€", duration: "4h", isBoat: true, price4h: 190, price8h: 230, maxPeople: 5 },
  "cap-camarat": { name: "Cap Camarat – 5,15 mts", basePrice: 200, price: "200€", duration: "4h", isBoat: true, price4h: 200, price8h: 285, maxPeople: 6 },
  "san-remo": { name: "San Remo – 5,65 mts", basePrice: 200, price: "200€", duration: "4h", isBoat: true, price4h: 200, price8h: 285, maxPeople: 6 },
  "saver": { name: "Saver – 5,80 mts", basePrice: 210, price: "210€", duration: "4h", isBoat: true, price4h: 210, price8h: 300, maxPeople: 6 },
  "selva": { name: "Selva – 5,80 mts", basePrice: 220, price: "220€", duration: "4h", isBoat: true, price4h: 220, price8h: 310, maxPeople: 7 },
  "bayliner": { name: "Bayliner – 5,70 mts", basePrice: 220, price: "220€", duration: "4h", isBoat: true, price4h: 220, price8h: 310, maxPeople: 7 },
  "nireus": { name: "Nireus – 5,70 mts", basePrice: 230, price: "230€", duration: "4h", isBoat: true, price4h: 230, price8h: 320, maxPeople: 8 },
  "sacs": { name: "Sacs – 6 mts", basePrice: 250, price: "250€", duration: "4h", isBoat: true, price4h: 250, price8h: 330, maxPeople: 10 },
  "bwa": { name: "BWA – 6,50 mts", basePrice: 285, price: "285€", duration: "4h", isBoat: true, price4h: 285, price8h: 360, maxPeople: 12 },
  "silver-marine": { name: "Silver Marine – 6,60 mts", basePrice: 330, price: "330€", duration: "4h", isBoat: true, price4h: 330, price8h: 410, maxPeople: 14 },
};

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00",
];

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

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const packId = searchParams.get("pack") || "30-minutos";

  useEffect(() => {
    if (user) {
      if (user.displayName) {
        const parts = user.displayName.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      }
      if (user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  const referralCode = searchParams.get("ref") || localStorage.getItem("royal_coast_referral") || null;
  const initialPack = allPacks[packId];

  const steps = [
    { id: 1, label: t("book_step_date"), icon: CalendarIcon },
    { id: 2, label: t("book_step_time"), icon: Clock },
    { id: 3, label: t("book_step_details"), icon: Users },
    { id: 4, label: t("book_step_confirm"), icon: Check },
  ];

  const [step, setStep] = useState(1);
  const [selectedInfoOption, setSelectedInfoOption] = useState<{name: string, details: string[]} | null>(null);
  const [extraPreferences, setExtraPreferences] = useState<Record<string, string>>({});

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>();
  const [people, setPeople] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+351");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sending, setSending] = useState(false);
  const [legalDialog, setLegalDialog] = useState<{ open: boolean; type: "terms" | "privacy" }>({ open: false, type: "terms" });
  const [boatDuration, setBoatDuration] = useState<"4h" | "8h">("4h");
  const [tourDurationIdx, setTourDurationIdx] = useState(0);
  const [extraDurations, setExtraDurations] = useState<Record<string, number>>({});
  const [extraStartTimes, setExtraStartTimes] = useState<Record<string, string>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, boolean>>({});
  const [numMotas, setNumMotas] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(set(new Date(), { month: 4, date: 1 }));

  const [dynamicPack, setDynamicPack] = useState<PackInfo | null>(null);
  const [loadingDynamic, setLoadingDynamic] = useState(!initialPack);

  useEffect(() => {
    const qTours = query(collection(db, "tours"), where("slug", "==", packId));
    const unsubscribe = onSnapshot(qTours, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const rawPacks = data.packs || [];
        const tPacks = rawPacks.map((p: any) => ({ duration: p.duration, price: p.price }));
        const firstPack = tPacks.length > 0 ? tPacks[0] : { duration: "Personalizado", price: "0€" };
        const bPrice = parseInt(firstPack.price.replace("€", "")) || 0;
        
        setDynamicPack({
          name: data.name,
          basePrice: bPrice,
          price: firstPack.price,
          duration: firstPack.duration,
          isTour: true,
          maxPeople: data.capacity || 10,
          tourPacks: tPacks,
          price4h: data.price4h ? parseInt(data.price4h.replace('€', '')) : undefined,
          price8h: data.price8h ? parseInt(data.price8h.replace('€', '')) : undefined,
          extraOptions: data.extraOptions || [],
          theme: data.theme || "ocean"
        });
        setLoadingDynamic(false);
      } else {
        // If not in tours, try boats
        const qBoats = query(collection(db, "boats"), where("slug", "==", packId));
        onSnapshot(qBoats, (sBoat) => {
          if (!sBoat.empty) {
            const data = sBoat.docs[0].data();
            setDynamicPack({
              name: data.name,
              basePrice: parseInt(data.price4h.replace('€', '')) || 0,
              price: data.price4h,
              duration: "4h",
              isBoat: true,
              price4h: parseInt(data.price4h.replace('€', '')) || 0,
              price8h: parseInt(data.price8h.replace('€', '')) || 0,
              maxPeople: data.capacity,
              extraOptions: data.extraOptions || [],
              theme: "ocean"
            });
          }
          setLoadingDynamic(false);
        });
      }
    }, (error) => {
      console.error("Error fetching pack:", error);
      setLoadingDynamic(false);
    });

    return () => unsubscribe();
  }, [packId]);

  const pack = dynamicPack || initialPack || allPacks["30-minutos"];

  const toggleExtra = (name: string) => {
    setSelectedExtras(prev => {
      const isSelecting = !prev[name];
      if (isSelecting) {
        // Find if it's perHour
        const opt = pack.extraOptions?.find(o => o.name === name);
        if (opt?.perHour) {
          setExtraDurations(d => ({ ...d, [name]: currentDurationHours }));
          if (time) {
            setExtraStartTimes(s => ({ ...s, [name]: time }));
          }
        }
      }
      return { ...prev, [name]: isSelecting };
    });
  };

  const getAvailableExtraStartTimes = (tripStart: string, tripDurationHours: number, extraDurationHours: number) => {
    if (!tripStart) return [];
    const [h, m] = tripStart.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + tripDurationHours * 60;
    const maxStartMinutes = endMinutes - extraDurationHours * 60;
    
    const times = [];
    for (let current = startMinutes; current <= maxStartMinutes; current += 30) {
      const hh = Math.floor(current / 60).toString().padStart(2, '0');
      const mm = (current % 60).toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
    return times;
  };

  const today = startOfToday();

  const isGroupPack = packId === "pack-grupo";
  const maxPeople = pack.isBoat ? (pack.maxPeople || 6) : (pack.isTour ? (pack.maxPeople || 10) : 4);

  const motaOptions = useMemo(() => {
    if (!pack.isJetski) return [];
    if (isGroupPack) return [4];
    if (people === 1) return [1];
    if (people === 2) return [1, 2];
    if (people === 3) return [2, 3];
    if (people === 4) return [2, 4];
    return [1];
  }, [pack.isJetski, isGroupPack, people]);

  const effectiveMotas = pack.isJetski ? (isGroupPack ? 4 : numMotas) : 1;
  const baseTotal = pack.isBoat
    ? (boatDuration === "8h" ? pack.price8h! : pack.price4h!)
    : pack.isTour && pack.tourPacks && pack.tourPacks.length > 0
    ? (parseInt(pack.tourPacks[tourDurationIdx]?.price?.replace("€", "")) || pack.basePrice)
    : pack.isJetski
    ? (isGroupPack ? pack.basePrice : effectiveMotas * pack.basePrice)
    : pack.basePrice;
  
  const currentDurationHours = useMemo(() => {
    if (pack.isBoat) return parseInt(boatDuration.replace("h", "")) || 4;
    if (pack.isTour && pack.tourPacks && pack.tourPacks[tourDurationIdx]) {
      const dur = pack.tourPacks[tourDurationIdx].duration;
      return parseInt(dur.replace("h", "")) || 1;
    }
    if (pack.duration?.includes("min")) {
       return parseInt(pack.duration.replace(" min", "")) / 60;
    }
    return 1;
  }, [pack, boatDuration, tourDurationIdx]);

  const extrasTotal = (pack.extraOptions || []).reduce((acc, opt) => {
    if (selectedExtras[opt.name]) {
      let optPrice = opt.price;
      if (opt.perPerson) optPrice *= people;
      if (opt.perHour) {
        const duration = extraDurations[opt.name] || currentDurationHours;
        optPrice *= duration;
      }
      return acc + optPrice;
    }
    return acc;
  }, 0);

  const totalPrice = baseTotal + extrasTotal;
  const totalPriceStr = `${totalPrice}€`;

  const canNext = useMemo(() => {
    if (step === 1) return !!date;
    if (step === 2) return !!time;
    if (step === 3) return firstName.trim().length > 0 && lastName.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0 && location.length > 0;
    return true;
  }, [step, date, time, firstName, lastName, phone, email, location]);

  const handleConfirm = async () => {
    setSending(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const fullPhone = `${phonePrefix} ${phone.trim()}`;
    const durationStr = pack.isBoat 
      ? ` (${boatDuration})` 
      : pack.isTour && pack.tourPacks 
      ? ` (${pack.tourPacks[tourDurationIdx]?.duration})` 
      : pack.isJetski 
      ? ` (${effectiveMotas} Motas)` 
      : "";
    
    const extrasStr = Object.keys(selectedExtras)
      .filter(name => selectedExtras[name])
      .map(name => {
        const pref = extraPreferences[name]?.trim();
        const start = extraStartTimes[name];
        const dur = extraDurations[name];
        let info = "";
        if (start && dur) info = ` (${start} @ ${dur}H)`;
        else if (dur) info = ` (${dur}H)`;
        return ` + ${name}${info}${pref ? ` [${pref}]` : ""}`;
      })
      .join("");
    
    const finalPackName = pack.name + durationStr + extrasStr;

    try {
      await addDoc(collection(db, "bookings"), {
        client_name: fullName,
        client_email: email,
        client_phone: fullPhone,
        pack_name: finalPackName,
        extra_preferences: extraPreferences,
        extra_durations: extraDurations,
        extra_start_times: extraStartTimes,
        booking_date: date ? format(date, "yyyy-MM-dd") : null,
        booking_time: time,
        num_people: people,
        location: location,
        referralCode: referralCode,
        price: totalPrice,
        created_at: new Date().toISOString(),
      });

      const templateParams = {
        to_name: fullName,
        to_email: email,
        pack_name: finalPackName,
        pack_price: totalPriceStr,
        booking_date: date ? format(date, "dd/MM/yyyy") : "",
        booking_time: time,
        num_people: people,
        phone: fullPhone,
        location: location,
        extras: extrasStr || "Nenhum",
      };

      await Promise.all([
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY),
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ...templateParams, to_email: ADMIN_EMAIL }, EMAILJS_PUBLIC_KEY),
      ]);

      toast({
        title: t("book_sent_toast"),
        description: t("book_sent_toast_desc"),
      });
      setStep(5);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: t("book_error_toast"),
        description: t("book_error_toast_desc"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loadingDynamic) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="font-display font-800 text-muted-foreground uppercase tracking-widest text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Header Section */}
      <div className={cn(
        "relative overflow-hidden py-12 md:py-16 transition-colors duration-700",
        pack.theme === "turquoise-light" && "bg-turquoise-light",
        pack.theme === "coral" && "bg-primary",
        pack.theme === "ocean" && "bg-ocean-deep",
        pack.theme === "turquoise-dark" && "bg-turquoise",
        !pack.theme && "bg-primary"
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-coral rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="container-max px-4 relative z-10">
          <button
            onClick={() => navigate("/")}
            className="group mb-8 flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/10 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-semibold uppercase tracking-widest">Voltar</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-coral font-bold uppercase tracking-[0.2em] text-xs mb-3">Reserva Online</p>
              <h1 className="font-display text-4xl md:text-5xl font-900 text-white tracking-tighter leading-none mb-4">
                {t("book_title")}
              </h1>
              <div className="flex items-center gap-4 text-white/70">
                <span className="bg-white/10 px-3 py-1 rounded-md text-xs font-bold border border-white/10">{pack.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                <span className="text-xl font-display font-800 text-white">{totalPriceStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -translate-y-8">
        {/* Stepper */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 mb-10 border border-border/50">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center flex-1 relative">
                <div className="flex items-center w-full">
                  <div className={cn("hidden md:block flex-1 h-[2px]", i === 0 ? "opacity-0" : step >= s.id ? (pack.theme === "coral" ? "bg-primary" : "bg-primary") : "bg-muted")} />
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: step === s.id ? 1.1 : 1,
                      borderColor: step > s.id 
                        ? (pack.theme === "turquoise-light" ? "var(--turquoise-light)" : pack.theme === "turquoise-dark" ? "var(--turquoise)" : "var(--secondary)") 
                        : step === s.id 
                        ? (pack.theme === "turquoise-light" ? "var(--turquoise-light)" : pack.theme === "turquoise-dark" ? "var(--turquoise)" : "var(--primary)") 
                        : "rgb(229 231 235)",
                      color: step > s.id 
                        ? (pack.theme === "turquoise-light" ? "var(--turquoise-light)" : pack.theme === "turquoise-dark" ? "var(--turquoise)" : "var(--secondary)") 
                        : step === s.id 
                        ? (pack.theme === "turquoise-light" ? "var(--turquoise-light)" : pack.theme === "turquoise-dark" ? "var(--turquoise)" : "var(--primary)") 
                        : "rgb(156 163 175)"
                    }}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center bg-white border-2 font-display font-800 text-sm transition-all z-10",
                      step === s.id ? "shadow-xl shadow-primary/10" : "shadow-sm"
                    )}
                  >
                    {step > s.id ? <Check size={20} strokeWidth={3} /> : <s.icon size={20} strokeWidth={2.5} />}
                  </motion.div>
                  <div className={cn("hidden md:block flex-1 h-[2px]", i === steps.length - 1 ? "opacity-0" : step > s.id ? "bg-primary" : "bg-muted")} />
                </div>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest mt-3 font-900 transition-colors",
                  step >= s.id ? (pack.theme === "turquoise-light" ? "text-turquoise-light" : pack.theme === "turquoise-dark" ? "text-turquoise" : "text-primary") : "text-muted-foreground/60"
                )}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/5 p-8 border border-border/40 w-full max-w-md">
                  <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-6">
                    <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
                      <CalendarIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-800 text-foreground leading-tight">{t("book_choose_day")}</h2>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Disponibilidade Real</p>
                    </div>
                  </div>
                  
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => isBefore(d, today)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    fromMonth={set(new Date(), { month: 4, date: 1 })}
                    toMonth={set(new Date(), { month: 8, date: 30 })}
                    locale={pt}
                    className="p-0 scale-[0.9] sm:scale-100"
                    classNames={{
                      day_selected: "bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30",
                      day_today: "text-coral font-bold",
                      day: "h-10 w-10 md:h-14 md:w-14 p-0 font-display font-700 text-sm md:text-base aria-selected:opacity-100 hover:bg-muted rounded-xl transition-all",
                      head_row: "flex w-full mt-2 justify-between",
                      head_cell: "text-muted-foreground font-bold text-[10px] uppercase tracking-widest w-10 md:w-14 pb-4 text-center",
                      row: "flex w-full mt-2 justify-between",
                    }}
                  />
                </div>
                {date && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-primary font-display font-800 text-sm uppercase tracking-wider">
                      {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 p-8 border border-border/40 w-full max-w-2xl mx-auto">
                  <div className="flex items-center gap-3 mb-10 border-b border-border/50 pb-6">
                    <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
                      <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-800 text-foreground leading-tight">{t("book_choose_time")}</h2>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Horário local de Setúbal</p>
                    </div>
                  </div>

                  {pack.isBoat && (
                    <div className="mb-10 p-2 bg-muted/30 rounded-3xl flex gap-2">
                       {(['4h', '8h'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setBoatDuration(d);
                              setTime(undefined);
                            }}
                            className={cn(
                              "flex-1 py-4 px-4 rounded-2xl font-display font-900 text-xs uppercase tracking-widest transition-all duration-300",
                              boatDuration === d
                                ? "bg-white text-primary shadow-xl shadow-black/5"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {d === "4h" ? t("boat_half_day") : t("boat_full_day")}
                          </button>
                        ))}
                    </div>
                  )}

                  {pack.isTour && pack.tourPacks && (
                    <div className="mb-10 space-y-4">
                      <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Duração do Passeio</label>
                      <div className="flex flex-wrap gap-2">
                         {pack.tourPacks.map((p, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setTourDurationIdx(idx);
                                setTime(undefined);
                              }}
                              className={cn(
                                "py-3 px-5 sm:py-4 sm:px-6 rounded-2xl font-display font-900 text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                tourDurationIdx === idx
                                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              )}
                            >
                              <span>{p.duration}</span>
                              <span className={cn("text-[10px] sm:text-xs", tourDurationIdx === idx ? "text-white/80" : "text-primary/60")}>— {p.price}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {timeSlots.map((ts) => {
                      const isSelected = time === ts;
                      let durationInMinutes = 60;
                      if (pack.isBoat) {
                        durationInMinutes = boatDuration === "4h" ? 240 : 480;
                      } else if (pack.isTour && pack.tourPacks) {
                        const match = pack.tourPacks[tourDurationIdx]?.duration.match(/(\d+)/);
                        durationInMinutes = match ? parseInt(match[0]) * 60 : 120;
                      } else {
                        durationInMinutes = (packId === "1-hora" || packId === "pack-grupo" || packId === "experiencia-sunset" ? 60 : packId === "30-minutos" ? 30 : 15);
                      }
                      
                      let isInRange = false;
                      if (time && (pack.isBoat || pack.isTour)) {
                        const startIndex = timeSlots.indexOf(time);
                        const currentIndex = timeSlots.indexOf(ts);
                        const slotsNeeded = durationInMinutes / 30;
                        if (startIndex !== -1 && currentIndex >= startIndex && currentIndex <= slotsNeeded + startIndex) {
                          isInRange = true;
                        }
                      }

                      const tsIdx = timeSlots.indexOf(ts);
                      const closingIdx = timeSlots.indexOf("20:00");
                      const slotsNeeded = durationInMinutes / 30;
                      const isDisabled = tsIdx + slotsNeeded > closingIdx;

                      return (
                        <button
                          key={ts}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && setTime(ts)}
                          className={cn(
                            "py-4 rounded-2xl font-display font-800 text-sm transition-all duration-300 border relative",
                            isSelected
                              ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.05] z-10"
                              : isInRange
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : isDisabled
                              ? "bg-white border-border/30 text-muted-foreground/40 cursor-not-allowed"
                              : "bg-white border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          )}
                        >
                          {ts}
                        </button>
                      );
                    })}
                  </div>

                  {time && (pack.isBoat || pack.isTour) && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                    >
                      Reserva das {time} até às {
                        (() => {
                          const idx = timeSlots.indexOf(time);
                          let durationInMinutes = 60;
                          if (pack.isBoat) {
                            durationInMinutes = boatDuration === "4h" ? 240 : 480;
                          } else if (pack.isTour && pack.tourPacks) {
                            const match = pack.tourPacks[tourDurationIdx]?.duration.match(/(\d+)/);
                            durationInMinutes = match ? parseInt(match[0]) * 60 : 120;
                          }
                          const slotsNeeded = durationInMinutes / 30;
                          const endIdx = idx + slotsNeeded;
                          return timeSlots[endIdx] || "Fim do dia";
                        })()
                      }
                    </motion.p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 p-8 md:p-10 border border-border/40">
                  <div className="flex items-center gap-3 mb-10 border-b border-border/50 pb-6">
                    <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-800 text-foreground leading-tight">{t("book_your_details")}</h2>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Informações para o Voucher</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] mb-3 ml-1">{t("book_location")}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { value: "Porto de Setúbal", label: "Porto de Setúbal" },
                          { value: "Porto de Tróia", label: "Porto de Tróia" },
                        ].map((loc) => (
                          <button
                            key={loc.value}
                            type="button"
                            onClick={() => setLocation(loc.value)}
                            className={cn(
                              "py-3.5 px-4 rounded-2xl font-display font-800 text-sm transition-all border duration-300",
                              location === loc.value
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white border-border text-muted-foreground hover:bg-muted/50"
                            )}
                          >
                            {loc.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Primeiro Nome</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted/30 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Ex: João"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Apelido</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted/30 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Ex: Silva"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">{t("book_phone")}</label>
                      <div className="flex gap-2">
                        <select 
                          value={phonePrefix}
                          onChange={(e) => setPhonePrefix(e.target.value)}
                          className="w-[100px] h-[54px] rounded-2xl border border-border bg-muted/30 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all px-3 appearance-none cursor-pointer"
                        >
                          {countryPrefixes.map(cp => (
                            <option key={cp.code} value={cp.code}>
                              {cp.flag} {cp.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 h-[54px] px-5 rounded-2xl border border-border bg-muted/30 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                          placeholder="9XX XXX XXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">{t("book_email")}</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted/30 text-foreground text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                          placeholder="o.teu@email.com"
                        />
                      </div>
                    </div>

                    <div className="pt-4 space-y-6">
                      <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                        <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] mb-4">{t("book_num_people")}</label>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setPeople(Math.max(1, people - 1))}
                            className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors"
                          >
                            −
                          </button>
                          <span className="font-display text-2xl font-900 text-foreground">{people}</span>
                          <button
                            type="button"
                            onClick={() => setPeople(Math.min(maxPeople, people + 1))}
                            className="w-12 h-12 rounded-xl bg-white shadow-sm border border-border flex items-center justify-center text-xl font-bold hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {pack.isJetski && !isGroupPack && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">Quantas Motas desejam?</label>
                          <div className="grid grid-cols-2 gap-3">
                            {motaOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setNumMotas(opt)}
                                className={cn(
                                  "py-4 rounded-2xl font-display font-800 text-sm transition-all border",
                                  numMotas === opt
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border-border text-muted-foreground hover:bg-primary/5 hover:border-primary/30"
                                )}
                              >
                                {opt} {opt === 1 ? "Mota" : "Motas"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-4">
                      {pack.extraOptions && pack.extraOptions.length > 0 && (
                        <div className="space-y-4">
                          <label className="block text-[10px] font-900 text-muted-foreground uppercase tracking-[0.2em] ml-1">Extras Opcionais</label>
                          {pack.extraOptions.map((opt, i) => (
                            <div key={i} className="space-y-3">
                              <label 
                                className={cn(
                                  "flex items-center gap-3 sm:gap-4 cursor-pointer select-none rounded-[1.5rem] p-4 sm:p-6 border-2 transition-all duration-300",
                                  selectedExtras[opt.name] ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "bg-white border-border hover:border-primary/20"
                                )}
                              >
                                <Checkbox
                                  checked={selectedExtras[opt.name] || false}
                                  onCheckedChange={() => toggleExtra(opt.name)}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg data-[state=checked]:bg-primary"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="font-display font-800 text-sm sm:text-base text-foreground block truncate sm:whitespace-normal">{opt.name}</span>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                    {opt.perPerson && opt.perHour ? "Valor por pessoa/hora" : opt.perPerson ? "Valor por pessoa" : opt.perHour ? "Valor por hora" : "Preço fixo p/ pack"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right shrink-0">
                                    <span className="font-display font-900 text-primary text-lg sm:text-xl">
                                      +{
                                        opt.perPerson && opt.perHour ? (opt.price * people * (extraDurations[opt.name] || currentDurationHours)) :
                                        opt.perPerson ? (opt.price * people) :
                                        opt.perHour ? (opt.price * (extraDurations[opt.name] || currentDurationHours)) :
                                        opt.price
                                      }€
                                    </span>
                                    {(opt.perPerson || opt.perHour) && (
                                      <span className="block text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                        {opt.price}€ {opt.perPerson ? "/ pessoa" : ""} {opt.perHour ? "/ hora" : ""}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {selectedExtras[opt.name] && (
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setSelectedInfoOption({name: opt.name, details: opt.details || []});
                                      }}
                                      className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-95"
                                    >
                                      <ChevronRight size={18} />
                                    </button>
                                  )}
                                </div>
                              </label>

                              {selectedExtras[opt.name] && (opt.perHour || (opt.details && opt.details.length > 0)) && (
                                <div className="mt-3 pl-12 pr-4 py-4 bg-primary/5 rounded-[1.5rem] border border-primary/10 animate-in slide-in-from-top-1 transition-all space-y-4">
                                  {/* Selectors for Hourly Extras */}
                                  {opt.perHour && (
                                    <div className="space-y-4 border-b border-primary/10 pb-4 mb-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Duração do serviço:</span>
                                          <p className="text-[9px] text-muted-foreground font-semibold italic">Quantas horas queres o serviço?</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-primary/10 shadow-sm self-start">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const curr = extraDurations[opt.name] || currentDurationHours;
                                              if (curr > 1) {
                                                setExtraDurations(d => ({ ...d, [opt.name]: curr - 1 }));
                                              }
                                            }}
                                            className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                                          >
                                            <Minus size={14} strokeWidth={3} />
                                          </button>
                                          <span className="font-display font-900 text-sm text-primary w-12 text-center">
                                            {extraDurations[opt.name] || currentDurationHours}H
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const curr = extraDurations[opt.name] || currentDurationHours;
                                              if (curr < currentDurationHours) {
                                                setExtraDurations(d => ({ ...d, [opt.name]: curr + 1 }));
                                              }
                                            }}
                                            className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                                          >
                                            <Plus size={14} strokeWidth={3} />
                                          </button>
                                        </div>
                                      </div>

                                      {time && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Hora de Início:</span>
                                            <p className="text-[9px] text-muted-foreground font-semibold italic">A que horas deve começar?</p>
                                          </div>
                                          <div className="w-full sm:w-32">
                                            <Select 
                                              value={extraStartTimes[opt.name] || time} 
                                              onValueChange={(val) => setExtraStartTimes(s => ({ ...s, [opt.name]: val }))}
                                            >
                                              <SelectTrigger className="h-10 rounded-xl bg-white border-primary/10 text-xs font-bold text-primary">
                                                <SelectValue placeholder="Início" />
                                              </SelectTrigger>
                                              <SelectContent className="rounded-xl border-primary/10 shadow-xl">
                                                {getAvailableExtraStartTimes(time, currentDurationHours, extraDurations[opt.name] || currentDurationHours).map(t => (
                                                  <SelectItem key={t} value={t} className="text-xs font-medium focus:bg-primary/5 focus:text-primary rounded-lg">
                                                    {t}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {opt.details && opt.details.length > 0 && (
                                    <div>
                                      <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest block mb-2 px-1">Inclui:</span>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
                                        {opt.details.map((detail, dIdx) => (
                                          <div key={dIdx} className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-turquoise" />
                                            <span className="text-[10px] sm:text-xs font-semibold text-foreground/70">{detail}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!pack.extraOptions || pack.extraOptions.length === 0 && (
                        <div className="pt-2 text-center">
                          <p className="text-xs text-muted-foreground italic">Nenhuma opção extra disponível para este pack.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Dialog open={!!selectedInfoOption} onOpenChange={(open) => !open && setSelectedInfoOption(null)}>
              <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2rem]">
                <div className="p-8">
                  <DialogHeader className="mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Info size={24} />
                    </div>
                    <DialogTitle className="font-display text-2xl font-800 text-foreground">
                      {selectedInfoOption?.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                      Detalhes do Serviço
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block border-b border-primary/10 pb-2 mb-3">O que está incluído:</span>
                      <ul className="space-y-2.5">
                        {selectedInfoOption?.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-foreground/80 font-medium">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-turquoise shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <label className="text-[10px] font-bold text-foreground uppercase tracking-widest block mb-2">Preferências ou Pedidos Especiais:</label>
                      <Textarea 
                        placeholder={selectedInfoOption?.name.toLowerCase().includes("dj") 
                          ? "Ex: Estilos musicais preferidos, músicas que não podem faltar, ou algum pedido técnico..." 
                          : "Ex: Alergias, bebidas preferidas, ou algum pedido em particular..."
                        }
                        className="text-xs min-h-[80px] rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20"
                        value={selectedInfoOption ? (extraPreferences[selectedInfoOption.name] || "") : ""}
                        onChange={(e) => {
                          if (selectedInfoOption) {
                            setExtraPreferences(prev => ({
                              ...prev,
                              [selectedInfoOption.name]: e.target.value
                            }));
                          }
                        }}
                      />
                      {!selectedInfoOption?.name.toLowerCase().includes("dj") && (
                        <p className="mt-3 text-[9px] font-bold text-amber-600 uppercase leading-relaxed flex gap-2 items-start">
                          <div className="w-1 h-1 rounded-full bg-amber-500 mt-1 shrink-0" />
                          Nota: Dependendo dos artigos ou pedidos escolhidos, o preço final do serviço poderá sofrer variações.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      if (selectedInfoOption) {
                        setSelectedExtras(prev => ({ ...prev, [selectedInfoOption.name]: true }));
                      }
                      setSelectedInfoOption(null);
                    }}
                    className="w-full mt-8 h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Confirmar e Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {step === 4 && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-border/40">
                  <div className={cn(
                    "p-8 text-white relative overflow-hidden",
                    pack.theme === "turquoise-light" && "bg-turquoise-light",
                    pack.theme === "coral" && "sunset-gradient",
                    pack.theme === "ocean" && "ocean-gradient",
                    pack.theme === "turquoise-dark" && "turquoise-gradient",
                    !pack.theme && "bg-primary"
                  )}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Anchor size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-900 uppercase tracking-[0.3em] text-white/60 mb-2">Voucher de Experiência</p>
                        <h2 className="font-display text-3xl font-900 tracking-tighter leading-none">{pack.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.keys(selectedExtras).map(name => 
                            selectedExtras[name] && (
                              <span key={name} className="inline-block bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-sm">
                                {name}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-900 uppercase tracking-[0.3em] text-white/60 mb-1">Total a Pagar</p>
                        <p className="text-4xl font-display font-900 leading-none">{totalPriceStr}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-10 space-y-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                      {[
                        { icon: CalendarIcon, label: t("book_date"), value: date ? format(date, "dd/MM/yyyy") : "" },
                        { icon: Clock, label: t("book_time"), value: time || "" },
                        { icon: Users, label: t("book_people"), value: `${people} Pessoas` },
                        { icon: Anchor, label: t("book_location"), value: location },
                        { icon: Mail, label: "Contacto", value: `${phonePrefix} ${phone}` },
                        ...(pack.isJetski ? [{ icon: Gauge, label: t("book_jetskis"), value: `${effectiveMotas} Motas` }] : []),
                        { icon: Users, label: "Titular", value: `${firstName} ${lastName}` },
                      ].map((r, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="flex items-center gap-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground mb-2">
                            <r.icon size={12} className="text-primary" />
                            {r.label}
                          </label>
                          <p className="font-display font-900 text-foreground text-sm uppercase tracking-tight">{r.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted p-6 rounded-2xl border border-border/50">
                      <h4 className="text-[10px] font-900 uppercase tracking-widest text-muted-foreground mb-4">Informações Importantes</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-3 text-xs font-semibold text-foreground/70">
                          <Check size={14} className="text-primary" /> Sugerimos chegar 15 min antes da hora marcada
                        </li>
                        <li className="flex items-center gap-3 text-xs font-semibold text-foreground/70">
                          <Check size={14} className="text-primary" /> Apresenta este voucher (digital) no local
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <label className="flex items-start gap-4 cursor-pointer select-none group">
                        <div className="mt-1">
                          <Checkbox
                            checked={acceptedTerms}
                            onCheckedChange={(v) => setAcceptedTerms(v === true)}
                            className="w-5 h-5 rounded-md data-[state=checked]:bg-primary"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium leading-relaxed group-hover:text-foreground transition-colors">
                          {t("book_accept_terms")}{" "}
                          <button type="button" onClick={() => setLegalDialog({ open: true, type: "terms" })} className="text-primary font-bold hover:underline">
                            {t("book_terms")}
                          </button>{" "}
                          {t("book_and")}{" "}
                          <button type="button" onClick={() => setLegalDialog({ open: true, type: "privacy" })} className="text-primary font-bold hover:underline">
                            {t("book_privacy")}
                          </button>.
                        </span>
                      </label>

                      <button
                        onClick={handleConfirm}
                        disabled={sending || !acceptedTerms}
                        className={cn(
                          "w-full text-white py-6 rounded-2xl font-display font-900 uppercase tracking-widest text-sm shadow-xl transition-all hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group",
                          pack.theme === "turquoise-light" && "bg-turquoise-light hover:shadow-turquoise-light/30",
                          pack.theme === "coral" && "sunset-gradient hover:shadow-coral/30",
                          pack.theme === "ocean" && "ocean-gradient hover:shadow-ocean/30",
                          pack.theme === "turquoise-dark" && "turquoise-gradient hover:shadow-turquoise/30",
                          !pack.theme && "bg-primary"
                        )}
                      >
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} className="group-hover:translate-x-1 transition-transform" />}
                        {sending ? t("book_sending") : t("book_confirm")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in-95 duration-500">
                <div className="relative mb-12 flex justify-center">
                  <div className="absolute inset-0 bg-secondary/10 rounded-full blur-3xl scale-150"></div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="w-24 h-24 rounded-[2rem] bg-secondary text-white flex items-center justify-center shadow-2xl relative z-10"
                  >
                    <Check size={48} strokeWidth={3} />
                  </motion.div>
                </div>
                
                <h2 className="font-display text-4xl font-900 text-foreground mb-4 tracking-tighter">{t("book_success_title")}</h2>
                <p className="text-muted-foreground text-lg font-medium mb-12 max-w-md mx-auto">
                  {t("book_success_desc")} <span className="text-primary font-bold underline">{email}</span>. Prepara-te para a aventura!
                </p>
                
                <button
                  onClick={() => navigate("/")}
                  className="bg-foreground text-white px-10 py-5 rounded-2xl font-display font-900 uppercase tracking-widest text-xs shadow-2xl hover:bg-foreground/90 transition-all hover:scale-105"
                >
                  {t("book_back_home")}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Sticky Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-border/50 z-50 md:relative md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 md:mt-10 md:mb-12">
          <div className="max-w-md mx-auto flex justify-between gap-4">
            {step > 1 && step < 5 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-xl font-display font-600 text-sm bg-card border border-border/50 shadow-sm text-foreground hover:bg-muted transition-all flex-1 md:flex-none text-center"
              >
                {t("book_back")}
              </button>
            )}
            {step < 4 && (
              <button
                onClick={() => {
                  if (canNext) {
                    setStep(step + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    toast({
                      title: "Campos em falta",
                      description: "Por favor preencha todos os campos obrigatórios para avançar.",
                      variant: "destructive"
                    });
                  }
                }}
                className={cn(
                  "px-8 py-3 rounded-xl font-display font-700 text-sm transition-all flex-1 md:flex-none text-center",
                  canNext
                    ? (
                      pack.theme === "turquoise-light" ? "bg-turquoise-light text-white shadow-lg shadow-turquoise-light/20" :
                      pack.theme === "coral" ? "sunset-gradient text-white shadow-lg shadow-coral/20" :
                      pack.theme === "ocean" ? "ocean-gradient text-white shadow-lg shadow-ocean/20" :
                      pack.theme === "turquoise-dark" ? "turquoise-gradient text-white shadow-lg shadow-turquoise/20" :
                      "ocean-gradient text-primary-foreground shadow-ocean"
                    )
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                )}
              >
                {t("book_next")}
              </button>
            )}
          </div>
        </div>
        <div className="h-24 md:hidden" /> {/* Spacer for sticky button */}
      </div>

      <LegalDialog
        open={legalDialog.open}
        onOpenChange={(open) => setLegalDialog((prev) => ({ ...prev, open }))}
        type={legalDialog.type}
      />
    </div>
  );
};

export default Booking;
