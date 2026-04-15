import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Clock, Check, Users, Mail, Loader2, Anchor, Gauge } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isBefore, startOfToday, set } from "date-fns";
import { pt } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
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
  price4h?: number;
  price8h?: number;
  maxPeople?: number;
};

const allPacks: Record<string, PackInfo> = {
  "15-minutos": { name: "Jet Ski – 15 Minutos", basePrice: 50, price: "50€", duration: "15 min", isJetski: true },
  "30-minutos": { name: "Jet Ski – 30 Minutos", basePrice: 80, price: "80€", duration: "30 min", isJetski: true },
  "1-hora": { name: "Jet Ski – 1 Hora", basePrice: 120, price: "120€", duration: "1h", isJetski: true },
  "pack-grupo": { name: "Jet Ski – Pack Grupo", basePrice: 400, price: "400€", duration: "1h", isJetski: true },
  "experiencia-sunset": { name: "Experiência Sunset", basePrice: 150, price: "150€", duration: "1h" },
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
  "18:00", "18:30",
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
  const packId = searchParams.get("pack") || "30-minutos";
  const referralCode = searchParams.get("ref") || null;
  const pack = allPacks[packId] || allPacks["30-minutos"];

  const steps = [
    { id: 1, label: t("book_step_date"), icon: CalendarIcon },
    { id: 2, label: t("book_step_time"), icon: Clock },
    { id: 3, label: t("book_step_details"), icon: Users },
    { id: 4, label: t("book_step_confirm"), icon: Check },
  ];

  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
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
  const [packFotos, setPackFotos] = useState(false);
  const [numMotas, setNumMotas] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(set(new Date(), { month: 4, date: 1 }));

  const today = startOfToday();

  const isGroupPack = packId === "pack-grupo";
  const maxPeople = pack.isBoat ? (pack.maxPeople || 6) : 4;

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
    : pack.isJetski
    ? (isGroupPack ? pack.basePrice : effectiveMotas * pack.basePrice)
    : pack.basePrice;
  const totalPrice = baseTotal + (packFotos ? 15 : 0);
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
    try {
      await addDoc(collection(db, "bookings"), {
        client_name: fullName,
        client_email: email,
        client_phone: fullPhone,
        pack_name: pack.name + (packFotos ? " + Pack Fotos" : ""),
        booking_date: date ? format(date, "yyyy-MM-dd") : null,
        booking_time: time,
        num_people: people,
        location: location,
        referral_code: referralCode,
        price: totalPrice,
        created_at: new Date().toISOString(),
      });

      const templateParams = {
        to_name: fullName,
        to_email: email,
        pack_name: pack.name + (packFotos ? " + Pack Fotos" : ""),
        pack_price: totalPriceStr,
        booking_date: date ? format(date, "dd/MM/yyyy") : "",
        booking_time: time,
        num_people: people,
        phone: fullPhone,
        location: location,
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

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-primary py-12 md:py-16">
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
                <span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
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
                  <div className={cn("hidden md:block flex-1 h-[2px]", i === 0 ? "opacity-0" : step >= s.id ? "bg-primary" : "bg-muted")} />
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: step === s.id ? 1.1 : 1,
                      borderColor: step > s.id ? "var(--secondary)" : step === s.id ? "var(--primary)" : "rgb(229 231 235)",
                      color: step > s.id ? "var(--secondary)" : step === s.id ? "var(--primary)" : "rgb(156 163 175)"
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
                  step >= s.id ? "text-primary" : "text-muted-foreground/60"
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
                    className="p-0"
                    classNames={{
                      day_selected: "bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30",
                      day_today: "text-coral font-bold",
                      day: "h-12 w-12 md:h-14 md:w-14 p-0 font-display font-700 text-base aria-selected:opacity-100 hover:bg-muted rounded-xl transition-all",
                      head_row: "flex w-full mt-2 justify-between",
                      head_cell: "text-muted-foreground font-bold text-[10px] uppercase tracking-widest w-12 md:w-14 pb-4 text-center",
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
                              setTime(undefined); // Reset time when duration changes
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

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {timeSlots.map((ts) => {
                      const isSelected = time === ts;
                      const durationInMinutes = pack.isBoat ? (boatDuration === "4h" ? 240 : 480) : (packId === "1-hora" || packId === "pack-grupo" || packId === "experiencia-sunset" ? 60 : packId === "30-minutos" ? 30 : 15);
                      
                      // Check if this slot belongs to the range of the selected start time
                      let isInRange = false;
                      if (time && pack.isBoat) {
                        const startIndex = timeSlots.indexOf(time);
                        const currentIndex = timeSlots.indexOf(ts);
                        const slotsNeeded = durationInMinutes / 30;
                        if (currentIndex >= startIndex && currentIndex <= slotsNeeded + startIndex) {
                          isInRange = true;
                        }
                      }

                      return (
                        <button
                          key={ts}
                          onClick={() => setTime(ts)}
                          className={cn(
                            "py-4 rounded-2xl font-display font-800 text-sm transition-all duration-300 border relative",
                            isSelected
                              ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.05] z-10"
                              : isInRange
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : "bg-white border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          )}
                        >
                          {ts}
                        </button>
                      );
                    })}
                  </div>

                  {time && pack.isBoat && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                    >
                      Reserva das {time} até às {
                        (() => {
                          const idx = timeSlots.indexOf(time);
                          const durationInMinutes = boatDuration === "4h" ? 240 : 480;
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
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: "Porto de Setúbal", label: "Porto de Setúbal" },
                          { value: "Porto de Tróia", label: "Porto de Tróia" },
                        ].map((loc) => (
                          <button
                            key={loc.value}
                            type="button"
                            onClick={() => setLocation(loc.value)}
                            className={cn(
                              "py-4 px-4 rounded-2xl font-display font-800 text-sm transition-all border duration-300",
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

                    <div className="pt-4">
                      <label 
                        className={cn(
                          "flex items-center gap-4 cursor-pointer select-none rounded-[1.5rem] p-6 border-2 transition-all duration-300",
                          packFotos ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "bg-white border-border hover:border-primary/20"
                        )}
                      >
                        <Checkbox
                          checked={packFotos}
                          onCheckedChange={(v) => setPackFotos(v === true)}
                          className="w-6 h-6 rounded-lg data-[state=checked]:bg-primary"
                        />
                        <div className="flex-1">
                          <span className="font-display font-800 text-base text-foreground block">{t("exp_photos")}</span>
                          <span className="text-xs text-muted-foreground font-medium">{t("book_pack_fotos_desc")}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-900 text-primary text-xl">+15€</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/5 overflow-hidden border border-border/40">
                  <div className="bg-primary p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Anchor size={120} strokeWidth={1} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-900 uppercase tracking-[0.3em] text-white/60 mb-2">Voucher de Experiência</p>
                        <h2 className="font-display text-3xl font-900 tracking-tighter leading-none">{pack.name}</h2>
                        {packFotos && <p className="text-coral font-bold text-xs uppercase mt-2">+ Pack Fotos Incluído</p>}
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
                        className="w-full sunset-gradient text-white py-6 rounded-2xl font-display font-900 uppercase tracking-widest text-sm shadow-xl shadow-coral/30 hover:shadow-coral/40 transition-all hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group"
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

        <div className="flex justify-between mt-10 max-w-md mx-auto">
          {step > 1 && step < 5 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl font-display font-600 text-sm bg-card shadow-card text-foreground hover:bg-muted transition-all"
            >
              {t("book_back")}
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className={cn(
                "px-8 py-3 rounded-xl font-display font-700 text-sm transition-all ml-auto",
                canNext
                  ? "ocean-gradient text-primary-foreground shadow-ocean hover:scale-[1.02]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {t("book_next")}
            </button>
          )}
        </div>
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
