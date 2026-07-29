import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Upload, Trash2, Loader2, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  created_at: string;
};

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = api.gallery.subscribe((data) => {
      setImages(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    if (!files.length) return;

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      
      try {
        await api.gallery.uploadImage(file, "Imagem da galeria");
        successCount++;
      } catch (err: any) {
        console.error("Erro no upload de uma imagem:", err);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast({ title: "Upload concluído!", description: `${successCount} imagem(ns) adicionada(s) com sucesso.` });
    }
    if (errorCount > 0) {
      setError(`Falha ao carregar ${errorCount} imagem(ns).`);
    }
    setUploading(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const deleteImage = async (image: GalleryImage) => {
    try {
      await api.gallery.delete(image.id);
      toast({ title: "Sucesso!", description: "A imagem foi removida da galeria." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível eliminar a imagem." });
      console.error(err);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-primary" size={22} />
          <h2 className="font-display text-lg font-bold text-foreground">Gerir Galeria</h2>
        </div>
        <div className="flex items-center gap-2">
          {uploading && (
            <div className="text-xs text-muted-foreground mr-2 font-medium">
              A carregar: {uploadProgress.current}/{uploadProgress.total}
            </div>
          )}
          <Button asChild className="sunset-gradient text-accent-foreground rounded-full">
            <label htmlFor="imageUpload" className="cursor-pointer">
              <Upload size={14} className="mr-2" />
              Carregar Fotos
              <input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </Button>
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative min-h-[150px] border-2 border-dashed rounded-2xl mb-8 flex flex-col items-center justify-center transition-all duration-200
          ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-muted/30"}
          ${uploading ? "opacity-60 pointer-events-none" : "hover:border-primary/50"}
        `}
      >
        <Upload size={32} className={`mb-3 ${isDragging ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
        <p className="text-sm font-medium text-foreground">
          {isDragging ? "Larga aqui as fotos!" : "Arrasta as fotos para aqui"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">ou clica no botão para selecionar várias</p>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 p-4 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && !images.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3" />
          <p>A carregar galeria...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl">
          <ImageIcon size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">A galeria ainda está vazia</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {images.map((img) => (
            <motion.div
              layout
              key={img.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square group rounded-xl overflow-hidden shadow-sm border border-border bg-muted flex items-center justify-center"
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  // Fallback visually if image file is missing on server
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.img-error-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'img-error-fallback flex flex-col items-center justify-center p-2 text-center text-muted-foreground w-full h-full bg-muted';
                    fallback.innerHTML = `<span class="text-xs font-semibold text-destructive mb-1">Ficheiro em falta</span><span class="text-[10px] text-muted-foreground">Re-carregue esta foto</span>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setConfirmAction({
                    title: "Eliminar Imagem",
                    description: "Tens a certeza? Esta ação não pode ser desfeita.",
                    action: () => deleteImage(img),
                  })}
                  className="rounded-full scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 delay-100"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
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

export default AdminGallery;