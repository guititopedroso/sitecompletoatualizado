import { LifeBuoy, BookOpen, BadgeCheck, ShieldCheck } from "lucide-react";
import WaveDivider from "./WaveDivider";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Safety = () => {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const items = [
    { icon: LifeBuoy, title: t("safety_s1_title"), desc: t("safety_s1_desc") },
    { icon: BookOpen, title: t("safety_s2_title"), desc: t("safety_s2_desc") },
    { icon: BadgeCheck, title: t("safety_s3_title"), desc: t("safety_s3_desc") },
    { icon: ShieldCheck, title: t("safety_s4_title"), desc: t("safety_s4_desc") },
  ];

  return (
    <section id="seguranca" className="relative">
      <div className="w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 120" className="w-full h-20 md:h-28" preserveAspectRatio="none">
          <path className="animate-wave-slow" d="M0,40 C240,100 480,0 720,50 C960,100 1200,10 1440,40 L1440,120 L0,120 Z" fill="hsl(210 80% 22%)" opacity="0.5" />
          <path className="animate-wave-mid" d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z" fill="hsl(210 80% 22%)" opacity="0.7" />
          <path className="animate-wave-front" d="M0,80 C180,50 360,100 540,70 C720,40 900,90 1080,70 C1260,50 1380,80 1440,75 L1440,120 L0,120 Z" fill="hsl(210 80% 22%)" />
        </svg>
      </div>

      <div className="ocean-gradient section-padding !pt-0">
        <div className="container-max" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold text-turquoise-light uppercase tracking-widest font-display mb-3 block">
              {t("safety_tag")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-primary-foreground mb-6 tracking-tight">
              {t("safety_title")}
            </h2>
            <p className="text-primary-foreground/70 text-lg">
              {t("safety_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.3 } }}
                className="text-center bg-primary-foreground/5 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 rounded-full bg-turquoise/20 flex items-center justify-center mx-auto mb-5"
                >
                  <item.icon size={28} className="text-turquoise-light" />
                </motion.div>
                <h3 className="font-display font-700 text-lg text-primary-foreground mb-2">{item.title}</h3>
                <p className="text-primary-foreground/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden leading-[0] rotate-180">
        <svg viewBox="0 0 1440 120" className="w-full h-20 md:h-28" preserveAspectRatio="none">
          <path className="animate-wave-slow" d="M0,40 C240,100 480,0 720,50 C960,100 1200,10 1440,40 L1440,120 L0,120 Z" fill="hsl(200 20% 98%)" opacity="0.5" />
          <path className="animate-wave-mid" d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z" fill="hsl(200 20% 98%)" opacity="0.7" />
          <path className="animate-wave-front" d="M0,80 C180,50 360,100 540,70 C720,40 900,90 1080,70 C1260,50 1380,80 1440,75 L1440,120 L0,120 Z" fill="hsl(200 20% 98%)" />
        </svg>
      </div>
    </section>
  );
};

export default Safety;
