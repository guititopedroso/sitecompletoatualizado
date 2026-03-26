import { useState, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language, languageFlags, languageLabels } from "@/i18n/translations";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navLinks = [
    { label: t("nav_home"), href: "#hero" },
    { label: t("nav_about"), href: "#sobre" },
    { label: t("nav_experiences"), href: "#experiencias" },
    { label: t("nav_safety"), href: "#seguranca" },
    { label: t("nav_gallery"), href: "#galeria" },
    { label: t("nav_contacts"), href: "#contactos" },
  ];

  const languages: Language[] = ["pt", "en", "de", "es", "fr", "zh"];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "ocean-gradient shadow-ocean py-3 backdrop-blur-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-max flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.button
          onClick={() => scrollTo("#hero")}
          whileHover={{ scale: 1.05 }}
          className="font-display text-2xl font-900 tracking-tight text-primary-foreground"
        >
          Vale<span className="text-coral">Jet</span>
        </motion.button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l, i) => (
            <motion.button
              key={l.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              onClick={() => scrollTo(l.href)}
              whileHover={{ y: -2 }}
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              {l.label}
            </motion.button>
          ))}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo("#experiencias")}
            className="sunset-gradient text-accent-foreground px-5 py-2.5 rounded-full text-sm font-semibold transition-shadow"
          >
            {t("nav_book_now")}
          </motion.button>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
              className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium"
            >
              <Globe size={16} />
              <span>{languageFlags[language]} {languageLabels[language]}</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 bg-card rounded-xl shadow-card-hover border border-border py-2 min-w-[140px] z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={(e) => { e.stopPropagation(); setLanguage(lang); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                        language === lang
                          ? "bg-primary/10 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{languageFlags[lang]}</span>
                      <span>{languageLabels[lang]}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: lang + toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-1"
            >
              <Globe size={18} />
              <span className="text-xs font-medium">{languageFlags[language]}</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 bg-card rounded-xl shadow-card-hover border border-border py-2 min-w-[130px] z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={(e) => { e.stopPropagation(); setLanguage(lang); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                        language === lang
                          ? "bg-primary/10 text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{languageFlags[lang]}</span>
                      <span>{languageLabels[lang]}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={() => setMobileOpen(!mobileOpen)}
            whileTap={{ scale: 0.9 }}
            className="text-primary-foreground"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden ocean-gradient border-t border-primary-foreground/10 overflow-hidden"
          >
            <div className="px-4 pb-6 pt-4 space-y-3">
              {navLinks.map((l, i) => (
                <motion.button
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  onClick={() => scrollTo(l.href)}
                  className="block w-full text-left text-primary-foreground/80 hover:text-primary-foreground py-2 text-sm font-medium"
                >
                  {l.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                onClick={() => scrollTo("#experiencias")}
                className="sunset-gradient text-accent-foreground w-full py-3 rounded-full text-sm font-semibold mt-2"
              >
                {t("nav_book_now")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
