import { Waves, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative">
      <div className="w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-16" preserveAspectRatio="none">
          <path className="animate-wave-slow" d="M0,30 C360,70 720,0 1080,40 C1260,55 1380,45 1440,30 L1440,80 L0,80 Z" fill="hsl(210 80% 22%)" />
        </svg>
      </div>

      {/* Affiliate CTA */}
      <div className="ocean-gradient border-b border-primary-foreground/10">
        <div className="container-max py-6 px-4">
          <Link
            to="/afiliado"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 group"
          >
            <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Gift size={20} className="text-coral-light" />
            </div>
            <p className="text-primary-foreground/80 text-sm sm:text-base text-center font-display font-600">
              Queres ser afiliado e ganhar uma <span className="text-coral-light font-800">viagem de Jet Ski gratuita</span>?
            </p>
            <span className="sunset-gradient text-accent-foreground px-5 py-2 rounded-full text-xs font-semibold shrink-0 group-hover:scale-105 transition-transform">
              Saber mais →
            </span>
          </Link>
        </div>
      </div>

      <div className="ocean-gradient py-12 px-4">
        <div className="container-max">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Waves size={24} className="text-turquoise-light animate-wave" />
              <span className="font-display text-xl font-800 text-primary-foreground">
                Vale<span className="text-coral-light">Jet</span>
              </span>
            </div>

            <p className="text-primary-foreground/50 text-sm text-center">
              © {new Date().getFullYear()} Vale Jet – Setúbal Jet Ski Rentals. {t("footer_rights")}
            </p>

            <div className="flex gap-6">
              <Link to="/termos" className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors">
                {t("footer_terms")}
              </Link>
              <Link to="/privacidade" className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors">
                {t("footer_privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
