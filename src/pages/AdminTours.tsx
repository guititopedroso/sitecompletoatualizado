import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, Loader2, Plus, X, Save, Edit2, GripVertical, MapPin, Clock, Sparkles, Wand2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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

type TourPack = {
  duration: string;
  price: string;
  cost?: string;
  useMarkup?: boolean;
  deliveryCost?: string;
  useDelivery?: boolean;
};

type Tour = {
  id: string;
  name: string;
  images: string[];
  image?: string;
  slug: string;
  popular: boolean;
  includes: string[];
  packs: TourPack[];
  created_at: string;
  order: number;
  capacity?: number;
  extraOptions?: ExtraOption[];
};

type ExtraOption = {
  name: string;
  price: number;
  perPerson: boolean;
  perHour: boolean;
  details?: string[];
};

const SortableTour = ({ tour, startEdit, requestDelete }: { 
  tour: Tour, 
  startEdit: (t: Tour) => void, 
  requestDelete: (t: Tour) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tour.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-card border border-border rounded-2xl p-6 shadow-sm group hover:border-primary/40 transition-all ${isDragging ? 'shadow-2xl ring-2 ring-primary' : ''}`}>
      <div className="flex gap-6 items-center">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-primary transition-colors"><GripVertical size={28} /></div>
        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-inner border border-border/50"><img src={tour.images?.[0] || tour.image || ""} className="w-full h-full object-cover" alt="" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
               <h3 className="font-display font-bold text-lg truncate mb-1">{tour.name}</h3>
               <div className="flex flex-wrap gap-2">
                 <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-wider">{tour.capacity} Pax Max</span>
                 {tour.popular && <span className="text-[10px] sunset-gradient text-accent-foreground px-3 py-1 rounded-full font-black uppercase tracking-wider">Popular 🔥</span>}
               </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(tour)} className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"><Edit2 size={18} /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => requestDelete(tour)} className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 size={18} /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [inclusionInput, setInclusionInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Tour>>({
    name: "", images: [], popular: false, includes: [], packs: [{ duration: "2h", price: "", cost: "", useMarkup: false, useDelivery: false, deliveryCost: "" }], capacity: 10, extraOptions: []
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tours"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Tour[];
      setTours(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const callGroq = async (prompt: string): Promise<string[]> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.split(';').map((s: any) => s.trim()).filter(Boolean) || [];
  };

  const generateInclusionsAI = async () => {
    if (!formData.name) return;
    setGeneratingAI('includes');
    try {
      const prompt = `Gera 5 itens incluídos num passeio de barco premium chamado "${formData.name}". Retorna curtos e apelativos separados por ponto e vírgula (;).`;
      const res = await callGroq(prompt);
      setFormData(prev => ({ ...prev, includes: [...new Set([...(prev.includes || []), ...res])] }));
    } catch (e) {}
    setGeneratingAI(null);
  };

  const generateOptionDetailsAI = async (idx: number) => {
    const optName = formData.extraOptions?.[idx]?.name;
    if (!optName) return;
    setGeneratingAI(`opt-${idx}`);
    try {
      const prompt = `Gera 4 detalhes incluídos no serviço extra de "${optName}". Curto e direto, separados por ponto e vírgula (;).`;
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
        order: formData.order ?? (tours.length > 0 ? Math.max(...tours.map(t => t.order || 0)) + 1 : 0)
      };

      let tourId = editingTour?.id;
      if (editingTour) await updateDoc(doc(db, "tours", editingTour.id), finalData);
      else {
        const ref = await addDoc(collection(db, "tours"), finalData);
        tourId = ref.id;
      }

      // SINCRONIZAÇÃO MÁGICA
      const batch = writeBatch(db);
      for (const opt of (finalData.extraOptions || [])) {
        if (!opt.name) continue;
        tours.filter(t => t.id !== tourId).forEach(t => {
           if (t.extraOptions?.some(e => e.name === opt.name)) {
             batch.update(doc(db, "tours", t.id), { extraOptions: t.extraOptions.map(e => e.name === opt.name ? {...opt} : e) });
           }
        });
        const bSnap = await getDocs(collection(db, "boats"));
        bSnap.forEach(bDoc => {
           const bExtras = bDoc.data().extraOptions as any[] || [];
           if (bExtras.some(e => e.name === opt.name)) {
             batch.update(doc(db, "boats", bDoc.id), { extraOptions: bExtras.map(e => e.name === opt.name ? {...opt} : e) });
           }
        });
      }
      await batch.commit();

      toast({ title: "✨ Experiência Publicada com Sucesso!" });
      resetForm();
      setShowAddForm(false);
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
    setUploading(false);
  };

  const startEdit = (t: Tour) => { setEditingTour(t); setFormData(t); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const requestDelete = (t: Tour) => {
    setConfirmAction({
      title: "Confirmar Eliminação",
      description: `Tens a certeza que queres eliminar permanentemente o passeio "${t.name}"?`,
      action: async () => { await deleteDoc(doc(db, "tours", t.id)); toast({ title: "Passeio Eliminado" }); },
    });
  };

  const resetForm = () => { setFormData({ name: "", images: [], popular: false, includes: [], packs: [{ duration: "2h", price: "", cost: "", useMarkup: false, useDelivery: false, deliveryCost: "" }], capacity: 10, extraOptions: [] }); setEditingTour(null); };

  const processFile = async (file: File) => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `tours/${Date.now()}-${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    } catch (e) {}
    setUploading(false);
  };

  const updateOrderInDb = async (list: Tour[]) => {
    const batch = writeBatch(db);
    list.forEach((t, i) => batch.update(doc(db, "tours", t.id), { order: i }));
    await batch.commit();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tours.findIndex((t) => t.id === active.id);
      const newIndex = tours.findIndex((t) => t.id === over.id);
      const newList = arrayMove(tours, oldIndex, newIndex);
      setTours(newList);
      updateOrderInDb(newList);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary size-12" /></div>;

  return (
    <div className="w-full space-y-10 p-4 md:p-8 text-left">
      <div className="flex items-center justify-between border-b pb-8">
        <div className="flex items-center gap-4">
          <MapPin className="text-secondary" size={32} />
          <div><h1 className="text-3xl font-display font-bold text-foreground">Gestão de Experiências</h1><p className="text-base text-muted-foreground font-medium italic">Edita e organiza os tours da Royal Coast</p></div>
        </div>
        <Button type="button" onClick={() => { if(showAddForm) resetForm(); setShowAddForm(!showAddForm); }} className="sunset-gradient text-accent-foreground rounded-full h-14 px-10 text-lg font-black shadow-xl hover:scale-105 transition-all">
          {showAddForm ? <X size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />} {showAddForm ? 'Cancelar Edição' : 'Criar Novo Passeio'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-3xl p-10 shadow-2xl space-y-12 animate-in fade-in slide-in-from-top-10 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Nome do Passeio</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-14 text-lg font-bold bg-muted/20" /></div>
            <div className="space-y-3"><label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Lotação Recomendada</label><Input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="h-14 text-lg font-bold bg-muted/20 text-center" /></div>
            <div className="flex items-end pb-2 h-full"><label className="flex items-center gap-4 cursor-pointer p-4 bg-muted/20 rounded-2xl border border-border/50 hover:border-primary/50 transition-all w-full"><input type="checkbox" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} className="w-6 h-6 rounded border-border text-primary" /><span className="text-base font-black uppercase tracking-widest text-foreground/80">Highlight Popular 🔥</span></label></div>
          </div>

          <div className="bg-muted/30 p-10 rounded-3xl border border-border/50 space-y-8">
             <div className="flex items-center justify-between mb-2"><h3 className="text-xl font-display font-bold uppercase tracking-widest flex items-center gap-3"><Clock size={28} className="text-secondary"/> Pacotes de Duração e Custos</h3><Button type="button" variant="outline" size="sm" onClick={() => setFormData(p=>({...p, packs:[...(p.packs||[]), {duration:"", price:"", cost:"", useMarkup:false, useDelivery:false, deliveryCost:""}]}))} className="h-11 px-6 text-xs font-black uppercase border-secondary text-secondary hover:bg-secondary/10 shadow-sm"><Plus size={16} className="mr-2"/> Adicionar Duração</Button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {formData.packs?.map((pack, idx) => (
                   <div key={idx} className="bg-background p-6 rounded-2xl border border-border/50 shadow-md relative group space-y-5 transition-all hover:border-secondary/40">
                      <button type="button" onClick={() => setFormData(p=>({...p, packs:p.packs?.filter((_,i)=>i!==idx)}))} className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive"><X size={20}/></button>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground italic">Duração</label><Input placeholder="Ex: 2h" value={pack.duration} onChange={e => { const nk=[...(formData.packs||[])]; nk[idx].duration=e.target.value; setFormData({...formData, packs:nk}); }} className="h-11 text-base font-bold bg-muted/10" /></div>
                         <div className="space-y-2"><label className="text-[10px] font-black uppercase text-secondary italic">P. Final (€)</label><Input placeholder="Ex: 250€" value={pack.price} onChange={e => { const nk=[...(formData.packs||[])]; nk[idx].price=e.target.value; setFormData({...formData, packs:nk}); }} className="h-11 text-lg font-black text-secondary bg-secondary/5 border-secondary/20" /></div>
                      </div>
                      <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
                         <div className="flex items-center gap-4">
                            <label className="text-[10px] font-black uppercase text-muted-foreground w-20">Custo Base</label>
                            <Input placeholder="€ cost" value={(pack.cost || "").replace('€','')} onChange={e => { 
                               const nk=[...(formData.packs||[])]; 
                               const cost = Number(e.target.value);
                               const delivery = pack.useDelivery ? Number((pack.deliveryCost || "").replace('€','')) : 0;
                               nk[idx].cost = `${cost}€`;
                               if(pack.useMarkup) nk[idx].price = `${Math.ceil(cost * 1.15) + delivery}€`;
                               setFormData({...formData, packs:nk}); 
                            }} className="h-9 text-xs font-bold" />
                         </div>
                         <div className="grid grid-cols-1 gap-2">
                            <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={pack.useMarkup} onChange={e => {
                                const nk=[...(formData.packs||[])];
                                const delivery = pack.useDelivery ? Number((pack.deliveryCost || "").replace('€','')) : 0;
                                nk[idx].useMarkup = e.target.checked;
                                if(e.target.checked && pack.cost) nk[idx].price = `${Math.ceil(Number(pack.cost.replace('€','')) * 1.15) + delivery}€`;
                                setFormData({...formData, packs:nk});
                            }} className="w-5 h-5 rounded border-border" /><span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider group-hover:text-secondary italic">Auto Markup 15%</span></label>
                            
                            <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border border-dashed border-border/50">
                                <label className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" checked={pack.useDelivery} onChange={e => {
                                    const nk=[...(formData.packs||[])];
                                    nk[idx].useDelivery = e.target.checked;
                                    setFormData({...formData, packs:nk});
                                }} className="w-5 h-5 rounded border-border" /><span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider group-hover:text-secondary italic">Taxa de Deslocação</span></label>
                                {pack.useDelivery && <Input placeholder="Valor €" value={pack.deliveryCost} onChange={e => {
                                    const nk=[...(formData.packs||[])];
                                    nk[idx].deliveryCost = e.target.value;
                                    setFormData({...formData, packs:nk});
                                }} className="h-8 text-xs font-bold" />}
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between mb-2"><label className="text-base font-black uppercase text-muted-foreground tracking-widest px-1">Incluído nesta Experiência</label><Button type="button" variant="ghost" size="sm" onClick={generateInclusionsAI} className="h-12 px-6 text-xs font-black uppercase text-secondary hover:bg-secondary/5">{generatingAI==='includes' ? <Loader2 size={16} className="animate-spin mr-2"/> : <Sparkles size={16} className="mr-2"/>} Sugerir com Groq IA</Button></div>
             <div className="flex gap-4"><Input value={inclusionInput} onChange={e => setInclusionInput(e.target.value)} onKeyDown={e => e.key==='Enter' && (e.preventDefault(), setFormData(p=>({...p, includes:[...(p.includes||[]), inclusionInput]})), setInclusionInput(""))} placeholder="Ex: Bebida de Boas-vindas Premium..." className="h-14 text-base font-medium shadow-inner" /><Button type="button" variant="outline" className="h-14 w-14 rounded-2xl shadow-md border-border/80" onClick={() => (setFormData(p=>({...p, includes:[...(p.includes||[]), inclusionInput]})), setInclusionInput(""))}><Plus size={28}/></Button></div>
             <div className="flex flex-wrap gap-3">{formData.includes?.map((f, i) => <span key={i} className="bg-secondary/5 text-secondary border border-secondary/20 px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-3 shadow-sm">{f}<button type="button" onClick={() => setFormData(p=>({...p, includes:p.includes?.filter((_,idx)=>idx!==i)}))}><X size={16}/></button></span>)}</div>
          </div>

          <div className="bg-muted/30 p-10 rounded-3xl border border-border/50">
             <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-display font-bold uppercase tracking-widest flex items-center gap-3"><Sparkles size={28} className="text-primary"/> Opcionais Extra (Sincronização Ativa)</h3><Button type="button" variant="outline" size="sm" onClick={() => setFormData(p=>({...p, extraOptions:[...(p.extraOptions||[]), {name:"", price:0, perPerson:false, perHour:false, details:[]}]}))} className="h-11 px-6 text-xs font-black uppercase border-primary text-primary hover:bg-primary/10 shadow-sm"><Plus size={16} className="mr-2"/> Registar Opcional</Button></div>
             <p className="text-xs text-muted-foreground font-semibold italic mb-8 flex items-center gap-2 px-1"><Info size={16} className="text-primary"/> Sistema Royal Sync: Se alterares o "Catering" aqui, muda em todos os passeios e barcos automaticamente.</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {formData.extraOptions?.map((opt, idx) => (
                   <div key={idx} className="bg-background p-8 rounded-3xl border border-border/50 shadow-xl relative group space-y-6 transition-all hover:scale-[1.01]">
                      <button type="button" onClick={() => setFormData(p=>({...p, extraOptions:p.extraOptions?.filter((_,i)=>i!==idx)}))} className="absolute top-5 right-5 opacity-40 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive"><X size={24}/></button>
                      <div className="space-y-4">
                         <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground px-1 italic">Nome do Serviço</label><Input placeholder="Ex: Catering Regional" value={opt.name} onChange={e => { const no=[...(formData.extraOptions||[])]; no[idx].name=e.target.value; setFormData({...formData, extraOptions:no}); }} className="h-12 text-lg font-black" /></div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground px-1 italic">Valor Base (€)</label><Input type="number" value={opt.price} onChange={e => { const no=[...(formData.extraOptions||[])]; no[idx].price=Number(e.target.value); setFormData({...formData, extraOptions:no}); }} className="h-12 text-lg font-black text-primary bg-primary/5" /></div>
                            <div className="flex flex-col gap-2 pt-6">
                               <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={opt.perPerson} onChange={e => { const no=[...(formData.extraOptions||[])]; no[idx].perPerson=e.target.checked; setFormData({...formData, extraOptions:no}); }} className="w-5 h-5 rounded border-border text-primary" /><span className="text-[11px] font-black uppercase text-muted-foreground">P/ Pax</span></label>
                               <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={opt.perHour} onChange={e => { const no=[...(formData.extraOptions||[])]; no[idx].perHour=e.target.checked; setFormData({...formData, extraOptions:no}); }} className="w-5 h-5 rounded border-border text-primary" /><span className="text-[11px] font-black uppercase text-muted-foreground">P/ Hora</span></label>
                            </div>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-border flex items-center justify-between">
                         <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{opt.details?.length || 0} Detalhes Incluídos</span>
                         <Button type="button" variant="ghost" size="icon" className="h-12 w-12 text-primary hover:bg-primary/10" onClick={() => generateOptionDetailsAI(idx)} disabled={!!generatingAI}>{generatingAI===`opt-${idx}` ? <Loader2 size={24} className="animate-spin"/> : <Wand2 size={24}/>}</Button>
                      </div>
                      <div className="space-y-4">
                         <Input placeholder="+ Adicionar Detalhe (Enter)" className="h-11 text-sm bg-muted/10 border-dashed" onKeyDown={e => e.key==='Enter' && (e.preventDefault(), (setFormData(p => { const o = [...(p.extraOptions || [])]; o[idx].details = [...(o[idx].details || []), e.currentTarget.value]; e.currentTarget.value = ""; return { ...p, extraOptions: o }; })))} />
                         <div className="flex flex-wrap gap-2">{opt.details?.map((d, di) => <span key={di} className="bg-muted px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 border border-border/40 shrink-0">{d}<button type="button" onClick={() => setFormData(p => { const o = [...(p.extraOptions || [])]; o[idx].details = o[idx].details?.filter((_, idx2) => idx2 !== di); return { ...p, extraOptions: o }; })} className="hover:text-destructive"><X size={14}/></button></span>)}</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="space-y-6">
             <label className="text-base font-black uppercase text-muted-foreground tracking-widest block px-1">Galeria Visual (Experiência)</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5 pb-4">
                {formData.images?.map((url, i) => <div key={i} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-border shadow-lg group"><img src={url} className="w-full h-full object-cover shadow-inner" /><button type="button" onClick={() => setFormData(p=>({...p, images:p.images?.filter((_,idx)=>idx!==i)}))} className="absolute top-3 right-3 bg-destructive/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl"><X size={16}/></button></div>)}
                <label className="aspect-square rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all shadow-inner group"><Plus size={40} className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-all"/><input type="file" multiple className="hidden" onChange={e => e.target.files && Array.from(e.target.files).forEach(f => processFile(f))} /></label>
             </div>
          </div>

          <div className="flex justify-end gap-6 pt-12 border-t border-border/50 mb-10">
            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="rounded-full h-16 px-12 text-lg font-bold">Cancelar</Button>
            <Button type="submit" disabled={uploading} className="sunset-gradient rounded-full h-16 px-20 text-xl font-black text-accent-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all">
              {uploading ? <Loader2 className="animate-spin mr-3" size={28}/> : <Save className="mr-3" size={28}/>}
              {editingTour ? 'Confirmar Alterações' : 'Publicar Experiência'}
            </Button>
          </div>
        </form>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tours.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tours.map(t => <SortableTour key={t.id} tour={t} startEdit={startEdit} requestDelete={requestDelete} />)}
          </div>
        </SortableContext>
      </DndContext>

      {confirmAction && <ConfirmDialog open={!!confirmAction} onCancel={() => setConfirmAction(null)} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} title={confirmAction.title} description={confirmAction.description} />}
    </div>
  );
}
