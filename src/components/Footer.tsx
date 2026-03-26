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

      <div className="ocean-gradient py-12 px-4">
        <div className="container-max">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Waves size={24} className="text-turquoise-light animate-wave" />
              <span className="font-display text-xl font-800 text-primary-foreground">
                Royal<span className="text-coral-light">Coast</span>
              </span>
            </div>

            <p className="text-primary-foreground/50 text-sm text-center">
              © {new Date().getFullYear()} Royal Coast – Setúbal Jet Ski Rentals. {t("footer_rights")}
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
