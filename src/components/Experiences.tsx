import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Star, Camera, Sunset, Fish, MapPin, Waves, Anchor, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import WaveDivider from "./WaveDivider";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import BoatCatalog from "./BoatCatalog";
import SectionWrapper from "./ui/section-wrapper";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type DynamicTour = {
  id: string;
  name: string;
  image?: string;
  images?: string[];
  slug: string;
  popular: boolean;
  includes: string[];
  packs: { duration: string; price: string }[];
  order: number;
  capacity?: number;
};

const Experiences = ({ referralCode }: { referralCode?: string }) => {
  const [activeTab, setActiveTab] = useState("jetski");
  const [dynamicTours, setDynamicTours] = useState<DynamicTour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [selectedTour, setSelectedTour] = useState<DynamicTour | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, "tours"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DynamicTour[];
      setDynamicTours(data);
      setLoadingTours(false);
    }, (error) => {
      console.error("Error fetching tours:", error);
      setLoadingTours(false);
    });
    return () => unsubscribe();
  }, []);

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
    { id: "passeios", label: "Passeios Turísticos" },
  ];

  const currentPacks = jetskiPacks;

  return (
    <section id="experiencias" className="relative bg-foam">
      <WaveDivider
        bgColor="hsl(190 30% 96%)"
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
              ) : activeTab === "jetski" ? (
                <motion.div
                  key="jetski"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex justify-center mb-10">
                    <div className="w-fit bg-sunlight/10 border border-sunlight/30 p-1 rounded-2xl">
                      <div className="bg-white/50 backdrop-blur-sm rounded-[0.9rem] p-4 flex items-center gap-4 text-left">
                        <div className="bg-primary text-white p-3 rounded-xl shadow-lg shrink-0">
                          <Anchor size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 whitespace-nowrap">
                          <h3 className="text-lg font-display font-900 text-foreground leading-none uppercase tracking-tighter">
                            Sem Licença Necessária
                          </h3>
                          <p className="text-muted-foreground font-medium text-[10px] mt-1">
                            Aproveita a aventura sem preocupações.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {jetskiPacks.map((pack, i) => (
                      <motion.div
                        key={pack.slug}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={`group relative bg-card rounded-[2rem] p-1 shadow-2xl transition-all duration-500 hover:-translate-y-3 ${
                          pack.popular ? "ring-2 ring-coral/50 shadow-coral/20" : "hover:ring-2 hover:ring-ocean/30 shadow-ocean/5"
                        }`}
                      >
                        <div className="bg-card rounded-[1.9rem] p-8 h-full flex flex-col relative overflow-hidden">
                          {/* Decorative Background Element */}
                          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-500 group-hover:scale-150 ${pack.popular ? "bg-coral" : "bg-ocean"}`} />
                          
                          {pack.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 sunset-gradient text-white text-[10px] uppercase font-900 px-6 py-1.5 rounded-b-2xl shadow-lg z-10 tracking-widest">
                              {t("exp_most_popular")}
                            </div>
                          )}

                          <div className="mb-8 flex justify-center mt-2">
                            <motion.div 
                              whileHover={{ rotate: 5, scale: 1.1 }}
                              className={`p-5 rounded-3xl shadow-inner ${pack.popular ? "bg-coral/10 text-coral" : "bg-ocean/10 text-ocean"}`}
                            >
                              <pack.icon size={36} strokeWidth={2.5} />
                            </motion.div>
                          </div>

                          <div className="text-center mb-8">
                            <h3 className="text-lg font-display font-800 text-foreground/80 mb-1 uppercase tracking-tight">{pack.name}</h3>
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-4xl sm:text-5xl font-display font-900 text-foreground tracking-tighter">
                                {pack.price.replace('€', '')}
                              </span>
                              <span className="text-2xl font-display font-800 text-muted-foreground/50 self-start mt-1">€</span>
                            </div>
                          </div>

                          <ul className="space-y-4 mb-10 flex-1">
                            {pack.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-foreground/70 font-medium">
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${pack.popular ? "bg-coral shadow-[0_0_8px_rgba(255,107,107,0.5)]" : "bg-primary/40"}`} />
                                {item}
                              </li>
                            ))}
                          </ul>

                          <div className="flex justify-center mb-4">
                             <span className="bg-sunlight/10 text-sunlight text-[9px] font-800 px-3 py-1 rounded-full border border-sunlight/20 uppercase tracking-widest shadow-sm">
                               Sem Licença Necessária
                             </span>
                          </div>

                          <Button 
                            onClick={() => navigate(`/reservar?item=${pack.slug}${referralCode ? `&ref=${referralCode}` : ''}`)}
                            className={`w-full rounded-2xl py-7 font-display font-900 uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 group-hover:shadow-2xl ${
                              pack.popular 
                                ? "sunset-gradient text-white hover:shadow-coral/30" 
                                : "ocean-gradient text-white hover:shadow-ocean/30"
                            }`}
                          >
                            {t("exp_book_now")}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : activeTab === "passeios" ? (
                <>
                  <motion.div
                    key="passeios"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                  {loadingTours ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                  ) : dynamicTours.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Nenhum passeio encontrado.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dynamicTours.map((tour, i) => (
                        <motion.div
                          key={tour.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          onClick={() => setSelectedTour(tour)}
                          className="group cursor-pointer bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col"
                        >
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={(tour.images && tour.images.length > 0) ? tour.images[0] : (tour.image || "")}
                              alt={tour.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {tour.popular && (
                              <div className="absolute top-3 right-3 sunset-gradient text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <Star size={10} /> {t("exp_most_popular")}
                              </div>
                            )}
                          </div>

                          <div className="p-6 flex flex-col items-center text-center">
                            <h3 className="font-display font-700 text-xl text-foreground mb-2">{tour.name}</h3>
                            <div className="flex items-center justify-center gap-4 mb-4">
                              <div className="flex items-center gap-1.5 text-coral">
                                <Clock size={16}/>
                                <span className="text-xs font-bold uppercase">Flexível</span>
                              </div>
                              {tour.capacity && (
                                <div className="flex items-center gap-1.5 text-[#006666]">
                                  <Users size={16}/>
                                  <span className="text-xs font-bold uppercase">{tour.capacity} Pessoas</span>
                                </div>
                              )}
                            </div>
                            <Button variant="outline" className="rounded-full w-full border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold">
                              {t("exp_view_details")}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
                
                <Dialog open={!!selectedTour} onOpenChange={(open) => {
                  if (!open) {
                    setSelectedTour(null);
                    setActiveImageIndex(0);
                  }
                }}>
                  {selectedTour && (
                    <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-none shadow-2xl">
                      <div className="relative h-64 sm:h-80 group/carousel">
                        {/* Preload Images */}
                        <div className="hidden">
                          {selectedTour.images?.map((img, idx) => (
                            <img key={idx} src={img} alt="preload" />
                          ))}
                        </div>

                        <AnimatePresence mode="popLayout">
                          <motion.img
                            key={activeImageIndex}
                            src={
                              (selectedTour.images && selectedTour.images.length > 0) 
                                ? selectedTour.images[activeImageIndex] 
                                : (selectedTour.image || "")
                            }
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full object-cover"
                          />
                        </AnimatePresence>
                        
                        {selectedTour.images && selectedTour.images.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex(prev => (prev === 0 ? selectedTour.images.length - 1 : prev - 1));
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex(prev => (prev === selectedTour.images.length - 1 ? 0 : prev + 1));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                            >
                              <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {selectedTour.images.map((_, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? "bg-white w-4" : "bg-white/50"}`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none flex items-end p-6">
                           <div>
                              {selectedTour.popular && (
                                <span className="sunset-gradient text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block">Destaque</span>
                              )}
                              <h2 className="text-2xl sm:text-3xl font-display font-800 text-white leading-tight">{selectedTour.name}</h2>
                              {selectedTour.capacity && (
                                <div className="flex items-center gap-1.5 text-white/90 mt-1">
                                  <Users size={14} className="text-sunlight" />
                                  <span className="text-xs font-bold uppercase tracking-wider">Capacidade: {selectedTour.capacity} Pessoas</span>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                      
                      <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[60vh]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedTour.packs?.map((pack, idx) => (
                            <div key={idx} className="bg-muted px-3 py-2.5 rounded-xl border border-border/50 flex flex-col justify-center text-center group hover:border-primary/20 transition-colors">
                              <span className="text-[8px] font-bold text-coral uppercase tracking-wider mb-0.5">Duração</span>
                              <div className="flex items-center justify-center gap-1 mb-0.5">
                                <Clock size={12} className="text-primary"/>
                                <span className="text-sm font-display font-700 text-foreground">{pack.duration}</span>
                              </div>
                              <span className="text-lg font-display font-800 text-primary">{pack.price}</span>
                            </div>
                          ))}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-turquoise"/> O que inclui
                          </h4>
                          <ul className="grid grid-cols-1 gap-y-2.5">
                            {selectedTour.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 group-hover:bg-primary transition-colors" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button 
                          onClick={() => {
                            navigate(`/reservar?pack=${selectedTour.slug}${referralCode ? `&ref=${referralCode}` : ""}`);
                            setSelectedTour(null);
                          }}
                          className="w-full h-14 rounded-2xl text-md font-display font-bold ocean-gradient text-white shadow-ocean hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          Reservar Agora
                        </Button>
                      </div>
                    </DialogContent>
                  )}
                  </Dialog>
                </>
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
