import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LogOut, Loader2, MapPin, Phone, Mail, Users, Clock, Package, ChevronDown, Camera, UserCircle, CreditCard, Banknote, CheckCircle2, Link2, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";

const STAFF_PACKS = [
  { value: "Jet Ski – 15 Minutos", label: "Jet Ski – 15 min", category: "Jet Ski" },
  { value: "Jet Ski – 30 Minutos", label: "Jet Ski – 30 min", category: "Jet Ski" },
  { value: "Jet Ski – 1 Hora", label: "Jet Ski – 1 hora", category: "Jet Ski" },
  { value: "Jet Ski – Pack Grupo", label: "Jet Ski – Pack Grupo", category: "Jet Ski" },
];

const fallbackPriceMap: { [key: string]: number } = {
  "Jet Ski – 15 Minutos": 60, "Jet Ski – 30 Minutos": 90, "Jet Ski – 1 Hora": 150,
  "Jet Ski – Pack Grupo": 550, "Experiência Sunset": 150,
  "Kelt Azura – 5 mts": 190, "Cap Camarat – 5,15 mts": 200, "San Remo – 5,65 mts": 200,
  "Saver – 5,80 mts": 210, "Selva – 5,80 mts": 220, "Bayliner – 5,70 mts": 220,
  "Nireus – 5,70 mts": 230, "Sacs – 6 mts": 250, "BWA – 6,50 mts": 285, "Silver Marine – 6,60 mts": 330,
};

const PHOTO_PACK_PRICE = 15;

const getPriceFallback = (packName: string): number => {
  if (!packName) return 0;
  const hasPhotoPack = packName.includes(" + Pack Fotos");
  let mainPackName = packName.replace(" + Pack Fotos", "").trim();
  mainPackName = mainPackName.replace(/\s*\([^)]*\)/g, "").trim();
  
  // Special case: Pack Grupo now includes photos in its base price of 550
  if (mainPackName === "Jet Ski – Pack Grupo") {
    return 550;
  }
  
  const basePrice = fallbackPriceMap[mainPackName] || 0;
  return basePrice + (hasPhotoPack ? PHOTO_PACK_PRICE : 0);
};

const STAFF_ACCOUNTS = [
  { name: "Martim Paulino", password: "mprc2026" },
  { name: "Diana Bagorro", password: "dbrc2026" },
];

type Booking = {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  pack_name: string;
  booking_date: string;
  booking_time: string | null;
  num_people: number;
  location: string | null;
  created_at: string;
  created_by: string | null;
  payment_method: string | null;
  confirmed: boolean | null;
  price?: number;
  referralCode?: string;
  extras?: Record<string, boolean>;
  notes?: string;
};

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const Staff = () => {
  const [staffName, setStaffName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [boats, setBoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState({ 
    client_name: "", 
    pack_name: "", 
    booking_time: "10:00", 
    num_people: 2, 
    pack_fotos: false, 
    location: "Porto de Setúbal", 
    price: 0,
    referralCode: "",
    extras: {} as Record<string, boolean>,
    notes: "",
    duration: ""
  });
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void; confirmLabel?: string; variant?: "destructive" | "confirm" } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const savedStaff = sessionStorage.getItem("royal_staff_name");
    if (savedStaff) {
      setStaffName(savedStaff);
    }
  }, []);

  useEffect(() => {
    if (staffName) {
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;
      
      const q = query(
        collection(db, "bookings"),
        where("booking_date", ">=", startDate),
        where("booking_date", "<=", endDate)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          price: doc.data().price ?? getPriceFallback(doc.data().pack_name)
        })) as Booking[];
        setBookings(data.sort((a,b) => (a.booking_time || "").localeCompare(b.booking_time || "")));
        setLoading(false);
      });

      const unsubTours = onSnapshot(collection(db, "tours"), (snap) => {
        setTours(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubBoats = onSnapshot(collection(db, "boats"), (snap) => {
        setBoats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => {
        unsubscribe();
        unsubTours();
        unsubBoats();
      };
    }
  }, [staffName, year, month]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = STAFF_ACCOUNTS.find((a) => a.password === password);
    if (account) {
      setStaffName(account.name);
      sessionStorage.setItem("royal_staff_name", account.name);
      setError(false);
    } else {
      setError(true);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const addBooking = async () => {
    if (!selectedDate || !newBooking.client_name || !newBooking.pack_name) return;
    const durationStr = newBooking.duration ? ` (${newBooking.duration})` : "";
    const finalPackName = (newBooking.pack_fotos ? `${newBooking.pack_name}${durationStr} + Pack Fotos` : `${newBooking.pack_name}${durationStr}`);
    try {
      await addDoc(collection(db, "bookings"), {
        client_name: newBooking.client_name,
        pack_name: finalPackName,
        booking_date: selectedDate,
        booking_time: newBooking.booking_time,
        num_people: newBooking.num_people,
        location: newBooking.location,
        price: newBooking.price || getPriceFallback(finalPackName),
        referralCode: newBooking.referralCode || null,
        extras: newBooking.extras,
        notes: newBooking.notes || null,
        created_by: staffName,
        created_at: new Date().toISOString()
      });
      setNewBooking({ 
        client_name: "", 
        pack_name: "", 
        booking_time: "10:00", 
        num_people: 2, 
        pack_fotos: false, 
        location: "Porto de Setúbal", 
        price: 0,
        referralCode: "",
        extras: {},
        notes: "",
        duration: ""
      });
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error adding booking:", error);
    }
  };

  const removeBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bookings", id));
    } catch (error: any) {
      console.error("Error removing booking:", error);
    }
  };

  const setPaymentMethod = async (id: string, method: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), { payment_method: method });
    } catch (error: any) {
      console.error("Error setting payment method:", error);
    }
  };

  const confirmBooking = async (id: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), { confirmed: true });
    } catch (error: any) {
      console.error("Error confirming booking:", error);
    }
  };

  // Auto-delete unconfirmed past bookings
  const cleanupUnconfirmed = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const q = query(
        collection(db, "bookings"),
        where("booking_date", "<", todayStr),
        where("confirmed", "==", false)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, "bookings", document.id)));
      await Promise.all(deletePromises);
    } catch (error: any) {
      console.error("Error cleaning up:", error);
    }
  };

  useEffect(() => {
    if (staffName) cleanupUnconfirmed();
  }, [staffName]);

  const getBookingsForDate = (dateStr: string) => bookings.filter((b) => b.booking_date === dateStr);

  const formatDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  if (!staffName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="ocean-gradient rounded-2xl p-8 shadow-ocean text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Lock className="text-primary-foreground" size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground mb-2">
              Royal<span className="text-coral">Coast</span> Staff
            </h1>
            <p className="text-primary-foreground/60 text-sm mb-6">Área de empregados</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-center"
              />
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-coral text-sm">
                  Password incorreta
                </motion.p>
              )}
              <Button type="submit" className="w-full sunset-gradient text-accent-foreground font-semibold rounded-full">
                Entrar
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-primary-foreground/10">
              <button 
                onClick={() => window.location.href = "/"}
                className="text-primary-foreground/40 hover:text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <Home size={14} />
                Voltar ao site principal
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="ocean-gradient py-4 px-4 sm:px-6 shadow-ocean">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-primary-foreground" size={24} />
            <div>
              <h1 className="font-display text-xl font-bold text-primary-foreground">
                Royal<span className="text-coral">Coast</span> — Reservas
              </h1>
              <p className="text-primary-foreground/60 text-xs flex items-center gap-1">
                <UserCircle size={12} />
                {staffName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Home size={16} />
              <span className="hidden sm:inline ml-1">Voltar ao site</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { 
                setStaffName(null); 
                setPassword(""); 
                sessionStorage.removeItem("royal_staff_name");
              }}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline ml-1">Sair</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </Button>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {months[month]} {year}
              </h2>
              <button onClick={today} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ir para hoje
              </button>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight size={18} />
            </Button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDateStr(year, month, day);
                  const dayBookings = getBookingsForDate(dateStr);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasBookings = dayBookings.length > 0;

                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all text-sm font-medium relative ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : isToday
                          ? "border-accent bg-accent/10 text-accent"
                          : hasBookings
                          ? "border-secondary/40 bg-secondary/5 text-foreground"
                          : "border-border hover:border-muted-foreground/30 text-foreground"
                      }`}
                    >
                      <span className={isToday ? "font-bold" : ""}>{day}</span>
                      {hasBookings && (
                        <div className="flex gap-0.5">
                          {dayBookings.slice(0, 3).map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          ))}
                          {dayBookings.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{dayBookings.length - 3}</span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-accent bg-accent/10" />
                  Hoje
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  Com reserva
                </div>
              </div>
            </>
          )}
        </div>

        {/* Side panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate || "empty"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lg:w-96 shrink-0"
          >
            {selectedDate ? (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg text-foreground">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-PT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="sunset-gradient text-accent-foreground rounded-full">
                    <Plus size={14} />
                    Adicionar
                  </Button>
                </div>

                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
                        <Input
                          placeholder="Nome do cliente"
                          value={newBooking.client_name}
                          onChange={(e) => setNewBooking({ ...newBooking, client_name: e.target.value })}
                        />
                        <Select
                          value={newBooking.pack_name}
                          onValueChange={(val) => {
                            const boat = boats.find(b => b.name === val);
                            const tour = tours.find(t => t.name === val);
                            let duration = "";
                            let price = 0;

                            if (boat) {
                              duration = "4h";
                              price = parseInt(boat.price4h?.replace('€', '') || '0');
                            } else if (tour && tour.packs?.length > 0) {
                              duration = tour.packs[0].duration;
                              price = parseInt(tour.packs[0].price?.replace('€', '') || '0');
                            } else {
                              price = getPriceFallback(val);
                            }

                            setNewBooking({ ...newBooking, pack_name: val, duration, price });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar pack" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Jet Ski</div>
                            {STAFF_PACKS.filter(p => p.category === "Jet Ski").map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                            
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Passeios</div>
                            {tours.map(t => (
                              <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                            ))}

                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Barcos</div>
                            {boats.map(b => (
                              <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                            ))}

                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Outros</div>
                            {STAFF_PACKS.filter(p => p.category === "Experiência").map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Hora</label>
                            <Input
                              type="time"
                              value={newBooking.booking_time}
                              onChange={(e) => setNewBooking({ ...newBooking, booking_time: e.target.value })}
                            />
                          </div>
                          <div className="w-20">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Pax</label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={newBooking.num_people}
                              onChange={(e) => setNewBooking({ ...newBooking, num_people: parseInt(e.target.value) || 1 })}
                              placeholder="Pessoas"
                            />
                          </div>
                        </div>

                        {(() => {
                          const boat = boats.find(b => b.name === newBooking.pack_name);
                          const tour = tours.find(t => t.name === newBooking.pack_name);
                          
                          if (boat) {
                            return (
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                  <Clock size={12} /> Duração (Barco)
                                </label>
                                <Select 
                                  value={newBooking.duration || "4h"} 
                                  onValueChange={(v) => {
                                    const price = v === "8h" ? parseInt(boat.price8h?.replace('€', '') || '0') : parseInt(boat.price4h?.replace('€', '') || '0');
                                    setNewBooking({ ...newBooking, duration: v, price });
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="4h">Meio Dia (4h) — {boat.price4h}</SelectItem>
                                    <SelectItem value="8h">Dia Inteiro (8h) — {boat.price8h}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          
                          if (tour && tour.packs?.length > 0) {
                            return (
                              <div className="space-y-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                  <Clock size={12} /> Duração (Passeio)
                                </label>
                                <Select 
                                  value={newBooking.duration || tour.packs[0].duration} 
                                  onValueChange={(v) => {
                                    const pack = tour.packs.find((p: any) => p.duration === v);
                                    const price = parseInt(pack?.price?.replace('€', '') || '0');
                                    setNewBooking({ ...newBooking, duration: v, price });
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tour.packs.map((p: any) => (
                                      <SelectItem key={p.duration} value={p.duration}>
                                        {p.duration} — {p.price}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          
                          return null;
                        })()}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Preço €"
                              value={newBooking.price || ''}
                              onChange={(e) => setNewBooking({ ...newBooking, price: parseFloat(e.target.value) || 0 })}
                              className="pl-8"
                            />
                          </div>
                          <div className="relative">
                            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Referral"
                              value={newBooking.referralCode}
                              onChange={(e) => setNewBooking({ ...newBooking, referralCode: e.target.value })}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="staff-pack-fotos"
                            checked={newBooking.pack_name === "Jet Ski – Pack Grupo" ? true : newBooking.pack_fotos}
                            onCheckedChange={(checked) => setNewBooking({ ...newBooking, pack_fotos: !!checked })}
                            disabled={newBooking.pack_name === "Jet Ski – Pack Grupo"}
                          />
                          <label htmlFor="staff-pack-fotos" className="text-sm text-foreground flex items-center gap-1.5 cursor-pointer font-medium">
                            <Camera size={14} className="text-coral" />
                            {newBooking.pack_name === "Jet Ski – Pack Grupo" ? "Pack Fotos (Incluído)" : "Pack Fotos (+15€)"}
                          </label>
                        </div>

                        {(() => {
                          const pack = tours.find(t => t.name === newBooking.pack_name) || boats.find(b => b.name === newBooking.pack_name);
                          if (!pack?.extraOptions?.length) return null;
                          return (
                            <div className="space-y-2 pt-1 border-t border-border/30">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Extras Disponíveis</p>
                              <div className="grid grid-cols-1 gap-2">
                                {pack.extraOptions.map((opt: any) => (
                                  <div key={opt.name} className="flex items-center gap-2 bg-background/50 p-2 rounded-lg border border-border/30">
                                    <Checkbox
                                      id={`extra-${opt.name}`}
                                      checked={!!newBooking.extras[opt.name]}
                                      onCheckedChange={(checked) => setNewBooking({ 
                                        ...newBooking, 
                                        extras: { ...newBooking.extras, [opt.name]: !!checked } 
                                      })}
                                    />
                                    <label htmlFor={`extra-${opt.name}`} className="text-sm text-foreground flex-1 cursor-pointer">
                                      {opt.name}
                                      <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                                        (+{opt.price}€{opt.perPerson ? '/pax' : ''}{opt.perHour ? '/h' : ''})
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin size={12} />
                            Localização
                          </label>
                          <Select value={newBooking.location} onValueChange={(v) => setNewBooking({ ...newBooking, location: v })}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Porto de Setúbal">Porto de Setúbal</SelectItem>
                              <SelectItem value="Tróia">Tróia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            Notas / Comentários
                          </label>
                          <Textarea
                            placeholder="Notas adicionais sobre a reserva..."
                            value={newBooking.notes}
                            onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                            className="text-sm bg-background/50 border-border/30 resize-none h-20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <UserCircle size={12} />
                          Reserva registada por: <span className="font-medium text-foreground">{staffName}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={addBooking} size="sm" className="flex-1">Guardar</Button>
                          <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline">Cancelar</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Sem reservas neste dia</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBookings.map((b) => {
                      const isExpanded = expandedBooking === b.id;
                      return (
                        <motion.div
                          key={b.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="rounded-xl bg-muted/50 overflow-hidden group"
                        >
                          <button
                            onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/80 transition-colors"
                          >
                            <div className="w-1 h-10 rounded-full shrink-0" style={{ background: b.confirmed ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground) / 0.3)' }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm text-foreground truncate">{b.client_name}</p>
                                {b.confirmed && <CheckCircle2 size={14} className="text-secondary shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {b.pack_name.replace(" + Pack Fotos", "")} · {b.booking_time || "—"} · {b.num_people} {b.num_people === 1 ? "pessoa" : "pessoas"}
                                {b.pack_name.includes("Pack Fotos") && <Camera size={12} className="text-coral ml-1" />}
                              </p>
                            </div>
                            <ChevronDown
                              size={16}
                              className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-border/50 ml-4 mr-3">
                                  <div className="flex items-center gap-2 pt-2.5">
                                    <Package size={14} className="text-secondary shrink-0" />
                                    <span className="text-xs text-muted-foreground">Pack:</span>
                                    <span className="text-xs font-medium text-foreground">{b.pack_name}</span>
                                  </div>
                                  {b.pack_name.includes("Pack Fotos") && (
                                    <div className="flex items-center gap-2">
                                      <Camera size={14} className="text-coral shrink-0" />
                                      <span className="text-xs font-medium text-coral">Pack Fotos incluído</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-secondary shrink-0" />
                                    <span className="text-xs text-muted-foreground">Horário:</span>
                                    <span className="text-xs font-medium text-foreground">{b.booking_time || "Não definido"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users size={14} className="text-secondary shrink-0" />
                                    <span className="text-xs text-muted-foreground">Pessoas:</span>
                                    <span className="text-xs font-medium text-foreground">{b.num_people}</span>
                                  </div>
                                  {b.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin size={14} className="text-secondary shrink-0" />
                                      <span className="text-xs text-muted-foreground">Local:</span>
                                      <span className="text-xs font-medium text-foreground">{b.location}</span>
                                    </div>
                                  )}
                                  {b.client_email && (
                                    <div className="flex items-center gap-2">
                                      <Mail size={14} className="text-secondary shrink-0" />
                                      <span className="text-xs text-muted-foreground">Email:</span>
                                      <a href={`mailto:${b.client_email}`} className="text-xs font-medium text-primary hover:underline">{b.client_email}</a>
                                    </div>
                                  )}
                                  {b.client_phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone size={14} className="text-secondary shrink-0" />
                                      <span className="text-xs text-muted-foreground">Telefone:</span>
                                      <a href={`tel:${b.client_phone}`} className="text-xs font-medium text-primary hover:underline">{b.client_phone}</a>
                                    </div>
                                  )}
                                  {b.price && (
                                    <div className="flex items-center gap-2">
                                      <DollarSign size={14} className="text-secondary shrink-0" />
                                      <span className="text-xs text-muted-foreground">Preço Total:</span>
                                      <span className="text-xs font-medium text-foreground">{b.price}€</span>
                                    </div>
                                  )}
                                  {b.extras && Object.entries(b.extras).filter(([_, val]) => val).length > 0 && (
                                    <div className="flex flex-col gap-1.5 pt-1">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Extras Selecionados:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(b.extras)
                                          .filter(([_, val]) => val)
                                          .map(([name]) => (
                                            <span key={name} className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold border border-secondary/20">
                                              {name}
                                            </span>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                  {b.referralCode && (
                                    <div className="flex items-center gap-2">
                                      <Link2 size={14} className="text-secondary shrink-0" />
                                      <span className="text-xs text-muted-foreground">Referral:</span>
                                      <span className="text-xs font-medium text-foreground">{b.referralCode}</span>
                                    </div>
                                  )}
                                  {b.created_by && (
                                    <div className="flex items-center gap-2">
                                      <UserCircle size={14} className="text-accent shrink-0" />
                                      <span className="text-xs text-muted-foreground">Registado por:</span>
                                      <span className="text-xs font-medium text-foreground">{b.created_by}</span>
                                    </div>
                                  )}
                                  {b.created_at && (
                                    <div className="flex items-center gap-2">
                                      <CalendarDays size={14} className="text-muted-foreground/50 shrink-0" />
                                      <span className="text-xs text-muted-foreground">
                                        Reservado em: {new Date(b.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  )}

                                  {b.notes && (
                                    <div className="pt-2 border-t border-border/30">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Notas:</p>
                                      <p className="text-xs text-foreground italic bg-secondary/5 p-2 rounded-lg border border-secondary/10">"{b.notes}"</p>
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                      <CreditCard size={12} /> Método de pagamento:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        { value: "Dinheiro", icon: Banknote, label: "Dinheiro" },
                                        { value: "MB Way", icon: Phone, label: "MB Way" },
                                        { value: "Multibanco", icon: CreditCard, label: "Multibanco" },
                                      ].map((pm) => (
                                        <button
                                          key={pm.value}
                                          onClick={() => setPaymentMethod(b.id, pm.value)}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            b.payment_method === pm.value
                                              ? "ocean-gradient text-primary-foreground shadow-sm"
                                              : "bg-card border border-border text-foreground hover:bg-muted"
                                          }`}
                                        >
                                          <pm.icon size={13} />
                                          {pm.label}
                                        </button>
                                      ))}
                                    </div>
                                    {b.payment_method && (
                                      <p className="text-[10px] text-muted-foreground mt-1.5">
                                        Pago com: <strong className="text-foreground">{b.payment_method}</strong>
                                      </p>
                                    )}
                                  </div>

                                  {!b.confirmed && (
                                    <div className="pt-2 border-t border-border/50">
                                      <Button
                                        size="sm"
                                        onClick={() => setConfirmAction({
                                          title: "Finalizar reserva",
                                          description: `Confirmar que a reserva de ${b.client_name} foi paga e será efetuada?`,
                                          action: () => confirmBooking(b.id),
                                          confirmLabel: "Confirmar",
                                          variant: "confirm",
                                        })}
                                        className="w-full ocean-gradient text-primary-foreground rounded-lg font-display font-600"
                                      >
                                        <CheckCircle2 size={14} />
                                        Finalizar Reserva
                                      </Button>
                                    </div>
                                  )}
                                  {b.confirmed && (
                                    <div className="pt-2 border-t border-border/50 flex items-center gap-1.5 text-xs text-secondary font-medium">
                                      <CheckCircle2 size={14} />
                                      Reserva confirmada
                                    </div>
                                  )}

                                  {b.created_by && (
                                    <div className="pt-2 flex justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setConfirmAction({ title: "Remover reserva", description: `Tens a certeza que queres remover a reserva de ${b.client_name}?`, action: () => removeBooking(b.id) })}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7"
                                      >
                                        <Trash2 size={12} />
                                        Remover
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center text-muted-foreground">
                <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Seleciona um dia para ver ou adicionar reservas</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        onConfirm={() => { confirmAction?.action(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
        confirmLabel={confirmAction?.confirmLabel}
        variant={confirmAction?.variant}
      />
    </div>
  );
};

export default Staff;
