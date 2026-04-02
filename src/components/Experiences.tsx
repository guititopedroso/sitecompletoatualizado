import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Star, Camera } from "lucide-react";
import WaveDivider from "./WaveDivider";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import BoatCatalog from "./BoatCatalog";
import SectionWrapper from "./ui/section-wrapper";

const Experiences = ({ referralCode }: { referralCode?: string }) => {
  const [activeTab, setActiveTab] = useState("jetski");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const jetskiPacks = [
    {
      icon: Clock,
      name: t("exp_15min"),
      slug: "15-minutos",
      price: "50€",
      popular: false,
      includes: [
        t("exp_inc_1jetski"),
        t("exp_inc_lifejacket"),
        t("exp_inc_briefing"),
        t("exp_inc_insurance"),
      ],
    },
    {
      icon: Clock,
      name: t("exp_30min"),
      slug: "30-minutos",
      price: "80€",
      popular: true,
      includes: [
        t("exp_inc_1jetski"),
        t("exp_inc_lifejacket"),
        t("exp_inc_briefing"),
        t("exp_inc_insurance"),
      ],
    },
    {
      icon: Clock,
      name: t("exp_1hour"),
      slug: "1-hora",
      price: "120€",
      popular: false,
      includes: [
        t("exp_inc_1jetski"),
        t("exp_inc_lifejacket"),
        t("exp_inc_briefing"),
        t("exp_inc_insurance"),
      ],
    },
    {
      icon: Users,
      name: t("exp_group"),
      slug: "pack-grupo",
      price: "400€",
      popular: false,
      includes: [
        t("exp_inc_4jetski"),
        t("exp_inc_1hour"),
        t("exp_inc_guide"),
        t("exp_inc_briefing"),
        t("exp_inc_insurance"),
      ],
    },
  ];

  const tabs = [
    { id: "jetski", label: t("exp_tab_jetski") },
    { id: "barcos", label: t("exp_tab_boats") },
  ];

  const currentPacks = jetskiPacks;

  return (
    <section id="experiencias" className="relative bg-foam">
      <WaveDivider
        bgColor="hsl(190 30% 96%)"
        flip
        className="absolute top-0 left-0 right-0 z-10 -translate-y-full"
      />
      <SectionWrapper>
        <div className="pt-6 pb-16 md:pt-10 md:pb-24">
          <div className="container-max">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-sm font-semibold text-coral uppercase tracking-widest font-display mb-3 block">
                {t("exp_tag")}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
                {t("exp_title")}
              </h2>
              <p className="text-muted-foreground text-lg">{t("exp_desc")}</p>
            </div>

            <div className="flex justify-center gap-2 mb-12">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-6 py-3 rounded-full font-display font-600 text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "ocean-gradient text-primary-foreground shadow-ocean"
                      : "bg-card text-muted-foreground hover:text-foreground shadow-card"
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "barcos" ? (
                <motion.div
                  key="barcos"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <BoatCatalog referralCode={referralCode} />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    currentPacks.length > 2
                      ? "lg:grid-cols-4"
                      : "lg:grid-cols-2 max-w-2xl mx-auto"
                  } gap-6`}
                >
                  {currentPacks.map((pkg, i) => (
                    <motion.div
                      key={pkg.slug}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.08 * i,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className={`relative bg-card rounded-2xl p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col ${
                        pkg.popular ? "ring-2 ring-coral" : ""
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 sunset-gradient text-accent-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                          <Star size={12} /> {t("exp_most_popular")}
                        </div>
                      )}

                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-12 h-12 rounded-xl ocean-gradient flex items-center justify-center mb-5"
                      >
                        <pkg.icon
                          size={22}
                          className="text-primary-foreground"
                        />
                      </motion.div>

                      <h3 className="font-display font-700 text-xl text-foreground mb-1">
                        {pkg.name}
                      </h3>
                      <div className="mb-1">
                        <span className="font-display text-3xl font-800 text-foreground">
                          {pkg.price}
                        </span>
                      </div>
                      {activeTab === "jetski" && (
                        <p className="text-xs text-muted-foreground mb-5">
                          {t("exp_max_2")}
                        </p>
                      )}
                      {activeTab !== "jetski" && <div className="mb-5" />}

                      <ul className="space-y-2.5 mb-7 flex-1">
                        {pkg.includes.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-turquoise mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                        <li className="flex items-start gap-2 text-sm text-coral font-medium">
                          <Camera size={14} className="mt-0.5 shrink-0" />
                          {t("exp_photos_optional")}
                        </li>
                      </ul>

                      <motion.button
                        onClick={() =>
                          navigate(
                            `/reservar?pack=${pkg.slug}${referralCode ? `&ref=${referralCode}` : ""}`
                          )
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full py-3 rounded-xl font-display font-600 text-sm transition-shadow ${
                          pkg.popular
                            ? "sunset-gradient text-accent-foreground shadow-coral"
                            : "ocean-gradient text-primary-foreground shadow-ocean"
                        }`}
                      >
                        {t("exp_book")}
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Experiences;
