import { Waves, Shield, Heart, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const About = () => {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    { icon: Waves, title: t("about_f1_title"), desc: t("about_f1_desc") },
    { icon: Shield, title: t("about_f2_title"), desc: t("about_f2_desc") },
    { icon: Heart, title: t("about_f3_title"), desc: t("about_f3_desc") },
    { icon: Zap, title: t("about_f4_title"), desc: t("about_f4_desc") },
  ];

  return (
    <section id="sobre" className="section-padding bg-background">
      <div className="container-max" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-turquoise uppercase tracking-widest font-display mb-3 block">
            {t("about_tag")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
            {t("about_title_1")}<br />{t("about_title_2")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("about_desc")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300 text-center"
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-14 h-14 rounded-xl turquoise-gradient flex items-center justify-center mx-auto mb-5"
              >
                <f.icon size={26} className="text-secondary-foreground" />
              </motion.div>
              <h3 className="font-display font-700 text-lg text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
