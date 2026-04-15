import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Upload, Trash2, Loader2, Anchor, Plus, X, Save, AlertTriangle, Edit2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
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
  created_at?: string;
  features?: string[];
};

// Sortable Item Component
const SortableBoat = ({ boat, startEdit, requestDelete, moveBoat }: { 
  boat: Boat, 
  startEdit: (b: Boat) => void, 
  requestDelete: (b: Boat) => void,
  moveBoat: (id: string, direction: 'top' | 'bottom') => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: boat.id });

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
        <img src={boat.images?.[0] || (boat as any).image || ""} alt={boat.name} className="w-full h-full object-cover" />
        
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
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => startEdit(boat)}>
            <Edit2 size={14} />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => requestDelete(boat)}>
            <Trash2 size={14} />
          </Button>
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-7 w-7 rounded-full bg-white/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" 
            title="Mover para o topo"
            onClick={() => moveBoat(boat.id, 'top')}
          >
            <ArrowUp size={12} />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-7 w-7 rounded-full bg-white/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" 
            title="Mover para o fim"
            onClick={() => moveBoat(boat.id, 'bottom')}
          >
            <ArrowDown size={12} />
          </Button>
        </div>

      </div>
      <div className="p-4">
        <h4 className="font-display font-bold text-foreground">{boat.name}</h4>
        <p className="text-xs text-muted-foreground mb-3">{boat.size} · {boat.engine}</p>
        <div className="flex justify-between items-center text-sm font-bold">
          <span>{boat.price4h.includes('€') ? boat.price4h : `${boat.price4h}€`} (4h)</span>
          <span>{boat.price8h.includes('€') ? boat.price8h : `${boat.price8h}€`} (8h)</span>
        </div>
      </div>
    </div>
  );
};

const AdminBoats = () => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Boat>>({
    name: "",
    size: "",
    engine: "",
    capacity: 2,
    price4h: "",
    price8h: "",
    images: [],
    range: "mid" as const,
    features: []
  });
  const [featureInput, setFeatureInput] = useState("");
  const PRESET_FEATURES = [
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const clientSort = (data: Boat[]) =>
    [...data].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.created_at && b.created_at)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  const fetchBoats = async () => {
    setLoading(true);
    try {
      // Sem orderBy para não excluir documentos sem o campo 'order'
      const q = collection(db, "boats");
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(clientSort(data));
    } catch (error) {
      setError("Não foi possível carregar os barcos.");
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Sem orderBy — ordenação feita no cliente para suportar docs sem campo 'order'
    const unsubscribe = onSnapshot(collection(db, "boats"), (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(clientSort(data));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir barcos:", error);
      setError("Não foi possível carregar os barcos.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const storageRef = ref(storage, `boats/${fileName}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
      toast({ title: "Sucesso", description: "Imagem adicionada à galeria do barco!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    }
    setUploading(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(file => processFile(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    for (const file of files) {
      await processFile(file);
    }
  };

  const createSlug = (name: string) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.images || formData.images.length === 0 || !formData.price4h || !formData.price8h) {
      toast({ variant: "destructive", title: "Campos em falta", description: "Por favor preencha o nome, adicione pelo menos uma imagem e defina os preços." });
      return;
    }

    const { id, ...saveData } = formData;
    const finalData = {
      ...saveData,
      price4h: saveData.price4h?.includes('€') ? saveData.price4h : `${saveData.price4h}€`,
      price8h: saveData.price8h?.includes('€') ? saveData.price8h : `${saveData.price8h}€`,
      slug: createSlug(saveData.name || ""),
      image: (saveData.images && saveData.images.length > 0) ? saveData.images[0] : (saveData.image || ""), // Sincroniza foto de capa legacy
      created_at: saveData.created_at || new Date().toISOString(),
      order: saveData.order ?? (boats.length > 0 ? Math.max(...boats.map(b => b.order || 0)) + 1 : 0)
    };

    try {
      if (editingBoat) {
        await updateDoc(doc(db, "boats", editingBoat.id), finalData);
        toast({ title: "Sucesso", description: "Barco atualizado com sucesso!" });
      } else {
        await addDoc(collection(db, "boats"), finalData);
        toast({ title: "Sucesso", description: "Barco adicionado com sucesso!" });
      }
      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao guardar", description: error.message });
    }
  };

  const updateBoatsOrder = async (newBoats: Boat[]) => {
    try {
      const batch = writeBatch(db);
      newBoats.forEach((boat, index) => {
        const boatRef = doc(db, "boats", boat.id);
        batch.update(boatRef, { order: index });
      });
      await batch.commit();
      toast({ title: "Ordenação guardada", description: "A nova ordem dos barcos foi atualizada." });
    } catch (error: any) {
      console.error("Erro ao atualizar ordem:", error);
      toast({ variant: "destructive", title: "Erro na ordenação", description: error.message });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = boats.findIndex((boat) => boat.id === active.id);
      const newIndex = boats.findIndex((boat) => boat.id === over.id);

      const newBoats = arrayMove(boats, oldIndex, newIndex);
      setBoats(newBoats);
      updateBoatsOrder(newBoats);
    }
  };

  const moveBoat = (id: string, direction: 'top' | 'bottom') => {
    const boatIndex = boats.findIndex(b => b.id === id);
    if (boatIndex === -1) return;

    let newBoats = [...boats];
    const boatToMove = newBoats[boatIndex];
    newBoats.splice(boatIndex, 1);

    if (direction === 'top') {
      newBoats.unshift(boatToMove);
    } else {
      newBoats.push(boatToMove);
    }

    setBoats(newBoats);
    updateBoatsOrder(newBoats);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      size: "",
      engine: "",
      capacity: 2,
      price4h: "",
      price8h: "",
      images: [],
      range: "mid" as const,
      features: []
    });
    setEditingBoat(null);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({ ...prev, features: [...(prev.features || []), featureInput.trim()] }));
      setFeatureInput("");
    }
  };

  const removeFeature = (idx: number) => {
    setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== idx) }));
  };

  const startEdit = (boat: Boat) => {
    const boatWithGallery = {
      ...boat,
      images: (boat.images && boat.images.length > 0) 
        ? boat.images 
        : ((boat as any).image ? [(boat as any).image] : [])
    };
    setEditingBoat(boatWithGallery as Boat);
    setFormData(boatWithGallery as Boat);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const requestDelete = (boat: Boat) => {
    setConfirmAction({
      title: "Eliminar Barco",
      description: `Tens a certeza que queres eliminar o barco "${boat.name}"?`,
      action: () => deleteBoat(boat),
    });
  };

  const deleteBoat = async (boat: Boat) => {
    try {
      // 1. Eliminar documento da Firestore
      await deleteDoc(doc(db, "boats", boat.id));

      // 2. Tentar eliminar imagem
      for (const imgUrl of (boat.images || [])) {
        if (imgUrl.includes("firebasestorage")) {
          try {
            const imageRef = ref(storage, imgUrl);
            await deleteObject(imageRef);
          } catch (storageErr) {}
        }
      }
      toast({ title: "Sucesso", description: "Barco removido!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao eliminar", description: error.message });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Anchor className="text-primary" size={22} />
          <h2 className="font-display text-lg font-bold text-foreground">Gerir Barcos</h2>
        </div>
        <Button onClick={() => { if(showAddForm) resetForm(); setShowAddForm(!showAddForm); }} className="sunset-gradient text-accent-foreground rounded-full">
          {showAddForm ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
          {showAddForm ? 'Cancelar' : 'Adicionar Barco'}
        </Button>
      </div>

      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="font-display font-bold text-md mb-4">{editingBoat ? 'Editar Barco' : 'Novo Barco'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Barco</label>
              <Input placeholder="Ex: Kelt Azura" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamanho</label>
              <Input placeholder="Ex: 5 mts" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motor</label>
              <Input placeholder="Ex: Motor Yamaha 50hp" value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lotação</label>
              <Input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço 4h (€)</label>
              <Input placeholder="Ex: 190€" value={formData.price4h} onChange={e => setFormData({ ...formData, price4h: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço 8h (€)</label>
              <Input placeholder="Ex: 230€" value={formData.price8h} onChange={e => setFormData({ ...formData, price8h: e.target.value })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Galeria de Imagens</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                {formData.images?.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt={`Boat Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-[8px] text-white text-center py-0.5">Capa</div>}
                  </div>
                ))}
                <label 
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Plus size={16} className="text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground mt-1">Adicionar</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload} 
                  />
                </label>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Caraterísticas (O que inclui)</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ex: Colete salva-vidas incluído" 
                    value={featureInput} 
                    onChange={e => setFeatureInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline" size="icon"><Plus size={16}/></Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/20 rounded-xl border border-dashed border-border text-left">
                  <p className="w-full text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Sugestões rápidas (clica para adicionar):</p>
                  {PRESET_FEATURES.filter(s => !formData.features?.includes(s)).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, features: [...(prev.features || []), suggestion] }))}
                      className="text-[11px] bg-background hover:bg-primary/10 hover:text-primary border border-border px-2 py-1 rounded-lg transition-colors text-left"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features?.map((item, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                      {item}
                      <button onClick={() => removeFeature(idx)} className="hover:text-destructive"><X size={12}/></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Limpar</Button>
            <Button onClick={handleSave} className="sunset-gradient text-accent-foreground">
              <Save size={14} className="mr-2" />
              {editingBoat ? 'Atualizar Barco' : 'Guardar Barco'}
            </Button>
          </div>
        </motion.div>
      )}

      {loading && !boats.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3" />
          <p>A carregar barcos...</p>
        </div>
      ) : boats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <Anchor size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Não há barcos no catálogo</p>
          <p className="text-xs">Usa o botão acima para adicionar o primeiro barco.</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SortableContext 
              items={boats.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {boats.map((boat) => (
                <SortableBoat 
                  key={boat.id} 
                  boat={boat} 
                  startEdit={startEdit} 
                  requestDelete={requestDelete}
                  moveBoat={moveBoat}
                />
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

export default AdminBoats;
