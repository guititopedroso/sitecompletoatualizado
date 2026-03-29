import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { supabase } from "@/lib/supabase";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  span: string;
};

const GalleryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery")
        .select("id, url, alt")
        .order("created_at", { ascending: false });

      if (data) {
        // Assign spans dynamically for layout purposes
        const spans = ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"];
        const formattedImages = data.map((img, i) => ({
          ...img,
          id: img.id,
          url: img.url,
          alt: img.alt,
          span: spans[i % spans.length], // Cycle through spans
        }));
        setImages(formattedImages);
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
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.1 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.4 } }}
                  className={`${img.span} rounded-2xl overflow-hidden group cursor-pointer`}
                  onClick={() => {
                      setIndex(i);
                      setOpen(true);
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
        )}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
      />
    </div>
  );
};

export default GalleryPage;
