import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, Loader2, Plus, X, Save, Edit2, GripVertical, ArrowUp, ArrowDown, Sparkles, Wand2, Anchor, Clock, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/ConfirmDialog";

// DnD Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Boat = {
  id: string;
  name: string;
  size: string;
  engine: string;
  capacity: number;
  price4h: string;
  price8h: string;
  images: string[];
  slug: string;
  range: "low" | "mid" | "high";
  order?: number;
  image?: string;
  created_at?: string;
  features?: string[];
  cost4h?: string;
  cost8h?: string;
  useMarkup4h?: boolean;
  useMarkup8h?: boolean;
  deliveryCost4h?: string;
  deliveryCost8h?: string;
  useDelivery4h?: boolean;
  useDelivery8h?: boolean;
  extraOptions?: ExtraOption[];
};

type ExtraOption = {
  name: string;
  price: number;
  perPerson: boolean;
  perHour: boolean;
  details?: string[];
};

const SortableBoat = ({ boat, startEdit, requestDelete }: { 
  boat: Boat, 
  startEdit: (b: Boat) => void, 
  requestDelete: (b: Boat) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group relative ${isDragging ? 'ring-2 ring-primary' : ''}`}>
      <div className="h-48 relative">
        <img src={boat.images?.[0] || boat.image || ""} alt={boat.name} className="w-full h-full object-cover" />
        <div {...attributes} {...listeners} className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab">
          <div className="bg-white/90 p-3 rounded-full shadow-xl"><GripVertical className="text-primary h-8 w-8" /></div>
        </div>
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-md" onClick={() => startEdit(boat)}><Edit2 size={18} /></Button>
          <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full shadow-md" onClick={() => requestDelete(boat)}><Trash2 size={18} /></Button>
        </div>
      </div>
      <div className="p-5">
        <h4 className="font-display font-bold text-xl text-foreground mb-1">{boat.name}</h4>
        <p className="text-sm text-muted-foreground mb-4 font-medium">{boat.size} · {boat.engine}</p>
        <div className="flex justify-between items-center text-sm font-black text-primary bg-primary/5 p-2 rounded-lg">
          <span>{boat.price4h} (4h)</span>
          <span>{boat.price8h} (8h)</span>
        </div>
      </div>
    </div>
  );
};

export default function AdminBoats() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Boat>>({
    name: "", size: "", engine: "", capacity: 2, price4h: "", price8h: "", images: [],
    range: "mid", features: [], cost4h: "", cost8h: "", useMarkup4h: false, useMarkup8h: false,
    deliveryCost4h: "", deliveryCost8h: "", useDelivery4h: false, useDelivery8h: false, extraOptions: []
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "boats"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Boat[];
      setBoats(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const callGroq = async (prompt: string): Promise<string[]> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('NO_KEY');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.split(';').map((s: any) => s.trim()).filter(Boolean) || [];
  };

  const generateFeaturesAI = async () => {
    if (!formData.name) return;
    setGeneratingAI('features');
    try {
      const prompt = `Gera 4 características premium para o barco "${formData.name}". Retorna itens curtos e sugestivos separados por ponto e vírgula (;).`;
      const res = await callGroq(prompt);
      setFormData(prev => ({ ...prev, features: [...new Set([...(prev.features || []), ...res])] }));
    } catch (e) {}
    setGeneratingAI(null);
  };

  const generateOptionDetailsAI = async (idx: number) => {
    const optName = formData.extraOptions?.[idx]?.name;
    if (!optName) return;
    setGeneratingAI(`opt-${idx}`);
    try {
      const prompt = `Gera 4 itens incluídos no serviço de "${optName}" para aluguer de barcos. Separa por ponto e vírgula (;).`;
      const res = await callGroq(prompt);
      const opts = [...(formData.extraOptions || [])];
      opts[idx].details = [...new Set([...(opts[idx].details || []), ...res])];
      setFormData(prev => ({ ...prev, extraOptions: opts }));
    } catch (e) {}
    setGeneratingAI(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const finalData = {
        ...formData,
        slug: formData.slug || (formData.name ? formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : ""),
        created_at: formData.created_at || new Date().toISOString(),
        order: formData.order ?? (boats.length > 0 ? Math.max(...boats.map(b => b.order || 0)) + 1 : 0),
        image: formData.images?.[0] || ""
      };

      let boatId = editingBoat?.id;
      if (editingBoat) await updateDoc(doc(db, "boats", editingBoat.id), finalData);
      else {
        const ref = await addDoc(collection(db, "boats"), finalData);
        boatId = ref.id;
      }

      // SINCRONIZAÇÃO MÁGICA
      const batch = writeBatch(db);
      for (const opt of (finalData.extraOptions || [])) {
        if (!opt.name) continue;
        const otherBoats = boats.filter(b => b.id !== boatId);
        otherBoats.forEach(b => {
          if (b.extraOptions?.some(e => e.name === opt.name)) {
            const updated = b.extraOptions.map(e => e.name === opt.name ? { ...opt } : e);
            batch.update(doc(db, "boats", b.id), { extraOptions: updated });
          }
        });
        const toursSnap = await getDocs(collection(db, "tours"));
        toursSnap.forEach(tDoc => {
          const tExtras = tDoc.data().extraOptions as any[] || [];
          if (tExtras.some(e => e.name === opt.name)) {
            const updated = tExtras.map(e => e.name === opt.name ? { ...opt } : e);
            batch.update(doc(db, "tours", tDoc.id), { extraOptions: updated });
          }
        });
      }
      await batch.commit();

      toast({ title: "✨ Guardado e Sincronizado!" });
      resetForm();
      setShowAddForm(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    }
    setUploading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "", size: "", engine: "", capacity: 2, price4h: "", price8h: "", images: [],
      range: "mid", features: [], cost4h: "", cost8h: "", useMarkup4h: false, useMarkup8h: false,
      deliveryCost4h: "", deliveryCost8h: "", useDelivery4h: false, useDelivery8h: false, extraOptions: []
    });
    setEditingBoat(null);
  };

  const startEdit = (b: Boat) => {
    setEditingBoat(b);
    setFormData(b);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requestDelete = (b: Boat) => {
    setConfirmAction({
      title: "Eliminar Barco",
      description: `Tens a certeza que queres eliminar o barco "${b.name}"?`,
      action: async () => {
        await deleteDoc(doc(db, "boats", b.id));
        toast({ title: "Barco Removido" });
      },
    });
  };

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `boats/${Date.now()}-${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    } catch (e) {}
    setUploading(false);
  };

  const updateBoatsOrder = async (newBoats: Boat[]) => {
    const batch = writeBatch(db);
    newBoats.forEach((b, i) => batch.update(doc(db, "boats", b.id), { order: i }));
    await batch.commit();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = boats.findIndex((b) => b.id === active.id);
      const newIndex = boats.findIndex((b) => b.id === over.id);
      const newBoats = arrayMove(boats, oldIndex, newIndex);
      setBoats(newBoats);
      updateBoatsOrder(newBoats);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary size-12" /></div>;

  return (
    <div className="w-full space-y-8 p-4 md:p-8 text-left">
      <div className="flex items-center justify-between border-b pb-8">
        <div className="flex items-center gap-4">
          <Anchor className="text-primary" size={32} />
          <div><h1 className="text-3xl font-display font-bold text-foreground">Frota Royal Coast</h1><p className="text-base text-muted-foreground font-medium">Gestão premium de embarcações e opcionais</p></div>
        </div>
        <Button onClick={() => { if(showAddForm) resetForm(); setShowAddForm(!showAddForm); }} className="sunset-gradient text-accent-foreground rounded-full h-14 px-8 text-lg font-bold shadow-xl">
          {showAddForm ? <X size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />} {showAddForm ? 'Cancelar Edição' : 'Adicionar Novo Barco'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-3xl p-8 space-y-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="space-y-2"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Nome do Barco</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-12 text-base font-medium bg-muted/20" /></div>
             <div className="space-y-2"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Tamanho</label><Input value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="h-12 text-base bg-muted/20" /></div>
             <div className="space-y-2"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Motorização</label><Input value={formData.engine} onChange={e => setFormData({...formData, engine: e.target.value})} className="h-12 text-base bg-muted/20" /></div>
             <div className="space-y-2"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Lotação Max</label><Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="h-12 text-base bg-muted/20 font-bold" /></div>
          </div>

          <div className="bg-muted/30 p-8 rounded-3xl border border-border/50 space-y-8">
             <div className="flex items-center gap-3 mb-2"><Anchor size={24} className="text-primary"/> <h3 className="text-lg font-display font-bold uppercase tracking-widest">Preçário, Custos e Markup</h3></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* 4H Section */}
                <div className="space-y-6 bg-background p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:border-primary/30">
                   <p className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2">Período de 4 Horas</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[11px] font-black uppercase text-muted-foreground">Custo Base (€)</label><Input type="number" value={(formData.cost4h || "").replace('€','')} onChange={e => {
                        const cost = Number(e.target.value);
                        const deliverCost = formData.useDelivery4h ? Number((formData.deliveryCost4h || "").replace('€', '')) : 0;
                        setFormData({...formData, cost4h: `${cost}€`, price4h: formData.useMarkup4h ? `${Math.ceil(cost*1.15) + deliverCost}€` : formData.price4h});
                      }} className="h-11 text-base font-bold text-muted-foreground" /></div>
                      <div className="space-y-2"><label className="text-[11px] font-black uppercase text-primary">Preço de Venda (€)</label><Input value={formData.price4h} onChange={e => setFormData({...formData, price4h: e.target.value})} className="h-11 text-lg font-black text-primary bg-primary/5 border-primary/20" /></div>
                   </div>
                   <div className="flex flex-col gap-4 pt-2">
                       <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={formData.useMarkup4h} onChange={e => {
                           const cost = Number((formData.cost4h || "").replace('€',''));
                           const delivery = formData.useDelivery4h ? Number((formData.deliveryCost4h || "").replace('€','')) : 0;
                           setFormData({...formData, useMarkup4h:e.target.checked, price4h: e.target.checked ? `${Math.ceil(cost*1.15) + delivery}€` : formData.price4h});
                       }} className="w-5 h-5 rounded border-border text-primary"/><span className="text-xs font-black uppercase text-muted-foreground group-hover:text-primary transition-colors italic">Auto Markup 15%</span></label>
                       
                       <div className="flex flex-col gap-3 p-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                           <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={formData.useDelivery4h} onChange={e => {
                               const cost = Number((formData.cost4h || "").replace('€',''));
                               const deliveryAmt = e.target.checked ? Number((formData.deliveryCost4h || "").replace('€','')) : 0;
                               setFormData({...formData, useDelivery4h:e.target.checked, price4h: formData.useMarkup4h ? `${Math.ceil(cost*1.15) + deliveryAmt}€` : formData.price4h});
                           }} className="w-5 h-5"/><span className="text-xs font-black uppercase text-muted-foreground group-hover:text-primary italic">Taxa de Deslocação</span></label>
                           {formData.useDelivery4h && <Input placeholder="Valor da Deslocação €" value={formData.deliveryCost4h} onChange={e => {
                               const cost = Number((formData.cost4h || "").replace('€',''));
                               const delivery = Number(e.target.value.replace('€', ''));
                               setFormData({...formData, deliveryCost4h: `${delivery}€`, price4h: formData.useMarkup4h ? `${Math.ceil(cost*1.15) + delivery}€` : formData.price4h});
                           }} className="h-10 text-sm font-bold w-full" />}
                       </div>
                   </div>
                </div>
                {/* 8H Section */}
                <div className="space-y-6 bg-background p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:border-secondary/40">
                   <p className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">Período de 8 Horas</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[11px] font-black uppercase text-muted-foreground">Custo Base (€)</label><Input type="number" value={(formData.cost8h || "").replace('€','')} onChange={e => {
                        const cost = Number(e.target.value);
                        const deliverCost = formData.useDelivery8h ? Number((formData.deliveryCost8h || "").replace('€', '')) : 0;
                        setFormData({...formData, cost8h: `${cost}€`, price8h: formData.useMarkup8h ? `${Math.ceil(cost*1.15) + deliverCost}€` : formData.price8h});
                      }} className="h-11 text-base font-bold text-muted-foreground" /></div>
                      <div className="space-y-2"><label className="text-[11px] font-black uppercase text-secondary">Preço de Venda (€)</label><Input value={formData.price8h} onChange={e => setFormData({...formData, price8h: e.target.value})} className="h-11 text-lg font-black text-secondary bg-secondary/5 border-secondary/20" /></div>
                   </div>
                   <div className="flex flex-col gap-4 pt-2">
                       <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={formData.useMarkup8h} onChange={e => {
                           const cost = Number((formData.cost8h || "").replace('€',''));
                           const delivery = formData.useDelivery8h ? Number((formData.deliveryCost8h || "").replace('€','')) : 0;
                           setFormData({...formData, useMarkup8h:e.target.checked, price8h: e.target.checked ? `${Math.ceil(cost*1.15) + delivery}€` : formData.price8h});
                       }} className="w-5 h-5 rounded border-border text-secondary"/><span className="text-xs font-black uppercase text-muted-foreground group-hover:text-secondary transition-colors italic">Auto Markup 15%</span></label>
                       
                       <div className="flex flex-col gap-3 p-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                           <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={formData.useDelivery8h} onChange={e => {
                               const cost = Number((formData.cost8h || "").replace('€',''));
                               const deliveryAmt = e.target.checked ? Number((formData.deliveryCost8h || "").replace('€','')) : 0;
                               setFormData({...formData, useDelivery8h:e.target.checked, price8h: formData.useMarkup8h ? `${Math.ceil(cost*1.15) + deliveryAmt}€` : formData.price8h});
                           }} className="w-5 h-5"/><span className="text-xs font-black uppercase text-muted-foreground group-hover:text-secondary italic">Taxa de Deslocação</span></label>
                           {formData.useDelivery8h && <Input placeholder="Valor da Deslocação €" value={formData.deliveryCost8h} onChange={e => {
                               const cost = Number((formData.cost8h || "").replace('€',''));
                               const delivery = Number(e.target.value.replace('€', ''));
                               setFormData({...formData, deliveryCost8h: `${delivery}€`, price8h: formData.useMarkup8h ? `${Math.ceil(cost*1.15) + delivery}€` : formData.price8h});
                           }} className="h-10 text-sm font-bold w-full" />}
                       </div>
                   </div>
                </div>
             </div>
          </div>

          {/* ... resto do ficheiro mantido ... */}
          <div className="bg-muted/30 p-8 rounded-3xl border border-border/50 space-y-6">
             <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-display font-bold uppercase tracking-widest flex items-center gap-3"><Sparkles size={24} className="text-secondary"/> Opções Extra (Sincronizadas)</h3><Button type="button" variant="outline" size="sm" onClick={() => setFormData(p => ({ ...p, extraOptions: [...(p.extraOptions || []), { name: "", price: 0, perPerson: false, perHour: false, details: [] }] }))} className="h-11 px-6 text-xs font-black uppercase rounded-xl border-secondary text-secondary shadow-sm transition-all hover:bg-secondary/10 hover:text-secondary shadow-sm transition-all"><Plus size={16} className="mr-2"/> Adicionar Opcional</Button></div>
             <p className="text-xs text-muted-foreground font-medium italic mb-6 flex items-center gap-2 px-1"><Info size={14} className="text-secondary"/> Royal Sync Ativo.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.extraOptions?.map((opt, idx) => (
                  <div key={idx} className="bg-background p-6 rounded-2xl border border-border/50 shadow-md relative group space-y-6 transition-all hover:shadow-lg">
                     <button type="button" onClick={() => setFormData(p => ({ ...p, extraOptions: p.extraOptions?.filter((_, i) => i !== idx) }))} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-40 group-hover:opacity-100 transition-all"><X size={20}/></button>
                     <div className="space-y-4">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground px-1">Nome da Opção</label><Input placeholder="Ex: DJ Profissional" value={opt.name} onChange={e => { const o = [...(formData.extraOptions || [])]; o[idx].name = e.target.value; setFormData({ ...formData, extraOptions: o }); }} className="h-11 text-base font-bold" /></div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground px-1">Preço (€)</label><Input type="number" value={opt.price} onChange={e => { const o = [...(formData.extraOptions || [])]; o[idx].price = Number(e.target.value); setFormData({ ...formData, extraOptions: o }); }} className="h-11 text-base font-black text-secondary bg-secondary/5" /></div>
                           <div className="flex flex-col gap-2 justify-center pt-5">
                              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={opt.perPerson} onChange={e => { const o = [...(formData.extraOptions || [])]; o[idx].perPerson = e.target.checked; setFormData({ ...formData, extraOptions: o }); }} className="w-5 h-5 rounded border-border text-secondary" /><span className="text-[11px] font-black uppercase text-muted-foreground">P/ Pessoa</span></label>
                              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={opt.perHour} onChange={e => { const o = [...(formData.extraOptions || [])]; o[idx].perHour = e.target.checked; setFormData({ ...formData, extraOptions: o }); }} className="w-5 h-5 rounded border-border text-secondary" /><span className="text-[11px] font-black uppercase text-muted-foreground">P/ Hora</span></label>
                           </div>
                        </div>
                     </div>
                     <div className="pt-6 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{opt.details?.length || 0} Detalhes</span>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-secondary hover:bg-secondary/10" onClick={() => generateOptionDetailsAI(idx)} disabled={!!generatingAI}>{generatingAI === `opt-${idx}` ? <Loader2 size={20} className="animate-spin"/> : <Wand2 size={20}/>}</Button>
                     </div>
                     <div className="space-y-4">
                        <Input placeholder="Detalhe + Enter..." className="h-10 text-sm bg-muted/10 border-dashed" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), (setFormData(p => { const o = [...(p.extraOptions || [])]; o[idx].details = [...(o[idx].details || []), e.currentTarget.value]; e.currentTarget.value = ""; return { ...p, extraOptions: o }; })))} />
                        <div className="flex flex-wrap gap-2">{opt.details?.map((d, di) => <span key={di} className="bg-muted px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-border/40 shrink-0">{d}<button type="button" onClick={() => setFormData(p => { const o = [...(p.extraOptions || [])]; o[idx].details = o[idx].details?.filter((_, idx2) => idx2 !== di); return { ...p, extraOptions: o }; })} className="hover:text-destructive"><X size={12}/></button></span>)}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between mb-2"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Destaques do Barco</label><Button type="button" variant="ghost" size="sm" onClick={generateFeaturesAI} className="h-11 px-6 text-xs font-black uppercase text-secondary hover:bg-secondary/5">{generatingAI==='features' ? <Loader2 size={16} className="animate-spin mr-2"/> : <Sparkles size={16} className="mr-2"/>} Sugerir com Sugestiva IA</Button></div>
             <div className="flex gap-4"><Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key==='Enter' && (e.preventDefault(), setFormData(p=>({...p, features:[...(p.features||[]), featureInput]})), setFeatureInput(""))} placeholder="Nova característica..." className="h-12 text-base font-medium" /><Button type="button" variant="outline" className="h-12 w-12 rounded-xl shadow-md shrink-0" onClick={() => (setFormData(p=>({...p, features:[...(p.features||[]), featureInput]})), setFeatureInput(""))}><Plus size={24}/></Button></div>
             <div className="flex flex-wrap gap-3">{formData.features?.map((f, i) => <span key={i} className="bg-primary/5 text-primary border border-primary/20 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-3 shadow-sm">{f}<button type="button" onClick={() => setFormData(p=>({...p, features:p.features?.filter((_,idx)=>idx!==i)}))} className="hover:text-destructive transition-colors"><X size={14}/></button></span>)}</div>
          </div>

          <div className="space-y-6">
             <label className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Galeria</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {formData.images?.map((url, i) => <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-md group"><img src={url} className="w-full h-full object-cover" /><button type="button" onClick={() => setFormData(p=>({...p, images:p.images?.filter((_,idx)=>idx!==i)}))} className="absolute top-2 right-2 bg-destructive/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><X size={14}/></button></div>)}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 shadow-inner"><Plus size={32} className="text-muted-foreground opacity-40"/><input type="file" multiple className="hidden" onChange={e => e.target.files && Array.from(e.target.files).forEach(f => processFile(f))} /></label>
             </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="rounded-full h-14 px-10 text-base font-bold">Cancelar</Button>
            <Button type="submit" disabled={uploading} className="sunset-gradient rounded-full h-14 px-16 text-lg font-black text-accent-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all">
              {uploading ? <Loader2 className="animate-spin mr-3" size={24}/> : <Save className="mr-3" size={24}/>}
              {editingBoat ? 'Finalizar Edição' : 'Publicar Barco'}
            </Button>
          </div>
        </form>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={boats.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {boats.map(b => <SortableBoat key={b.id} boat={b} startEdit={startEdit} requestDelete={requestDelete} />)}
          </div>
        </SortableContext>
      </DndContext>

      {confirmAction && <ConfirmDialog open={!!confirmAction} onCancel={() => setConfirmAction(null)} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} title={confirmAction.title} description={confirmAction.description} />}
    </div>
  );
}
