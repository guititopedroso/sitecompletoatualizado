import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
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
    const [error, setError] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; action: () => void } | null>(null);
    const { toast } = useToast();
  
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) {
        setError("Não foi possível carregar as imagens.");
        console.error(error);
      } else {
        setImages(data as GalleryImage[]);
      }
      setLoading(false);
    };
  
    useEffect(() => {
      fetchImages();
      const channel = supabase.channel('realtime gallery')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
          fetchImages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        setUploading(true);
        setError(null);
    
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
    
        const { error: uploadError } = await supabase.storage
          .from("public-bucket")
          .upload(filePath, file);
    
        if (uploadError) {
          setError("Falha no upload da imagem. Tente novamente.");
          console.error(uploadError);
          setUploading(false);
          return;
        }
    
        const { data: { publicUrl } } = supabase.storage
          .from("public-bucket")
          .getPublicUrl(filePath);
    
        const { error: insertError } = await supabase.from("gallery").insert({
          url: publicUrl,
          alt: "Imagem da galeria", // Default alt text
        });
    
        if (insertError) {
          setError("Não foi possível guardar a imagem na base de dados.");
          console.error(insertError);
          // Clean up orphaned storage file if DB insert fails
          await supabase.storage.from("public-bucket").remove([filePath]);
        } else {
          toast({ title: "Sucesso!", description: "A imagem foi adicionada à galeria." });
        }
        setUploading(false);
      };

      const requestDeleteImage = (image: GalleryImage) => {
        setConfirmAction({
          title: "Eliminar Imagem",
          description: "Tens a certeza que queres eliminar esta imagem? Esta ação é irreversível.",
          action: () => deleteImage(image),
        });
      };
  
    const deleteImage = async (image: GalleryImage) => {
        const filePath = image.url.substring(image.url.lastIndexOf('public-bucket/') + 'public-bucket/'.length);
      
        const { error: storageError } = await supabase.storage
          .from("public-bucket")
          .remove([filePath]);
    
      if (storageError) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível eliminar o ficheiro da imagem." });
        console.error(storageError);
        return;
      }
  
      const { error: dbError } = await supabase
        .from("gallery")
        .delete()
        .eq("id", image.id);
  
      if (dbError) {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível eliminar a referência da imagem na base de dados." });
        console.error(dbError);
      } else {
        toast({ title: "Sucesso!", description: "A imagem foi removida da galeria." });
      }
    };
  
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                <ImageIcon className="text-primary" size={22} />
                <h2 className="font-display text-lg font-bold text-foreground">Gerir Galeria</h2>
                </div>
                <Button asChild className="sunset-gradient text-accent-foreground rounded-full">
                    <label htmlFor="imageUpload" className="cursor-pointer">
                        <Upload size={14} className="mr-2" />
                        Carregar Imagem
                        <input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                </Button>
            </div>

            {uploading && (
                <div className="flex items-center justify-center gap-2 p-4 mb-4 rounded-xl bg-muted/50 text-sm">
                <Loader2 className="animate-spin text-primary" size={16} />
                A carregar imagem, por favor aguarda...
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center gap-2 p-4 mb-4 rounded-xl bg-destructive/10 text-destructive text-sm">
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
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                    <ImageIcon size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">A galeria está vazia</p>
                    <p className="text-xs">Começa por carregar a primeira imagem.</p>
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
                        className="relative aspect-square group rounded-xl overflow-hidden shadow-sm border border-border"
                    >
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => requestDeleteImage(img)}
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
  