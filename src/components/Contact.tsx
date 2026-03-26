import { Phone, MessageCircle, Instagram, Clock, MapPin, Mail } from "lucide-react";
import { useState } from "react";
import WaveDivider from "./WaveDivider";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Contact = () => {
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" });
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(`Olá! O meu nome é ${form.nome}. ${form.mensagem}`);
    window.open(`https://wa.me/351927314506?text=${msg}`, "_blank");
  };

  const contactInfo = [
    { icon: Phone, title: t("contact_phone"), lines: ["+351 927 314 506"] },
    { icon: MessageCircle, title: t("contact_whatsapp"), lines: [t("contact_whatsapp_desc")] },
    { icon: Mail, title: t("contact_email"), lines: ["info@royalcoast.pt"] },
    { icon: Instagram, title: t("contact_instagram"), lines: ["@royalcoast.setubal"] },
    { icon: Clock, title: t("contact_hours"), lines: [t("contact_hours_1"), t("contact_hours_2")] },
    { icon: MapPin, title: t("contact_location"), lines: [t("contact_loc_1"), t("contact_loc_2")] },
  ];

  return (
    <section id="contactos" className="relative bg-background">
      <div className="w-full overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 80" className="w-full h-12 md:h-20" preserveAspectRatio="none">
          <path className="animate-wave-mid" d="M0,30 C360,70 720,0 1080,40 C1260,55 1380,45 1440,30 L1440,80 L0,80 Z" fill="hsl(200 20% 98%)" />
        </svg>
      </div>

      <div className="section-padding !pt-0" ref={ref}>
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold text-turquoise uppercase tracking-widest font-display mb-3 block">
              {t("contact_tag")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
              {t("contact_title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("contact_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {contactInfo.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.25 + 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  className="flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl turquoise-gradient flex items-center justify-center shrink-0">
                    <c.icon size={20} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-foreground mb-1">{c.title}</h3>
                    {c.lines.map((l) => (
                      <p key={l} className="text-muted-foreground">{l}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl p-8 shadow-card space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("contact_form_name")}</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
                  placeholder={t("contact_form_name_ph")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("contact_form_email")}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all"
                  placeholder="email@exemplo.pt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-display">{t("contact_form_message")}</label>
                <textarea
                  required
                  rows={4}
                  value={form.mensagem}
                  onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all resize-none"
                  placeholder={t("contact_form_message_ph")}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sunset-gradient text-accent-foreground py-3.5 rounded-xl font-display font-700 text-sm shadow-coral transition-shadow"
              >
                {t("contact_form_send")}
              </motion.button>
            </motion.form>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 rounded-2xl overflow-hidden shadow-card h-[300px] md:h-[400px]"
          >
            <iframe
              title="Localização Royal Coast"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3118.5!2d-8.8882!3d38.5244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd194f4a2e7b1b1d%3A0x1c5e3a5e7b1b1b1d!2sClube%20Naval%20Setubalense!5e0!3m2!1spt-PT!2spt!4v1700000000000!5m2!1spt-PT!2spt"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
