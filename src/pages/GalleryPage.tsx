import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  span: string;
};

const GalleryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "gallery"), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        if (data) {
          // Assign spans dynamically for layout purposes
          const spans = ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"];
          const formattedImages = data.map((img, i) => ({
            ...img,
            span: spans[i % spans.length], // Cycle through spans
          }));
          setImages(formattedImages);
        }
      } catch (err) {
        console.error("Error fetching images:", err);
      }
      setLoading(false);
    };

    fetchImages();
  }, []);

  const slides = images.map((img) => ({ src: img.url }));

  return (
    <div className="min-h-screen bg-background">
      <div className="ocean-gradient">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} className="text-primary-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-800 text-primary-foreground">{t("gallery_title_full")}</h1>
            <p className="text-primary-foreground/70 text-sm">{t("gallery_desc_full")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Loader2 className="animate-spin mx-auto mb-3" />
            <p>A carregar galeria...</p>
          </div>
        ) : images.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <ImageIcon size={40} className="mx-auto mb-4 opacity-40" />
                <h3 className="font-display text-lg font-semibold mb-1">Galeria Vazia</h3>
                <p className="text-sm">Ainda não foram adicionadas imagens à galeria.</p>
            </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
              {images.slice(0, displayLimit).map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "200px" }}
                  transition={{ duration: 0.4 }}
                  style={{ contentVisibility: 'auto' }}
                  className={`${img.span} rounded-2xl overflow-hidden group cursor-pointer bg-muted`}
                  onClick={() => setSelectedImageIndex(i)}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
        )}

        {!loading && images.length > displayLimit && (
          <div className="text-center mt-12">
            <Button 
               onClick={() => setDisplayLimit(prev => prev + 12)}
               variant="outline"
               className="rounded-xl px-10 py-6 border-primary/20 hover:bg-primary/5 text-primary font-bold"
            >
               Ver mais fotos
            </Button>
          </div>
        )}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        {selectedImageIndex !== null && (
          <DialogContent className="max-w-6xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl h-[85vh] flex flex-col items-center justify-center">
            <div className="relative w-full h-full group">
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={selectedImageIndex}
                  src={images[selectedImageIndex].url}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-contain"
                />
              </AnimatePresence>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev! - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-50"
              >
                <ChevronLeft size={28} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev! + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-50"
              >
                <ChevronRight size={28} />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-4 overflow-x-auto max-w-[80%] pb-2">
                {images.length < 20 && images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${idx === selectedImageIndex ? "bg-white w-6" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default GalleryPage;
