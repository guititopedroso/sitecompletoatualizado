import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionWrapper from "./ui/section-wrapper";

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    { q: t("faq_q7"), a: t("faq_a7") },
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
    { q: t("faq_q5"), a: t("faq_a5") },
    { q: t("faq_q6"), a: t("faq_a6") },
  ];

  return (
    <section id="faq" className="section-padding bg-background">
      <SectionWrapper>
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-sm font-semibold text-turquoise uppercase tracking-widest font-display mb-3 block">
              FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-4 tracking-tight">
              {t("faq_title")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t("faq_desc")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card rounded-2xl px-6 shadow-card border-none"
                >
                  <AccordionTrigger className="font-display font-600 text-foreground text-left hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default FAQ;
