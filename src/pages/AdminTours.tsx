import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Upload, Trash2, Loader2, MapPin, Plus, X, Save, Edit2, GripVertical, ArrowUp, ArrowDown, Clock, Info } from "lucide-react";
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
};

type Tour = {
  id: string;
  name: string;
  images: string[];
  slug: string;
  popular: boolean;
  includes: string[];
  packs: TourPack[];
  created_at: string;
  order: number;
  capacity?: number;
};

// Sortable Item Component
const SortableTour = ({ tour, startEdit, requestDelete, moveTour }: { 
  tour: Tour, 
  startEdit: (t: Tour) => void, 
  requestDelete: (t: Tour) => void,
  moveTour: (id: string, direction: 'top' | 'bottom') => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tour.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative ${isDragging ? 'shadow-2xl ring-2 ring-primary/20' : ''}`}
    >
      <div className="h-40 relative">
        <img src={tour.images?.[0] || (tour as any).image || ""} alt={tour.name} className="w-full h-full object-cover" />
        
        {/* Drag Handle Overlay */}
        <div 
          {...attributes} 
          {...listeners}
          className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <div className="bg-white/80 p-2 rounded-full shadow-lg">
            <GripVertical className="text-primary h-6 w-6" />
          </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => startEdit(tour)}>
            <Edit2 size={14} />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => requestDelete(tour)}>
            <Trash2 size={14} />
          </Button>
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-7 w-7 rounded-full bg-white/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" 
            title="Mover para o topo"
            onClick={() => moveTour(tour.id, 'top')}
          >
            <ArrowUp size={12} />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-7 w-7 rounded-full bg-white/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" 
            title="Mover para o fim"
            onClick={() => moveTour(tour.id, 'bottom')}
          >
            <ArrowDown size={12} />
          </Button>
        </div>

        {tour.popular && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-coral text-white text-[10px] font-bold rounded-full">
            Popular
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-display font-bold text-foreground">{tour.name}</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {tour.packs?.map((p, idx) => (
            <div key={idx} className="bg-muted px-2 py-1 rounded text-[10px] font-bold">
              {p.duration}: {p.price}
            </div>
          ))}
          {tour.capacity && (
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold">
              Até {tour.capacity} pess.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminTours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Tour>>({
    name: "",
    images: [],
    popular: false,
    includes: [],
    packs: [
      { duration: "2h", price: "" },
      { duration: "3h", price: "" },
      { duration: "4h", price: "" },
      { duration: "5h", price: "" },
      { duration: "6h", price: "" },
      { duration: "7h", price: "" },
      { duration: "8h", price: "" },
    ],
    capacity: 10,
  });

  const [inclusionInput, setInclusionInput] = useState("");

  const PRESET_INCLUDES = [
    "Passeio de veleiro em exclusivo, um barco só para si e a sua família e/ou amigos.",
    "Veleje e sinta a brisa, e apenas o barulho do mar, é super relaxante.",
    "Conheça uma das mais belas baías do mundo, com um guia local, passe pela Arrábida, Tróia e Setúbal.",
    "Pode velejar e se quiser também parar para banhos.",
    "Durante o passeio passará pela Costa da Arrábida e Costa de Tróia, são feitas paragens para banhos.",
    "Será acompanhado por um guia local que lhe irá mostrar os sítios mais belos da nossa zona, e explicando um pouco da nossa cultura.",
    "Esta é a embarcação ideal para reunir amigos e/ou família, com capacidade para 14 pessoas mais tripulação.",
    "Pode realizar vários tipos de eventos: Despedidas de solteira, Festas de Aniversário, Refeições a bordo, Festas sunset, Festas surpresa.",
    "Todas as experiências são personalizáveis, para tornar o momento único e inesquecível.",
    "Ou apenas aproveitar para relaxar."
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const clientSort = (data: Tour[]) =>
    [...data].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.created_at && b.created_at)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tours"), (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tour[];
      setTours(clientSort(data));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir tours:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const processFile = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `tours/${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, fileName);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
      toast({ title: "Sucesso", description: "Imagem adicionada à galeria!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    }
    setUploading(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    for (const file of files) {
      await processFile(file);
    }
  };

  const createSlug = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.images || formData.images.length === 0) {
      toast({ variant: "destructive", title: "Campos em falta", description: "Por favor preencha o nome e adicione pelo menos uma imagem." });
      return;
    }

    const { id, ...saveData } = formData;
    
    // Filtra packs vazios
    const filteredPacks = (saveData.packs || []).filter(p => p.duration && p.price);
    
    if (filteredPacks.length === 0) {
      toast({ variant: "destructive", title: "Packs em falta", description: "Adiciona pelo menos um pack de duração e preço." });
      return;
    }

    const finalData = {
      ...saveData,
      packs: filteredPacks.map(p => ({
        duration: p.duration.includes('h') ? p.duration : `${p.duration}h`,
        price: p.price.includes('€') ? p.price : `${p.price}€`
      })),
      images: saveData.images || [],
      image: (saveData.images && saveData.images.length > 0) ? saveData.images[0] : "", // Sincroniza foto de capa legacy
      slug: createSlug(saveData.name || ""),
      created_at: saveData.created_at || new Date().toISOString(),
      order: saveData.order ?? (tours.length > 0 ? Math.max(...tours.map(t => t.order || 0)) + 1 : 0)
    };

    try {
      if (editingTour) {
        await updateDoc(doc(db, "tours", editingTour.id), finalData);
        toast({ title: "Sucesso", description: "Passeio atualizado com sucesso!" });
      } else {
        await addDoc(collection(db, "tours"), finalData);
        toast({ title: "Sucesso", description: "Passeio adicionado com sucesso!" });
      }
      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao guardar", description: error.message });
    }
  };

  const updateToursOrder = async (newTours: Tour[]) => {
    try {
      const batch = writeBatch(db);
      newTours.forEach((tour, index) => {
        const tourRef = doc(db, "tours", tour.id);
        batch.update(tourRef, { order: index });
      });
      await batch.commit();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro na ordenação", description: error.message });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tours.findIndex((t) => t.id === active.id);
      const newIndex = tours.findIndex((t) => t.id === over.id);
      const newTours = arrayMove(tours, oldIndex, newIndex);
      setTours(newTours);
      updateToursOrder(newTours);
    }
  };

  const moveTour = (id: string, direction: 'top' | 'bottom') => {
    const tourIndex = tours.findIndex(t => t.id === id);
    if (tourIndex === -1) return;
    let newTours = [...tours];
    const tourToMove = newTours.splice(tourIndex, 1)[0];
    direction === 'top' ? newTours.unshift(tourToMove) : newTours.push(tourToMove);
    setTours(newTours);
    updateToursOrder(newTours);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      images: [], 
      popular: false, 
      includes: [], 
      packs: [
        { duration: "2h", price: "" },
        { duration: "3h", price: "" },
        { duration: "4h", price: "" },
        { duration: "5h", price: "" },
        { duration: "6h", price: "" },
        { duration: "7h", price: "" },
        { duration: "8h", price: "" },
      ],
      capacity: 10
    });
    setInclusionInput("");
    setEditingTour(null);
  };

  const startEdit = (tour: Tour) => {
    const tourWithGallery = {
      ...tour,
      images: (tour.images && tour.images.length > 0) 
        ? tour.images 
        : ((tour as any).image ? [(tour as any).image] : [])
    };
    setEditingTour(tourWithGallery as Tour);
    setFormData(tourWithGallery as Tour);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requestDelete = (tour: Tour) => {
    setConfirmAction({
      title: "Eliminar Passeio",
      description: `Tens a certeza que queres eliminar o passeio "${tour.name}"?`,
      action: () => deleteTour(tour),
    });
  };

  const deleteTour = async (tour: Tour) => {
    try {
      await deleteDoc(doc(db, "tours", tour.id));
      for (const imgUrl of (tour.images || [])) {
        if (imgUrl.includes("firebasestorage")) {
          try { await deleteObject(ref(storage, imgUrl)); } catch (e) {}
        }
      }
      toast({ title: "Sucesso", description: "Passeio removido!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao eliminar", description: error.message });
    }
  };

  const addInclusion = () => {
    if (!inclusionInput.trim()) return;
    setFormData(prev => ({ ...prev, includes: [...(prev.includes || []), inclusionInput.trim()] }));
    setInclusionInput("");
  };

  const removeInclusion = (index: number) => {
    setFormData(prev => ({ ...prev, includes: (prev.includes || []).filter((_, i) => i !== index) }));
  };

  const addPack = () => {
    setFormData(prev => ({ ...prev, packs: [...(prev.packs || []), { duration: "", price: "" }] }));
  };

  const removePack = (index: number) => {
    setFormData(prev => ({ ...prev, packs: (prev.packs || []).filter((_, i) => i !== index) }));
  };

  const updatePack = (index: number, field: keyof TourPack, value: string) => {
    const newPacks = [...(formData.packs || [])];
    newPacks[index][field] = value;
    setFormData(prev => ({ ...prev, packs: newPacks }));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="text-primary" size={22} />
          <h2 className="font-display text-lg font-bold text-foreground">Gerir Passeios Turísticos</h2>
        </div>
        <Button onClick={() => { if(showAddForm) resetForm(); setShowAddForm(!showAddForm); }} className="sunset-gradient text-accent-foreground rounded-full">
          {showAddForm ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
          {showAddForm ? 'Cancelar' : 'Adicionar Passeio'}
        </Button>
      </div>

      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="font-display font-bold text-md mb-4">{editingTour ? 'Editar Passeio' : 'Novo Passeio'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Passeio</label>
              <Input placeholder="Ex: Grutas de Benagil" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lotação (Máx. Pessoas)</label>
              <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} />
            </div>
            
            <div className="flex items-center gap-2 pt-8">
              <input 
                type="checkbox" 
                id="popular" 
                checked={formData.popular} 
                onChange={e => setFormData({ ...formData, popular: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="popular" className="text-sm font-medium">Destaque (Popular)</label>
            </div>

            <div className="space-y-2 md:col-span-2 bg-muted/30 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2"><Clock size={16}/> Packs de Duração e Preço</label>
                <Button type="button" variant="outline" size="sm" onClick={addPack} className="h-7 text-xs">
                  <Plus size={12} className="mr-1"/> Adicionar Pack
                </Button>
              </div>
              <div className="space-y-3">
                {formData.packs?.map((pack, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <select 
                        value={pack.duration.replace('h', '')} 
                        onChange={e => updatePack(idx, 'duration', `${e.target.value}h`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Duração...</option>
                        {["1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8"].map(h => (
                          <option key={h} value={h}>{h} Horas</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 relative">
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={pack.price.replace('€', '')} 
                        onChange={e => updatePack(idx, 'price', `${e.target.value}€`)} 
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                    </div>
                    {formData.packs!.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removePack(idx)} className="text-destructive shrink-0">
                        <Trash2 size={16}/>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">O que inclui</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ex: Colete salva-vidas incluído" 
                  value={inclusionInput} 
                  onChange={e => setInclusionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                />
                <Button type="button" onClick={addInclusion} variant="outline" size="icon"><Plus size={16}/></Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="w-full text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Sugestões rápidas (clica para adicionar):</p>
                {PRESET_INCLUDES.filter(s => !formData.includes?.includes(s)).map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, includes: [...(prev.includes || []), suggestion] }))}
                    className="text-[11px] bg-background hover:bg-primary/10 hover:text-primary border border-border px-2 py-1 rounded-lg transition-colors text-left"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.includes?.map((item, idx) => (
                  <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    {item}
                    <button onClick={() => removeInclusion(idx)} className="hover:text-destructive"><X size={12}/></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Galeria de Imagens</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                {formData.images?.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5">Capa</div>
                    )}
                  </div>
                ))}
                
                <label 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  className={`aspect-square rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Plus size={16} className="text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground mt-1 text-center">Adicionar<br/>várias</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={e => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(file => processFile(file));
                      }
                    }} 
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="Ou cole o URL de uma imagem aqui..." 
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        setFormData(prev => ({ ...prev, images: [...(prev.images || []), val] }));
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }} 
                  className="flex-1" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Limpar</Button>
            <Button onClick={handleSave} className="sunset-gradient text-accent-foreground font-semibold">
              <Save size={14} className="mr-2" />
              {editingTour ? 'Atualizar Passeio' : 'Guardar Passeio'}
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SortableContext items={tours.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tours.map(tour => (
                <SortableTour key={tour.id} tour={tour} startEdit={startEdit} requestDelete={requestDelete} moveTour={moveTour} />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        description={confirmAction?.description || ""}
        onConfirm={() => { confirmAction?.action(); setConfirmAction(null); }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default AdminTours;
