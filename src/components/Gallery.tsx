import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery")
        .select("id, url, alt")
        .order("created_at", { ascending: false })
        .limit(4); // Fetch only the 4 most recent images

      if (data) {
        const spans = ["col-span-2 row-span-2", "col-span-1 row-span-1", "col-span-1 row-span-1", "col-span-2 row-span-1"];
        const formattedImages = data.map((img, i) => ({
            ...img,
            id: img.id,
            url: img.url,
            alt: img.alt,
            span: spans[i % spans.length],
        }));
        setImages(formattedImages);
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
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                    duration: 0.7,
                    delay: 0.1 * i,
                    ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ scale: 1.03, transition: { duration: 0.4 } }}
                    className={`${img.span} rounded-2xl overflow-hidden group`}
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
