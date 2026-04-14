import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, LogOut, Loader2, MapPin, Phone, Mail, Users, Clock, Package, ChevronDown, Camera, UserCircle, Link2, Gift, Trophy, CreditCard, CheckCircle2, ImageIcon, DollarSign, Fuel, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import ConfirmDialog from "@/components/ConfirmDialog";
import AdminGallery from "./AdminGallery";
import AdminBoats from "./AdminBoats";
import EarningsChart from "../components/EarningsChart";
import { toast } from "@/hooks/use-toast";

const ADMIN_PASSWORD = "Guitacrapazes.101010";
const AUTH_KEY = "rc-admin-auth";

const PHOTO_PACK_PRICE = 15;
const fallbackPriceMap: { [key: string]: number } = {
  "Jet Ski – 15 Minutos": 50, "Jet Ski – 30 Minutos": 80, "Jet Ski – 1 Hora": 120,
  "Jet Ski – Pack Grupo": 400, "Experiência Sunset": 150,
  "Kelt Azura – 5 mts": 190, "Cap Camarat – 5,15 mts": 200, "San Remo – 5,65 mts": 200,
  "Saver – 5,80 mts": 210, "Selva – 5,80 mts": 220, "Bayliner – 5,70 mts": 220,
  "Nireus – 5,70 mts": 230, "Sacs – 6 mts": 250, "BWA – 6,50 mts": 285, "Silver Marine – 6,60 mts": 330,
};

const getPriceFallback = (packName: string): number => {
  if (!packName) return 0;
  const hasPhotoPack = packName.includes(" + Pack Fotos");
  const mainPackName = packName.replace(" + Pack Fotos", "").trim();
  const basePrice = fallbackPriceMap[mainPackName] || 0;
  return basePrice + (hasPhotoPack ? PHOTO_PACK_PRICE : 0);
};

type Booking = { id: string; client_name: string; client_email: string | null; client_phone: string | null; pack_name: string; booking_date: string; booking_time: string | null; num_people: number; location: string | null; created_at: string; created_by: string | null; payment_method: string | null; confirmed: boolean | null; referral_code?: string; price?: number; };
// CORREÇÃO: O ID é um número, não uma string.
type Expense = { id: number; date: string; type: 'gasolina' | 'manutencao'; amount: number; };

const months = [ "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro" ];
const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; }

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [newBooking, setNewBooking] = useState({ client_name: "", pack_name: "", booking_time: "10:00", num_people: 2, price: 0 });
  const [activePanel, setActivePanel] = useState("bookings");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; type: 'gasolina' | 'manutencao' | null; amount: number }>({ open: false, type: null, amount: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { const isAuthenticated = sessionStorage.getItem(AUTH_KEY) === "true"; setAuthenticated(isAuthenticated); }, []);

  const fetchAllData = () => {
    // For statistical earnings
    const qConfirmed = query(collection(db, "bookings"), where("confirmed", "==", true));
    const unsubAllBookings = onSnapshot(qConfirmed, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        price: doc.data().price ?? getPriceFallback(doc.data().pack_name)
      })) as Booking[];
      setAllBookings(data);
    });

    const qAllExpenses = query(collection(db, "expenses"));
    const unsubAllExpenses = onSnapshot(qAllExpenses, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setAllExpenses(data);
    });

    // For the calendar view (this month)
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;

    const qCalendarBookings = query(
      collection(db, "bookings"), 
      where("booking_date", ">=", startDate), 
      where("booking_date", "<=", endDate)
    );
    const unsubCalendarBookings = onSnapshot(qCalendarBookings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        price: doc.data().price ?? getPriceFallback(doc.data().pack_name)
      })) as Booking[];
      setBookings(data.sort((a,b) => (a.booking_time || "").localeCompare(b.booking_time || "")));
    });

    const qCalendarExpenses = query(
      collection(db, "expenses"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const unsubCalendarExpenses = onSnapshot(qCalendarExpenses, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setMonthlyExpenses(data);
    });

    return () => {
      unsubAllBookings();
      unsubAllExpenses();
      unsubCalendarBookings();
      unsubCalendarExpenses();
    };
  };

  useEffect(() => {
    if (authenticated) {
      const cleanup = fetchAllData();
      return cleanup;
    }
  }, [authenticated, year, month]);

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (password === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, "true"); setAuthenticated(true); setError(false); } else { setError(true); } };
  const handleLogout = () => { sessionStorage.removeItem(AUTH_KEY); setAuthenticated(false); };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const addBooking = async () => {
    if (!selectedDate || !newBooking.client_name || !newBooking.pack_name) return;
    try {
      await addDoc(collection(db, "bookings"), { 
        ...newBooking, 
        booking_date: selectedDate, 
        created_by: "Admin",
        created_at: new Date().toISOString(),
        confirmed: true
      });
      setNewBooking({ client_name: "", pack_name: "", booking_time: "10:00", num_people: 2, price: 0 }); 
      setShowAddForm(false); 
      toast({ title: "Reserva adicionada!" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar reserva", description: error.message, variant: "destructive" });
    }
  };

  const addExpense = async () => {
    if (!selectedDate || !expenseDialog.type || expenseDialog.amount <= 0) {
      toast({ title: "Valor inválido", description: "Por favor, insira um valor maior que zero.", variant: "destructive" }); return;
    }
    try {
      await addDoc(collection(db, "expenses"), { 
        date: selectedDate, 
        type: expenseDialog.type, 
        amount: expenseDialog.amount,
        created_at: new Date().toISOString()
      });
      toast({ title: "Despesa guardada!" }); 
      setExpenseDialog({ open: false, type: null, amount: 0 });
    } catch (error: any) {
      toast({ title: "Erro ao guardar despesa", description: error.message, variant: "destructive" });
    }
  };

  const removeBooking = async (id: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "bookings", id));
      toast({ title: "Reserva removida!" });
    } catch (error: any) {
      toast({ title: "Erro ao remover reserva", description: error.message, variant: "destructive" });
    }
  };

  const removeExpense = async (id: string) => {
    if (!id) {
        toast({ title: "Erro ao remover", description: "A despesa não tem um ID válido.", variant: "destructive" });
        return;
    }
    try {
      await deleteDoc(doc(db, "expenses", id));
      toast({ title: "Despesa removida!" });
    } catch (error: any) {
      toast({ title: "Erro ao remover despesa", description: error.message, variant: "destructive" });
    }
  };

  const getBookingsForDate = (dateStr: string) => bookings.filter((b) => b.booking_date === dateStr);
  const getExpensesForDate = (dateStr: string) => monthlyExpenses.filter((e) => e.date === dateStr);
  const formatDateStr = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];
  const selectedExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];
  
  const togglePanel = (panel: string) => { setActivePanel(activePanel === panel ? "bookings" : panel); if (panel === 'earnings' && activePanel !== 'earnings') fetchAllFinancialData(); };

  if (!authenticated) { return( <div className="min-h-screen bg-background flex items-center justify-center p-4"> <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} className="w-full max-w-sm"> <div className="ocean-gradient rounded-2xl p-8 shadow-ocean text-center"> <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-foreground/10 flex items-center justify-center"> <Lock className="text-primary-foreground" size={28}/> </div> <h1 className="font-display text-2xl font-bold text-primary-foreground mb-2"> Royal<span className="text-coral">Coast</span> Admin </h1> <p className="text-primary-foreground/60 text-sm mb-6">Área reservada</p> <form onSubmit={handleLogin} className="space-y-4"> <Input type="password" placeholder="Password" value={password} onChange={a=>{setPassword(a.target.value);setError(false)}} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-center"/> {error&&(<motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-coral text-sm"> Password incorreta </motion.p>)} <Button type="submit" className="w-full sunset-gradient text-accent-foreground font-semibold rounded-full"> Entrar </Button> </form> </div> </motion.div> </div> )}

  return (
    <div className="min-h-screen bg-background">
      <div className="ocean-gradient py-4 px-4 sm:px-6 shadow-ocean"> <div className="max-w-7xl mx-auto flex items-center justify-between"> <div className="flex items-center gap-3"> <CalendarDays className="text-primary-foreground" size={24}/> <h1 className="font-display text-xl font-bold text-primary-foreground"> Royal<span className="text-coral">Coast</span> — Admin </h1> </div> <div className="flex items-center gap-2"> <Button variant="ghost" size="sm" onClick={()=>togglePanel("earnings")} className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ${activePanel==="earnings"?"bg-primary-foreground/10":""}`}> <DollarSign size={16}/> <span className="hidden sm:inline ml-1">Ganhos</span> </Button> <Button variant="ghost" size="sm" onClick={()=>togglePanel("boats")} className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ${activePanel==="boats"?"bg-primary-foreground/10":""}`}> <Anchor size={16}/> <span className="hidden sm:inline ml-1">Barcos</span> </Button> <Button variant="ghost" size="sm" onClick={()=>togglePanel("gallery")} className={`text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ${activePanel==="gallery"?"bg-primary-foreground/10":""}`}> <ImageIcon size={16}/> <span className="hidden sm:inline ml-1">Galeria</span> </Button> <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"> <LogOut size={16}/> <span className="hidden sm:inline ml-1">Sair</span> </Button> </div> </div> </div>

      <AnimatePresence mode="wait">
        <motion.div key={activePanel} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
          {activePanel === "earnings" && ( <div className="max-w-7xl mx-auto p-4 sm:p-6"> <EarningsChart bookings={allBookings} expenses={allExpenses} /> </div> )}
          {activePanel === "boats" && ( <div className="max-w-7xl mx-auto p-4 sm:p-6"> <AdminBoats /> </div> )}
          {activePanel === "gallery" && ( <div className="max-w-7xl mx-auto p-4 sm:p-6"> <AdminGallery /> </div> )}
        </motion.div>
      </AnimatePresence>

      {activePanel === "bookings" && (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1"> <div className="flex items-center justify-between mb-6"> <Button variant="outline" size="icon" onClick={prevMonth}> <ChevronLeft size={18}/> </Button> <div className="text-center"> <h2 className="font-display text-2xl font-bold text-foreground"> {months[month]} {year} </h2> <button onClick={today} className="text-xs text-muted-foreground hover:text-foreground transition-colors"> Ir para hoje </button> </div> <Button variant="outline" size="icon" onClick={nextMonth}> <ChevronRight size={18}/> </Button> </div> {loading?(<div className="flex justify-center py-8"> <Loader2 className="animate-spin text-primary" size={24}/> </div>):(<> <div className="grid grid-cols-7 gap-1 mb-1"> {weekDays.map(a=>( <div key={a} className="text-center text-xs font-semibold text-muted-foreground py-2"> {a} </div> ))} </div> <div className="grid grid-cols-7 gap-1"> {Array.from({length:firstDay}).map((a,b)=>( <div key={`empty-${b}`} className="aspect-square"/> ))} {Array.from({length:daysInMonth}).map((a,b)=>{const c=b+1,d=formatDateStr(year,month,c),e=getBookingsForDate(d),f=d===todayStr,g=d===selectedDate,h=e.length>0,i=getExpensesForDate(d).length>0;return( <motion.button key={c} whileHover={{scale:1.05}} whileTap={{scale:.95}} onClick={()=>{setSelectedDate(d);setShowAddForm(false)}} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all text-sm font-medium relative ${g?"border-primary bg-primary/10 text-primary":f?"border-accent bg-accent/10 text-accent":(h||i)?"bg-card border-border":"border-border hover:border-muted-foreground/30 text-foreground"}`}> <span className={f?"font-bold":""}>{c}</span> <div className="flex items-center gap-1"> {h&&( <div className="w-1.5 h-1.5 rounded-full bg-secondary"/> )} {i&&( <div className="w-1.5 h-1.5 rounded-full bg-destructive"/> )} </div> </motion.button> )})} </div> <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground"> <div className="flex items-center gap-1.5"> <div className="w-3 h-3 rounded-full border-2 border-accent bg-accent/10"/> Hoje </div> <div className="flex items-center gap-1.5"> <div className="w-1.5 h-1.5 rounded-full bg-secondary"/> Reserva </div> <div className="flex items-center gap-1.5"> <div className="w-1.5 h-1.5 rounded-full bg-destructive"/> Despesa </div> </div> </>)} </div>

          <AnimatePresence mode="wait">
            <motion.div key={selectedDate || "empty"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="lg:w-96 shrink-0">
              {selectedDate ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4"> <h3 className="font-display font-bold text-lg text-foreground"> {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })} </h3> <div className="flex gap-2"> <Button size="sm" variant="outline" onClick={() => setExpenseDialog({ open: true, type: 'gasolina', amount: 0 })}><Fuel size={14} className="mr-1"/> Gasolina</Button> <Button size="sm" variant="outline" onClick={() => setExpenseDialog({ open: true, type: 'manutencao', amount: 0 })}><Wrench size={14} className="mr-1"/> Manutenção</Button> </div> </div>

                  <div className="flex items-center justify-between mb-4 border-t border-border pt-4"> <h4 className="font-display font-bold text-md text-foreground">Reservas</h4> <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="sunset-gradient text-accent-foreground rounded-full"> <Plus size={14} /> {showAddForm ? 'Fechar' : 'Adicionar'} </Button> </div>
                  <AnimatePresence> {showAddForm&&( <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mb-4"> <div className="space-y-3 p-4 bg-muted/50 rounded-xl"> <Input placeholder="Nome do cliente" value={newBooking.client_name} onChange={a=>setNewBooking({...newBooking,client_name:a.target.value})}/> <Input placeholder="Pack" value={newBooking.pack_name} onChange={a=>setNewBooking({...newBooking,pack_name:a.target.value})}/> <Input type="number" placeholder="Preço" value={newBooking.price||''} onChange={a=>setNewBooking({...newBooking,price:parseFloat(a.target.value)||0})}/> <div className="flex gap-2"> <Input type="time" value={newBooking.booking_time} onChange={a=>setNewBooking({...newBooking,booking_time:a.target.value})} className="flex-1"/> <Input type="number" min={1} value={newBooking.num_people} onChange={a=>setNewBooking({...newBooking,num_people:parseInt(a.target.value)||1})} className="w-20"/> </div> <div className="flex gap-2"> <Button onClick={addBooking} size="sm" className="flex-1">Guardar</Button> <Button onClick={()=>setShowAddForm(false)} size="sm" variant="outline">Cancelar</Button> </div> </div> </motion.div> )} </AnimatePresence>
                  
                  {selectedBookings.length === 0 ? ( <div className="text-center py-6 text-muted-foreground text-sm"> <p>Sem reservas neste dia.</p> </div> ) : ( <div className="space-y-2"> {selectedBookings.map(a=>{const b=expandedBooking===a.id;return( <motion.div key={a.id} layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="rounded-xl bg-muted/50 overflow-hidden group"> <button onClick={()=>setExpandedBooking(b?null:a.id)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/80 transition-colors"> <div className="w-1 h-10 rounded-full shrink-0" style={{background:a.confirmed?"hsl(var(--secondary))":"hsl(var(--muted-foreground) / 0.3)"}}/> <div className="flex-1 min-w-0"> <div className="flex items-center justify-between"> <p className="font-semibold text-sm text-foreground truncate">{a.client_name}</p> <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full leading-none ${a.confirmed?"bg-secondary/20 text-secondary":"bg-amber-500/20 text-amber-600"}`}> {a.confirmed?"Confirmada":"Pendente"} </span> </div> <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5"> {a.pack_name.replace(" + Pack Fotos","")} · {a.booking_time||"—"} <span className="text-muted-foreground/80">· {a.num_people}p</span> {a.pack_name.includes("Pack Fotos")&&<Camera size={12} className="text-coral ml-1"/>} </p> </div> <ChevronDown size={16} className={`text-muted-foreground transition-transform shrink-0 ${b?"rotate-180":""}`}/> </button> <AnimatePresence> {b&&( <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.2}} className="overflow-hidden"> <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-border/50 ml-4 mr-3"> <div className="flex items-center gap-2 pt-2.5"> <Package size={14} className="text-secondary shrink-0"/> <span className="text-xs font-medium text-foreground">{a.pack_name}</span> </div> {a.price > 0 && ( <div className="flex items-center gap-2"> <DollarSign size={14} className="text-secondary shrink-0" /> <span className="text-xs font-medium text-foreground">{a.price}€</span> </div> )} {a.client_email&&( <div className="flex items-center gap-2"> <Mail size={14} className="text-secondary shrink-0" /> <a href={`mailto:${a.client_email}`} className="text-xs font-medium text-primary hover:underline">{a.client_email}</a> </div> )} {a.client_phone&&( <div className="flex items-center gap-2"> <Phone size={14} className="text-secondary shrink-0" /> <a href={`tel:${a.client_phone}`} className="text-xs font-medium text-primary hover:underline">{a.client_phone}</a> </div> )} <div className="pt-2 flex justify-end"> <Button variant="ghost" size="sm" onClick={()=>setConfirmAction({title:"Remover reserva",description:`Tens a certeza que queres remover a reserva de ${a.client_name}?`,action:()=>removeBooking(a.id)})} className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7"> <Trash2 size={12}/> Remover </Button> </div> </div> </motion.div> )} </AnimatePresence> </motion.div> )})} </div> )}

                  {selectedExpenses.length > 0 && (
                    <div className="border-t border-border mt-4 pt-4">
                      <h4 className="font-display font-bold text-md text-foreground mb-2">Despesas</h4>
                      <div className="space-y-2">
                        {selectedExpenses.map(expense => (
                          <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 group">
                            <div className="flex items-center gap-3">
                              {expense.type === 'gasolina' ? <Fuel size={14} className="text-amber-500" /> : <Wrench size={14} className="text-sky-500" />}
                              <span className="text-sm font-medium text-foreground capitalize">{expense.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-red-600">-{expense.amount.toFixed(2)}€</span>
                                <button onClick={() => setConfirmAction({ title: "Remover despesa", description: `Tens a certeza que queres remover esta despesa de ${expense.amount}€?`, action: () => removeExpense(expense.id)})} className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12}/>
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : ( <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center text-muted-foreground"> <CalendarDays size={40} className="mx-auto mb-3 opacity-30"/> <p className="text-sm">Seleciona um dia para ver ou adicionar reservas.</p> </div> )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog open={!!confirmAction} title={confirmAction?.title || ""} description={confirmAction?.description || ""} onConfirm={() => { confirmAction?.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />
      <Dialog open={expenseDialog.open} onOpenChange={(open) => !open && setExpenseDialog({ ...expenseDialog, open: false })}><DialogContent><DialogHeader><DialogTitle>Adicionar Despesa de {expenseDialog.type === 'gasolina' ? 'Gasolina' : 'Manutenção'}</DialogTitle></DialogHeader><div className="py-4"><label htmlFor="expenseAmount" className="text-sm font-medium">Valor (€)</label><Input id="expenseAmount" type="number" placeholder="0.00" value={expenseDialog.amount || ''} onChange={(e) => setExpenseDialog({ ...expenseDialog, amount: parseFloat(e.target.value) || 0 })} className="mt-1" autoFocus /></div><DialogFooter><Button variant="outline" onClick={() => setExpenseDialog({ open: false, type: null, amount: 0 })}>Cancelar</Button><Button onClick={addExpense}>Guardar Despesa</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
};

export default Admin;
