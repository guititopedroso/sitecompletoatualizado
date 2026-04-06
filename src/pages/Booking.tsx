import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, CalendarIcon, Clock, Check, Users, Mail, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isBefore, startOfToday, set } from "date-fns";
import { pt } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import emailjs from "@emailjs/browser";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
  "pack-grupo": { name: "Jet Ski – Pack Grupo", basePrice: 400, price: "400€", duration: "1h" },
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

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const packId = searchParams.get("pack") || "30-minutos";
  const referralCode = searchParams.get("ref") || null;
  const pack = allPacks[packId] || allPacks["30-minutos"];

  const steps = [
    { id: 1, label: t("book_step_date") },
    { id: 2, label: t("book_step_time") },
    { id: 3, label: t("book_step_details") },
    { id: 4, label: t("book_step_confirm") },
  ];

  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [people, setPeople] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const maxPeople = pack.isBoat ? (pack.maxPeople || 6) : pack.isJetski ? numMotas * 2 : 6;
  const minMotasNeeded = pack.isJetski ? Math.ceil(people / 2) : 1;
  const effectiveMotas = pack.isJetski ? Math.max(numMotas, minMotasNeeded) : 1;
  const baseTotal = pack.isBoat
    ? (boatDuration === "8h" ? pack.price8h! : pack.price4h!)
    : pack.isJetski
    ? effectiveMotas * pack.basePrice
    : pack.basePrice;
  const totalPrice = baseTotal + (packFotos ? 15 : 0);
  const totalPriceStr = `${totalPrice}€`;

  const canNext = useMemo(() => {
    if (step === 1) return !!date;
    if (step === 2) return !!time;
    if (step === 3) return name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0 && location.length > 0;
    return true;
  }, [step, date, time, name, phone, email, location]);

  const handleConfirm = async () => {
    setSending(true);
    const templateParams = {
      to_name: name,
      to_email: email,
      pack_name: pack.name + (packFotos ? " + Pack Fotos" : ""),
      pack_price: totalPriceStr,
      booking_date: date ? format(date, "dd/MM/yyyy") : "",
      booking_time: time,
      num_people: people,
      phone: phone,
      location: location,
    };
    try {
      await Promise.all([
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY),
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { ...templateParams, to_email: ADMIN_EMAIL }, EMAILJS_PUBLIC_KEY),
      ]);

      // Save booking to Supabase
      await supabase.from("bookings").insert({
        client_name: name,
        client_email: email,
        client_phone: phone,
        pack_name: pack.name + (packFotos ? " + Pack Fotos" : ""),
        booking_date: date ? format(date, "yyyy-MM-dd") : null,
        booking_time: time,
        num_people: people,
        location: location,
        referral_code: referralCode,
        price: totalPrice, // Guardar o preço exato da reserva
      });

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
            <h1 className="font-display text-xl font-800 text-primary-foreground">{t("book_title")}</h1>
            <p className="text-primary-foreground/70 text-sm">{pack.name} — {totalPriceStr}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-display font-700 text-sm transition-all",
                    step > s.id
                      ? "bg-secondary text-secondary-foreground"
                      : step === s.id
                      ? "ocean-gradient text-primary-foreground shadow-ocean"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check size={18} /> : s.id}
                </div>
                <span className={cn(
                  "text-xs mt-1.5 font-display font-600",
                  step >= s.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 rounded-full transition-all",
                  step > s.id ? "bg-secondary" : "bg-border"
                )} />
              )}
            </div>
          ))}
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
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                  <CalendarIcon size={20} className="text-coral" />
                  <h2 className="font-display text-2xl font-800 text-foreground">{t("book_choose_day")}</h2>
                </div>
                <div className="bg-card rounded-2xl shadow-card p-4 inline-block">
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
                    className="p-3 pointer-events-auto"
                  />
                </div>
                {date && (
                  <p className="mt-4 text-foreground font-display font-600">
                    {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Clock size={20} className="text-coral" />
                  <h2 className="font-display text-2xl font-800 text-foreground">{t("book_choose_time")}</h2>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-lg mx-auto">
                  {timeSlots.map((ts) => (
                    <button
                      key={ts}
                      onClick={() => setTime(ts)}
                      className={cn(
                        "py-3 rounded-xl font-display font-600 text-sm transition-all",
                        time === ts
                          ? "ocean-gradient text-primary-foreground shadow-ocean scale-105"
                          : "bg-card text-foreground shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                      )}
                    >
                      {ts}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-md mx-auto space-y-5">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Users size={20} className="text-coral" />
                  <h2 className="font-display text-2xl font-800 text-foreground">{t("book_your_details")}</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-display">{t("book_location")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "Porto de Setúbal", label: "Porto de Setúbal" },
                      { value: "Porto de Tróia", label: "Porto de Tróia" },
                    ].map((loc) => (
                      <button
                        key={loc.value}
                        type="button"
                        onClick={() => setLocation(loc.value)}
                        className={cn(
                          "py-3 px-4 rounded-xl font-display font-600 text-sm transition-all",
                          location === loc.value
                            ? "ocean-gradient text-primary-foreground shadow-ocean scale-[1.02]"
                            : "bg-card text-foreground shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                        )}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("book_name")}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
                    placeholder={t("book_name_ph")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("book_email")}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
                    placeholder="o.teu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("book_phone")}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
                    placeholder="+351 9XX XXX XXX"
                  />
                </div>

                {pack.isBoat && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 font-display">{t("book_duration")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['4h', '8h'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setBoatDuration(d)}
                        className={cn(
                          "py-3 px-4 rounded-xl font-display font-600 text-sm transition-all",
                          boatDuration === d
                            ? "ocean-gradient text-primary-foreground shadow-ocean scale-[1.02]"
                            : "bg-card text-foreground shadow-card hover:shadow-card-hover hover:-translate-y-0.5"
                        )}
                      >
                        {d === "4h" ? t("boat_half_day") : t("boat_full_day")} — {d === "4h" ? `${pack.price4h}€` : `${pack.price8h}€`}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                <div>
                  <div className={pack.isJetski ? "grid grid-cols-2 gap-6" : ""}>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("book_num_people")}</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPeople(Math.max(1, people - 1))}
                          className="w-10 h-10 rounded-xl bg-card shadow-card text-foreground font-display font-700 hover:bg-muted transition-colors"
                        >
                          −
                        </button>
                        <span className="font-display text-xl font-800 text-foreground w-8 text-center">{people}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(maxPeople, people + 1);
                            setPeople(next);
                            if (pack.isJetski) {
                              const needed = Math.ceil(next / 2);
                              if (needed > numMotas) setNumMotas(needed);
                            }
                          }}
                          className="w-10 h-10 rounded-xl bg-card shadow-card text-foreground font-display font-700 hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {pack.isJetski && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 font-display">Motas de água</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setNumMotas(Math.max(minMotasNeeded, numMotas - 1))}
                            className="w-10 h-10 rounded-xl bg-card shadow-card text-foreground font-display font-700 hover:bg-muted transition-colors"
                          >
                            −
                          </button>
                          <span className="font-display text-xl font-800 text-foreground w-8 text-center">{effectiveMotas}</span>
                          <button
                            type="button"
                            onClick={() => setNumMotas(Math.min(4, numMotas + 1))}
                            className="w-10 h-10 rounded-xl bg-card shadow-card text-foreground font-display font-700 hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {pack.isJetski && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("book_max_2_per_jet")} · {effectiveMotas} {effectiveMotas === 1 ? t("book_jetski_singular") : t("book_jetski_plural")} × {pack.basePrice}€ = <strong className="text-foreground">{effectiveMotas * pack.basePrice}€</strong>
                      {packFotos && <span> + 15€ fotos = <strong className="text-foreground">{totalPriceStr}</strong></span>}
                    </p>
                  )}
                  {pack.isBoat && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("book_max_capacity")}: {maxPeople} {t("boat_people")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer select-none bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all">
                    <Checkbox
                      checked={packFotos}
                      onCheckedChange={(v) => setPackFotos(v === true)}
                    />
                    <div className="flex-1">
                      <span className="font-display font-600 text-sm text-foreground">{t("exp_photos")}</span>
                      <span className="text-xs text-muted-foreground block">{t("book_pack_fotos_desc")}</span>
                    </div>
                    <span className="font-display font-700 text-sm text-secondary">+15€</span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Check size={20} className="text-coral" />
                  <h2 className="font-display text-2xl font-800 text-foreground">{t("book_summary")}</h2>
                </div>

                <div className="bg-card rounded-2xl shadow-card p-6 space-y-4">
                  {[
                    { label: t("book_experience"), value: pack.name + (packFotos ? " + Pack Fotos" : "") },
                    ...(pack.isBoat ? [{ label: t("book_duration"), value: boatDuration === "4h" ? t("boat_half_day") : t("boat_full_day") }] : []),
                    { label: t("book_price"), value: totalPriceStr + (packFotos ? ` (incl. Pack Fotos +15€)` : "") },
                    ...(pack.isJetski ? [{ label: t("book_jetskis"), value: `${effectiveMotas}` }] : []),
                    { label: t("book_location"), value: location },
                    { label: t("book_date"), value: date ? format(date, "dd/MM/yyyy") : "" },
                    { label: t("book_time"), value: time || "" },
                    { label: t("book_people"), value: `${people}` },
                    { label: t("book_name"), value: name },
                    { label: t("book_email"), value: email },
                    { label: t("book_phone"), value: phone },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{r.label}</span>
                      <span className="font-display font-700 text-foreground text-sm">{r.value}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(v) => setAcceptedTerms(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground leading-snug">
                    {t("book_accept_terms")}{" "}
                    <button type="button" onClick={() => setLegalDialog({ open: true, type: "terms" })} className="text-secondary underline hover:text-secondary/80">
                      {t("book_terms")}
                    </button>{" "}
                    {t("book_and")}{" "}
                    <button type="button" onClick={() => setLegalDialog({ open: true, type: "privacy" })} className="text-secondary underline hover:text-secondary/80">
                      {t("book_privacy")}
                    </button>.
                  </span>
                </label>

                <button
                  onClick={handleConfirm}
                  disabled={sending || !acceptedTerms}
                  className="w-full mt-4 sunset-gradient text-accent-foreground py-4 rounded-xl font-display font-700 text-sm shadow-coral hover:opacity-90 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {sending ? t("book_sending") : t("book_confirm")}
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                  <Check size={40} className="text-secondary" />
                </div>
                <h2 className="font-display text-2xl font-800 text-foreground mb-2">{t("book_success_title")}</h2>
                <p className="text-muted-foreground mb-8">
                  {t("book_success_desc")} <strong className="text-foreground">{email}</strong>.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="ocean-gradient text-primary-foreground px-8 py-3 rounded-xl font-display font-700 text-sm shadow-ocean hover:scale-[1.02] transition-all"
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
