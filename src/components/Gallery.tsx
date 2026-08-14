import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2, ChevronLeft, ChevronRight, Instagram, Heart, MessageCircle, Play, Layers, ExternalLink, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type InstagramPost = {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  location?: string;
};

const Gallery = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      setLoading(true);
      try {
        const data = await api.instagram.getPosts();
        if (data && Array.isArray(data)) {
          setPosts(data.slice(0, 6)); // Display first 6 posts on homepage
        }
      } catch (err) {
        console.error("Error fetching Instagram posts:", err);
      }
      setLoading(false);
    };

    fetchInstagramPosts();
  }, []);

  return (
    <section id="galeria" className="section-padding bg-background relative overflow-hidden">
      <SectionWrapper>
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-pink-500/20 text-xs sm:text-sm font-semibold text-pink-600 dark:text-pink-400 mb-4">
              <Instagram size={14} />
              <span>{t("gallery_tag")}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-4 tracking-tight">
              {t("gallery_title")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Siga as nossas aventuras marítimas diariamente no Instagram <strong>@royalcoast.pt</strong>
            </p>
          </div>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  onClick={() => setSelectedPostIndex(i)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-muted shadow-md hover:shadow-xl transition-all"
                >
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Icon Indicator */}
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white p-1 rounded-full text-xs">
                    {post.media_type === "VIDEO" ? (
                      <Play size={12} className="fill-white" />
                    ) : post.media_type === "CAROUSEL_ALBUM" ? (
                      <Layers size={12} />
                    ) : (
                      <Instagram size={12} />
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end text-white z-10">
                    <p className="text-[11px] text-white/90 line-clamp-2 mb-2 font-medium">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-bold text-white/90">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="fill-rose-500 text-rose-500" />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Lightbox Instagram Modal */}
          <Dialog open={selectedPostIndex !== null} onOpenChange={(open) => !open && setSelectedPostIndex(null)}>
            {selectedPostIndex !== null && posts[selectedPostIndex] && (
              <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl max-h-[90vh] sm:h-[80vh] flex flex-col md:flex-row">
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[260px] md:min-h-full">
                  <img
                    src={posts[selectedPostIndex].media_url}
                    alt={posts[selectedPostIndex].caption}
                    className="max-h-full max-w-full object-contain"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPostIndex((prev) => (prev === 0 ? posts.length - 1 : prev! - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all z-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPostIndex((prev) => (prev === posts.length - 1 ? 0 : prev! + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md transition-all z-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="w-full md:w-[360px] bg-card flex flex-col p-6 overflow-y-auto justify-between border-t md:border-t-0 md:border-l border-border/40">
                  <div>
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
                      <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600">
                        <img
                          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=150&q=80"
                          alt="@royalcoast.pt"
                          className="w-full h-full object-cover rounded-full bg-background"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-sm font-display block">@royalcoast.pt</span>
                        {posts[selectedPostIndex].location && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} />
                            {posts[selectedPostIndex].location}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-4">
                      {posts[selectedPostIndex].caption}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart size={14} className="fill-rose-500" />
                        {posts[selectedPostIndex].like_count} gostos
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle size={14} />
                        {posts[selectedPostIndex].comments_count} comentários
                      </span>
                    </div>

                    <a
                      href={posts[selectedPostIndex].permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
                    >
                      <Instagram size={14} />
                      <span>Ver no Instagram ↗</span>
                    </a>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link to="/galeria">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ocean-gradient text-primary-foreground font-display font-700 px-8 py-3.5 rounded-xl shadow-ocean transition-all text-sm"
              >
                {t("gallery_cta")}
              </motion.button>
            </Link>

            <a
              href="https://www.instagram.com/royalcoast.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-display font-700 px-6 py-3.5 rounded-xl shadow-lg transition-all text-sm"
            >
              <Instagram size={16} />
              <span>Seguir @royalcoast.pt</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Gallery;
