import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Upload, Trash2, Loader2, Anchor, Plus, X, Save, AlertTriangle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type Boat = {
  id: string;
  name: string;
  size: string;
  engine: string;
  capacity: number;
  price4h: string;
  price8h: string;
  image: string;
  slug: string;
  range: "low" | "mid" | "high";
  created_at: string;
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
    capacity: 6,
    price4h: "",
    price8h: "",
    image: "",
    range: "low",
  });

  const fetchBoats = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "boats"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(data);
    } catch (error) {
      setError("Não foi possível carregar os barcos.");
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const q = query(collection(db, "boats"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(data);
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
      setFormData(prev => ({ ...prev, image: url }));
      toast({ title: "Sucesso", description: "Imagem carregada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
    }
    setUploading(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const createSlug = (name: string) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.image || !formData.price4h || !formData.price8h) {
      toast({ variant: "destructive", title: "Campos em falta", description: "Por favor preencha o nome, imagem e preços." });
      return;
    }

    const { id, ...saveData } = formData;
    const finalData = {
      ...saveData,
      slug: createSlug(saveData.name || ""),
      created_at: saveData.created_at || new Date().toISOString()
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

  const resetForm = () => {
    setFormData({
      name: "",
      size: "",
      engine: "",
      capacity: 6,
      price4h: "",
      price8h: "",
      image: "",
      range: "low",
    });
    setEditingBoat(null);
  };

  const startEdit = (boat: Boat) => {
    setEditingBoat(boat);
    setFormData(boat);
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

      // 2. Tentar eliminar imagem do Storage se for um URL do Firebase
      if (boat.image.includes("firebasestorage")) {
        try {
          const imageRef = ref(storage, boat.image);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn("Imagem não encontrada no Storage ao eliminar barco", storageErr);
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Gama</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.range}
                onChange={e => setFormData({ ...formData, range: e.target.value as any })}
              >
                <option value="low">Gama Baixa</option>
                <option value="mid">Gama Média</option>
                <option value="high">Gama Alta</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Imagem do Barco (URL ou Upload)</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
                  ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-muted/20"}
                  ${uploading ? "opacity-60 pointer-events-none" : "hover:border-primary/50"}
                `}
              >
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full space-y-2">
                    <Input placeholder="URL da imagem" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="bg-background" />
                    <p className="text-[10px] text-muted-foreground">Podes colar um link ou arrastar um ficheiro para aqui.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">ou</span>
                    <Button variant="outline" asChild disabled={uploading} className="bg-background">
                      <label className="cursor-pointer">
                        {uploading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Upload size={14} className="mr-2" />}
                        Selecionar Ficheiro
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {formData.image && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
              <img src={formData.image} alt="Preview" className="h-32 rounded-lg border border-border object-cover" />
            </div>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boats.map((boat) => (
            <div key={boat.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 relative">
                <img src={boat.image} alt={boat.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => startEdit(boat)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => requestDelete(boat)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-[10px] text-white rounded-full capitalize">
                  {boat.range}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-display font-bold text-foreground">{boat.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{boat.size} · {boat.engine}</p>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>{boat.price4h} (4h)</span>
                  <span>{boat.price8h} (8h)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
