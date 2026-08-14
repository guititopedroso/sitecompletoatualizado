import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Heart, 
  MessageCircle, 
  ExternalLink, 
  Play, 
  Layers, 
  CheckCircle2, 
  MapPin, 
  Sparkles,
  Share2
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export type InstagramPost = {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  location?: string;
  category?: string;
};

const INSTAGRAM_HANDLE = "@royalcoast.pt";
const INSTAGRAM_URL = "https://www.instagram.com/royalcoast.pt";

const GalleryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [profile, setProfile] = useState<{
    username?: string;
    biography?: string;
    profile_picture_url?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
  }>({
    username: "royalcoast.pt",
    biography: "⚓️ Luxury Boat & Jet Ski\n📍 Setúbal — Tróia\nAdrenalina e exclusividade num só lugar. ⚡️\nReservas e valores no nosso site! 👇",
    profile_picture_url: "/royalcoast_profile.jpg",
    followers_count: 522,
    follows_count: 3,
    media_count: 9
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    const fetchInstagramData = async () => {
      setLoading(true);
      try {
        const [postsData, profileData] = await Promise.all([
          api.instagram.getPosts(),
          api.instagram.getProfile()
        ]);
        if (postsData && Array.isArray(postsData)) {
          setPosts(postsData);
        }
        if (profileData && profileData.username) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Error fetching Instagram data:", err);
      }
      setLoading(false);
    };

    fetchInstagramData();
  }, []);

  const filteredPosts = posts.filter(post => {
    if (activeCategory === "all") return true;
    if (activeCategory === "reels") return post.media_type === "VIDEO";
    return post.category === activeCategory;
  });

  const categories = [
    { id: "all", label: "Tudo" },
    { id: "tours", label: "Passeios de Barco" },
    { id: "jetski", label: "Jetski" },
    { id: "dolphins", label: "Golfinhos & Sado" },
    { id: "sunset", label: "Pôr do Sol" },
    { id: "reels", label: "Vídeos & Reels" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Banner */}
      <div className="ocean-gradient shadow-ocean">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={20} className="text-primary-foreground" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Instagram size={18} className="text-coral" />
                <h1 className="font-display text-xl font-800 text-primary-foreground">
                  {t("gallery_title_full")}
                </h1>
              </div>
              <p className="text-primary-foreground/80 text-xs sm:text-sm mt-0.5">
                {t("gallery_desc_full")}
              </p>
            </div>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            <Instagram size={16} />
            <span>Seguir no Instagram</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* Instagram Profile Card Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 mb-10 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Instagram Profile Avatar with gradient border */}
            <div className="relative group cursor-pointer" onClick={() => window.open(INSTAGRAM_URL, "_blank")}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-xl group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full rounded-full p-1 bg-background overflow-hidden">
                  <img
                    src={profile.profile_picture_url || "/royalcoast_profile.jpg"}
                    alt={INSTAGRAM_HANDLE}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/royalcoast_profile.jpg";
                    }}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="absolute bottom-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-1.5 rounded-full shadow-md">
                <Instagram size={14} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-bold font-display tracking-tight">{INSTAGRAM_HANDLE}</h2>
                  <CheckCircle2 size={20} className="text-sky-500 fill-sky-500/20" />
                </div>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-md mt-1"
                >
                  <Instagram size={14} />
                  <span>Seguir {INSTAGRAM_HANDLE}</span>
                </a>
              </div>

              {/* Bio */}
              <div className="text-sm text-foreground/90 max-w-2xl leading-relaxed mb-4 whitespace-pre-line font-medium">
                {profile.biography || "⚓️ Luxury Boat & Jet Ski\n📍 Setúbal — Tróia\nAdrenalina e exclusividade num só lugar. ⚡️\nReservas e valores no nosso site! 👇"}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 pt-2 border-t border-border/50 text-xs sm:text-sm">
                <div>
                  <span className="font-extrabold text-foreground block text-base">{posts.length || profile.media_count || 9}</span>
                  <span className="text-muted-foreground">Publicações</span>
                </div>
                <div>
                  <span className="font-extrabold text-foreground block text-base">{profile.followers_count || 522}</span>
                  <span className="text-muted-foreground">Seguidores</span>
                </div>
                <div>
                  <span className="font-extrabold text-foreground block text-base">{profile.follows_count || 3}</span>
                  <span className="text-muted-foreground">A Seguir</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setDisplayLimit(12);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "ocean-gradient text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Loading State */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mx-auto mb-3 text-primary" size={32} />
            <p className="text-sm font-medium">A carregar publicações do Instagram @royalcoast.pt...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
            <Instagram size={48} className="mx-auto mb-4 opacity-30 text-purple-500" />
            <h3 className="font-display text-lg font-semibold mb-1">Sem publicações nesta categoria</h3>
            <p className="text-sm">Tente escolher outra categoria ou explore o nosso perfil no Instagram.</p>
          </div>
        ) : (
          /* Instagram Grid Layout */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredPosts.slice(0, displayLimit).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => setSelectedPostIndex(i)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-muted shadow-md hover:shadow-2xl transition-all duration-300"
              >
                {/* Media Image */}
                <img
                  src={post.thumbnail_url || post.media_url}
                  alt={post.caption || "Instagram @royalcoast.pt"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Media Type Icon Badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg z-10">
                  {post.media_type === "VIDEO" ? (
                    <Play size={14} className="fill-white" />
                  ) : post.media_type === "CAROUSEL_ALBUM" ? (
                    <Layers size={14} />
                  ) : (
                    <Instagram size={14} />
                  )}
                </div>

                {/* Hover Overlay with Likes & Comments */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end text-white z-20">
                  <p className="text-xs text-white/90 line-clamp-2 font-medium mb-3">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between border-t border-white/20 pt-2 text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart size={14} className="fill-rose-500 text-rose-500" />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        {post.comments_count}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70 uppercase font-semibold">Ver ↗</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredPosts.length > displayLimit && (
          <div className="text-center mt-12">
            <Button
              onClick={() => setDisplayLimit((prev) => prev + 12)}
              variant="outline"
              className="rounded-full px-8 py-6 border-primary/30 hover:bg-primary/5 text-primary font-bold shadow-sm"
            >
              Carregar mais publicações
            </Button>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-amber-900/40 border border-purple-500/20 p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto relative z-10">
            <Sparkles className="mx-auto text-amber-400 mb-3" size={28} />
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Siga @royalcoast.pt no Instagram!
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-6">
              Partilhamos diariamente histórias, fotos dos clientes, novidades dos passeios e o estado do tempo no mar de Sesimbra.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm px-6 py-3 rounded-full shadow-xl transition-all hover:scale-105"
            >
              <Instagram size={18} />
              <span>Abrir Instagram Oficial</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox Instagram Modal */}
      <Dialog open={selectedPostIndex !== null} onOpenChange={(open) => !open && setSelectedPostIndex(null)}>
        {selectedPostIndex !== null && filteredPosts[selectedPostIndex] && (
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl max-h-[90vh] sm:h-[80vh] flex flex-col md:flex-row">
            {/* Left: Media Preview */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-full group">
              {filteredPosts[selectedPostIndex].media_type === "VIDEO" ? (
                <video
                  src={filteredPosts[selectedPostIndex].media_url}
                  poster={filteredPosts[selectedPostIndex].thumbnail_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={filteredPosts[selectedPostIndex].media_url}
                  alt={filteredPosts[selectedPostIndex].caption}
                  className="max-h-full max-w-full object-contain"
                />
              )}

              {/* Prev / Next controls */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPostIndex((prev) => (prev === 0 ? filteredPosts.length - 1 : prev! - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all z-30"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPostIndex((prev) => (prev === filteredPosts.length - 1 ? 0 : prev! + 1));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all z-30"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* Right: Instagram Info & Caption */}
            <div className="w-full md:w-[380px] bg-card flex flex-col p-6 overflow-y-auto justify-between border-t md:border-t-0 md:border-l border-border/40">
              <div>
                {/* Account header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600">
                      <img
                        src={profile.profile_picture_url || "/royalcoast_profile.jpg"}
                        alt={INSTAGRAM_HANDLE}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/royalcoast_profile.jpg";
                        }}
                        className="w-full h-full object-cover rounded-full bg-background"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm font-display">{INSTAGRAM_HANDLE}</span>
                        <CheckCircle2 size={14} className="text-sky-500 fill-sky-500/20" />
                      </div>
                      {filteredPosts[selectedPostIndex].location && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin size={10} />
                          <span>{filteredPosts[selectedPostIndex].location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Caption text */}
                <div className="text-sm leading-relaxed text-foreground/90 space-y-3 mb-6">
                  <p className="whitespace-pre-line">
                    {filteredPosts[selectedPostIndex].caption}
                  </p>
                </div>
              </div>

              {/* Footer details & Action */}
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                      <Heart size={16} className="fill-rose-500" />
                      {filteredPosts[selectedPostIndex].like_count} gostos
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <MessageCircle size={16} />
                      {filteredPosts[selectedPostIndex].comments_count}
                    </span>
                  </div>
                </div>

                <a
                  href={filteredPosts[selectedPostIndex].permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all"
                >
                  <Instagram size={16} />
                  <span>Ver publicação no Instagram ↗</span>
                </a>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default GalleryPage;
