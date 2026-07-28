import { Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";

const Testimonials = () => {
  const { t } = useLanguage();

  const reviews = [
    { name: t("test_r1_name"), text: t("test_r1_text"), rating: 5 },
    { name: t("test_r2_name"), text: t("test_r2_text"), rating: 5 },
    { name: t("test_r3_name"), text: t("test_r3_text"), rating: 5 },
  ];

  return (
    <section className="section-padding bg-foam">
      <SectionWrapper>
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-coral uppercase tracking-widest font-display mb-3 block">
              {t("test_tag")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
              {t("test_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.15 * i + 0.05 * j,
                        type: "spring",
                        stiffness: 500,
                      }}
                    >
                      <Star size={18} className="fill-coral text-coral" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">
                  "{r.text}"
                </p>
                <p className="font-display font-700 text-foreground">
                  {r.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Testimonials;
