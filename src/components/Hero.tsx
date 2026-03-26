import { ChevronDown } from "lucide-react";
import WaveDivider from "./WaveDivider";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const Hero = () => {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" ref={ref} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <motion.div style={{ y: videoY }} className="absolute inset-0">
        <video autoPlay loop muted playsInline className="w-full h-[120%] object-cover">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 hero-overlay" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-turquoise-light/20 animate-ripple"
            style={{
              width: `${40 + i * 20}px`,
              height: `${40 + i * 20}px`,
              left: `${10 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[5]">
        <WaveDivider bgColor="hsl(200 20% 98%)" />
      </div>

      <motion.div style={{ y: textY, opacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm"
        >
          <span className="text-sm font-medium text-primary-foreground/90 font-body">{t("hero_badge")}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl sm:text-5xl md:text-7xl font-900 text-primary-foreground leading-tight mb-6 tracking-tight"
        >
          {t("hero_title_1")}<br />
          <motion.span
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-turquoise-light inline-block"
          >
            {t("hero_title_2")}
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-primary-foreground/80 font-body max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t("hero_subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo("#experiencias")}
            className="sunset-gradient text-accent-foreground px-8 py-4 rounded-full text-base font-bold font-display shadow-coral transition-shadow"
          >
            {t("hero_cta_book")}
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.button
        onClick={() => scrollTo("#sobre")}
        className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 z-10 text-primary-foreground/60"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={28} />
      </motion.button>
    </section>
  );
};

export default Hero;
