import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Anchor, Gauge, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { AnimatePresence } from "framer-motion";



type Boat = {
  id: string;
  name: string;
  size: string;
  engine: string;
  capacity: number;
  price4h: string;
  price8h: string;
  image?: string;
  images?: string[];
  slug: string;
  range: "low" | "mid" | "high";
  order?: number;
  created_at?: string;
  features?: string[];
};

const BoatCatalog = ({ referralCode }: { referralCode?: string }) => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const clientSort = (data: Boat[]) =>
    [...data].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.created_at && b.created_at)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return 0;
    });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "boats"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(clientSort(data));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching boats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="w-fit bg-primary/5 border border-primary/20 p-1 rounded-2xl">
          <div className="bg-white/50 backdrop-blur-sm rounded-[0.9rem] p-4 flex items-center gap-4 text-left">
            <div className="bg-primary text-white p-3 rounded-xl shadow-lg shrink-0">
              <Anchor size={20} strokeWidth={3} />
            </div>
            <div className="flex-1 whitespace-nowrap">
              <h3 className="text-lg font-display font-900 text-foreground leading-none uppercase tracking-tighter">
                Carta de Marinheiro Necessária
              </h3>
              <p className="text-muted-foreground font-semibold text-xs mt-1.5 text-center sm:text-left">
                É exigida licença de navegação para conduzir as embarcações.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : boats.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-display font-600">Nenhum barco disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {boats.map((boat, i) => (
              <motion.div
                key={boat.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => setSelectedBoat(boat)}
                className="group cursor-pointer flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-border/50"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={(boat.images && boat.images.length > 0) ? boat.images[0] : (boat.image || "")}
                    alt={boat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                      <Users size={14} className="text-primary" />
                      <span className="text-[10px] font-900 text-foreground uppercase tracking-widest">{boat.capacity} Pessoas</span>
                    </div>
                  </div>
                </div>

                <div className="p-7 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="font-display font-800 text-xl text-foreground group-hover:text-primary transition-colors duration-300">{boat.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-bold text-muted-foreground uppercase">{boat.size}</span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-bold text-muted-foreground uppercase">{boat.engine}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/50 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Meio Dia</span>
                      <p className="font-display font-900 text-lg text-foreground">{boat.price4h.includes('€') ? boat.price4h : `${boat.price4h}€`}</p>
                    </div>
                    <div className="space-y-1 border-l border-border/50 pl-4">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Dia Inteiro</span>
                      <p className="font-display font-900 text-lg text-primary">{boat.price8h.includes('€') ? boat.price8h : `${boat.price8h}€`}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!selectedBoat} onOpenChange={(open) => {
        if (!open) {
          setSelectedBoat(null);
          setActiveImageIndex(0);
        }
      }}>
        {selectedBoat && (
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-none shadow-2xl">
            <div className="relative h-64 sm:h-80 group/carousel">
              {/* Preload Images */}
              <div className="hidden">
                {selectedBoat.images?.map((img, idx) => (
                  <img key={idx} src={img} alt="preload" />
                ))}
              </div>

              <AnimatePresence mode="popLayout">
                <motion.img
                  key={activeImageIndex}
                  src={
                    (selectedBoat.images && selectedBoat.images.length > 0)
                      ? selectedBoat.images[activeImageIndex]
                      : (selectedBoat.image || "")
                  }
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {selectedBoat.images && selectedBoat.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === 0 ? selectedBoat.images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(prev => (prev === selectedBoat.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedBoat.images.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImageIndex ? "bg-white w-4" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-800">
                  {selectedBoat.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedBoat.size}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4 mt-5 mb-6">
                <div className="flex flex-col items-center gap-2 bg-muted/50 rounded-xl p-3">
                  <Gauge size={20} className="text-primary" />
                  <span className="text-xs text-muted-foreground text-center">{selectedBoat.engine.split(" ").slice(1, 3).join(" ")}</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-muted/50 rounded-xl p-3">
                  <Users size={20} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{selectedBoat.capacity} {t("boat_people")}</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-muted/50 rounded-xl p-3">
                  <Anchor size={20} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{selectedBoat.size}</span>
                </div>
              </div>

              <div className="flex gap-3 mb-5">
                <div className="flex-1 border border-border rounded-xl p-4 text-center">
                  <span className="text-sm text-muted-foreground block mb-1">{t("boat_half_day")}</span>
                  <span className="font-display text-2xl font-800 text-foreground">{selectedBoat.price4h.includes('€') ? selectedBoat.price4h : `${selectedBoat.price4h}€`}</span>
                </div>
                <div className="flex-1 border border-border rounded-xl p-4 text-center">
                  <span className="text-sm text-muted-foreground block mb-1">{t("boat_full_day")}</span>
                  <span className="font-display text-2xl font-800 text-foreground">{selectedBoat.price8h.includes('€') ? selectedBoat.price8h : `${selectedBoat.price8h}€`}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {(selectedBoat.features && selectedBoat.features.length > 0 ? selectedBoat.features : [t("boat_inc_fuel"), t("boat_inc_lifejacket"), t("boat_inc_briefing"), t("boat_inc_insurance")]).map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground/70 group">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-turquoise/40 shrink-0 group-hover:bg-turquoise transition-colors" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(`/reservar?pack=${selectedBoat.slug}${referralCode ? `&ref=${referralCode}` : ""}`)}
                className="w-full py-3 rounded-xl font-display font-600 text-sm ocean-gradient text-primary-foreground shadow-ocean transition-all hover:scale-[1.02]"
              >
                {t("exp_book")}
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default BoatCatalog;
