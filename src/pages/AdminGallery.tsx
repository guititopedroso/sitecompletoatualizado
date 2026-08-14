import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Instagram, ExternalLink, Loader2, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InstagramPost } from "./GalleryPage";

const AdminGallery = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadPosts = async () => {
    setRefreshing(true);
    try {
      const data = await api.instagram.getPosts();
      if (Array.isArray(data)) {
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar publicações do Instagram." });
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-md">
            <Instagram size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Galeria do Instagram</h2>
            <p className="text-xs text-muted-foreground">Sincronizada automaticamente com @royalcoast.pt</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadPosts} 
            disabled={refreshing}
            className="rounded-full text-xs"
          >
            <RefreshCw size={13} className={`mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-full text-xs font-bold shadow-md">
            <a href="https://www.instagram.com/royalcoast.pt" target="_blank" rel="noopener noreferrer">
              <Instagram size={14} className="mr-1.5" />
              Abrir @royalcoast.pt ↗
            </a>
          </Button>
        </div>
      </div>

      {/* Integration Card Banner */}
      <div className="p-6 rounded-2xl bg-card border border-border mb-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80"
                alt="@royalcoast.pt"
                className="w-full h-full object-cover rounded-full bg-background"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base">@royalcoast.pt</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as novas fotos e vídeos publicados no perfil <strong>@royalcoast.pt</strong> aparecem automaticamente na aba da Galeria do site.
              </p>
            </div>
          </div>

          <Button asChild variant="secondary" size="sm" className="rounded-xl shrink-0 text-xs">
            <a href="/galeria" target="_blank" rel="noopener noreferrer">
              <Eye size={14} className="mr-1.5 text-primary" />
              Ver Galeria no Site
            </a>
          </Button>
        </div>
      </div>

      {/* Instagram Feed Grid Preview */}
      <h3 className="font-display text-sm font-bold text-foreground mb-4">
        Pré-visualização do Feed Atual ({posts.length} publicações)
      </h3>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">A carregar o feed do Instagram...</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square group rounded-xl overflow-hidden shadow-sm border border-border bg-muted"
            >
              <img
                src={post.thumbnail_url || post.media_url}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white z-10 text-xs">
                <p className="line-clamp-3 text-[10px] text-white/90 leading-tight">
                  {post.caption}
                </p>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:underline mt-2"
                >
                  <span>Ver no Instagram</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AdminGallery;