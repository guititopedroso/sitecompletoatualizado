import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence } from "framer-motion";

type GalleryImage = {
    id: string;
    url: string;
    alt: string;
    span: string;
};

const Gallery = () => {
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "gallery"), orderBy("created_at", "desc"), limit(4));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        if (data) {
          const spans = ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"];
          const formattedImages = data.map((img, i) => ({
              ...img,
              span: spans[i % spans.length],
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

  return (
    <section id="galeria" className="section-padding bg-background">
      <SectionWrapper>
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-turquoise uppercase tracking-widest font-display mb-3 block">
              {t("gallery_tag")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
              {t("gallery_title")}
            </h2>
          </div>

          {loading ? (
            <div className="h-[520px] flex items-center justify-center">
                 <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
                {images.map((img, i) => (
                <motion.div
                    key={img.id}
                    onClick={() => setSelectedImageIndex(i)}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                    duration: 0.7,
                    delay: 0.1 * i,
                    ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ scale: 1.03, transition: { duration: 0.4 } }}
                    className={`${img.span} rounded-2xl overflow-hidden group cursor-pointer shadow-lg`}
                >
                    <motion.img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    whileHover={{ scale: 1.12 }}
                    transition={{ duration: 0.7 }}
                    />
                </motion.div>
                ))}
            </div>
          )}

          <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
            {selectedImageIndex !== null && (
              <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl h-[80vh] flex flex-col items-center justify-center">
                {/* Preload Gallery */}
                <div className="hidden">
                  {images.map((img, idx) => (
                    <img key={idx} src={img.url} alt="preload" />
                  ))}
                </div>

                <div className="relative w-full h-full group">
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={selectedImageIndex}
                      src={images[selectedImageIndex].url}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full object-contain"
                    />
                  </AnimatePresence>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev === 0 ? images.length - 1 : prev! - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all z-50"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev === images.length - 1 ? 0 : prev! + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all z-50"
                  >
                    <ChevronRight size={24} />
                  </button>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === selectedImageIndex ? "bg-white w-6" : "bg-white/30"}`}
                      />
                    ))}
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>

          <div className="text-center mt-12">
            <Link to="/galeria">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ocean-gradient text-primary-foreground font-display font-700 px-8 py-3.5 rounded-xl shadow-ocean transition-all"
              >
                {t("gallery_cta")}
              </motion.button>
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Gallery;
