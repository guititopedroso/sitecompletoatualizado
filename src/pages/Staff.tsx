import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LogOut, Loader2, MapPin, Phone, Mail, Users, Clock, Package, ChevronDown, Camera, UserCircle, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/ConfirmDialog";

const STAFF_PACKS = [
  { value: "Jet Ski – 15 Minutos", label: "Jet Ski – 15 min", category: "Jet Ski" },
  { value: "Jet Ski – 30 Minutos", label: "Jet Ski – 30 min", category: "Jet Ski" },
  { value: "Jet Ski – 1 Hora", label: "Jet Ski – 1 hora", category: "Jet Ski" },
  { value: "Jet Ski – Pack Grupo", label: "Jet Ski – Pack Grupo", category: "Jet Ski" },
  { value: "Experiência Sunset", label: "Experiência Sunset", category: "Experiência" },
  { value: "Kelt Azura – 5 mts", label: "Kelt Azura – 5 mts", category: "Barcos" },
  { value: "Cap Camarat – 5,15 mts", label: "Cap Camarat – 5,15 mts", category: "Barcos" },
  { value: "San Remo – 5,65 mts", label: "San Remo – 5,65 mts", category: "Barcos" },
  { value: "Saver – 5,80 mts", label: "Saver – 5,80 mts", category: "Barcos" },
  { value: "Selva – 5,80 mts", label: "Selva – 5,80 mts", category: "Barcos" },
  { value: "Bayliner – 5,70 mts", label: "Bayliner – 5,70 mts", category: "Barcos" },
  { value: "Nireus – 5,70 mts", label: "Nireus – 5,70 mts", category: "Barcos" },
  { value: "Sacs – 6 mts", label: "Sacs – 6 mts", category: "Barcos" },
  { value: "BWA – 6,50 mts", label: "BWA – 6,50 mts", category: "Barcos" },
  { value: "Silver Marine – 6,60 mts", label: "Silver Marine – 6,60 mts", category: "Barcos" },
];

const STAFF_ACCOUNTS = [
  { name: "Martim Paulino", password: "mpvj2026" },
  { name: "Diana Bagorro", password: "dbvj2026" },
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
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState({ client_name: "", pack_name: "", booking_time: "10:00", num_people: 2, pack_fotos: false, location: "Porto de Setúbal" });
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void; confirmLabel?: string; variant?: "destructive" | "confirm" } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchBookings = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .order("booking_time", { ascending: true });
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (staffName) fetchBookings();
  }, [staffName, year, month]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = STAFF_ACCOUNTS.find((a) => a.password === password);
    if (account) {
      setStaffName(account.name);
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
    const finalPackName = newBooking.pack_fotos ? `${newBooking.pack_name} + Pack Fotos` : newBooking.pack_name;
    await supabase.from("bookings").insert({
      client_name: newBooking.client_name,
      pack_name: finalPackName,
      booking_date: selectedDate,
      booking_time: newBooking.booking_time,
      num_people: newBooking.num_people,
      location: newBooking.location,
      created_by: staffName,
    });
    setNewBooking({ client_name: "", pack_name: "", booking_time: "10:00", num_people: 2, pack_fotos: false, location: "Porto de Setúbal" });
    setShowAddForm(false);
    fetchBookings();
  };

  const removeBooking = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
    fetchBookings();
  };

  const setPaymentMethod = async (id: string, method: string) => {
    await supabase.from("bookings").update({ payment_method: method }).eq("id", id);
    fetchBookings();
  };

  const confirmBooking = async (id: string) => {
    await supabase.from("bookings").update({ confirmed: true }).eq("id", id);
    fetchBookings();
  };

  // Auto-delete unconfirmed past bookings
  const cleanupUnconfirmed = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    await supabase
      .from("bookings")
      .delete()
      .lt("booking_date", todayStr)
      .or("confirmed.is.null,confirmed.eq.false");
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStaffName(null); setPassword(""); }}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline ml-1">Sair</span>
          </Button>
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
                          onValueChange={(val) => setNewBooking({ ...newBooking, pack_name: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar pack" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Jet Ski</div>
                            {STAFF_PACKS.filter(p => p.category === "Jet Ski").map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Experiência</div>
                            {STAFF_PACKS.filter(p => p.category === "Experiência").map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Barcos</div>
                            {STAFF_PACKS.filter(p => p.category === "Barcos").map(p => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            type="time"
                            value={newBooking.booking_time}
                            onChange={(e) => setNewBooking({ ...newBooking, booking_time: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={newBooking.num_people}
                            onChange={(e) => setNewBooking({ ...newBooking, num_people: parseInt(e.target.value) || 1 })}
                            className="w-20"
                            placeholder="Pessoas"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="staff-pack-fotos"
                            checked={newBooking.pack_fotos}
                            onCheckedChange={(checked) => setNewBooking({ ...newBooking, pack_fotos: !!checked })}
                          />
                          <label htmlFor="staff-pack-fotos" className="text-sm text-foreground flex items-center gap-1.5 cursor-pointer">
                            <Camera size={14} className="text-coral" />
                            Pack Fotos
                          </label>
                        </div>
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

                                  <div className="pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                      <CreditCard size={12} /> Método de pagamento:
                                    </span>
                                    <div className="flex gap-2">
                                      {[
                                        { value: "Dinheiro", icon: Banknote, label: "Dinheiro" },
                                        { value: "MB/MBWay", icon: CreditCard, label: "MB / MBWay" },
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
