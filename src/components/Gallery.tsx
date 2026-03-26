import jetski1 from "@/assets/gallery-jetski-1.jpg";
import jetski2 from "@/assets/gallery-jetski-2.jpg";
import jetski3 from "@/assets/gallery-jetski-3.jpg";
import jetski4 from "@/assets/gallery-jetski-4.jpg";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";

const images = [
  {
    src: jetski1,
    alt: "Jet ski em Setúbal",
    span: "col-span-2 row-span-2",
  },
  { src: jetski2, alt: "Grupo de jet skis", span: "col-span-1 row-span-1" },
  {
    src: jetski3,
    alt: "Jet ski em velocidade",
    span: "col-span-1 row-span-1",
  },
  { src: jetski4, alt: "Jet skis na água", span: "col-span-2 row-span-1" },
];

const Gallery = () => {
  const { t } = useLanguage();

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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            {images.map((img, i) => (
              <motion.div
                key={i}
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
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  whileHover={{ scale: 1.12 }}
                  transition={{ duration: 0.7 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Gallery;
