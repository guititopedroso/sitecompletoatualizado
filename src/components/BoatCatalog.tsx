import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Anchor, Gauge, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";



type Boat = {
  name: string;
  size: string;
  engine: string;
  capacity: number;
  price4h: string;
  price8h: string;
  image: string;
  slug: string;
  range: "low" | "mid" | "high";
};

const BoatCatalog = ({ referralCode }: { referralCode?: string }) => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [activeRange, setActiveRange] = useState<"all" | "low" | "mid" | "high">("all");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchBoats = async () => {
    setLoading(true);
    try {
      const boatsRef = collection(db, "boats");
      const q = query(boatsRef, orderBy("created_at", "asc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Boat[];
      setBoats(data);
    } catch (error) {
      console.error("Error fetching boats:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBoats();
  }, []);

  const filteredBoats = activeRange === "all" 
    ? boats 
    : boats.filter(b => b.range === activeRange);

  const ranges = [
    { id: "all", label: t("boat_range_all") },
    { id: "low", label: t("boat_range_low") },
    { id: "mid", label: t("boat_range_mid") },
    { id: "high", label: t("boat_range_high") },
  ];

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {ranges.map((range) => (
          <motion.button
            key={range.id}
            onClick={() => setActiveRange(range.id as any)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeRange === range.id
                ? "bg-coral text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {range.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : filteredBoats.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>{t("no_boats_found") || "Nenhum barco encontrado nesta categoria."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoats.map((boat, i) => (
          <motion.div
            key={boat.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            onClick={() => setSelectedBoat(boat)}
            className="group cursor-pointer bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={boat.image}
                alt={boat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                <Users size={14} className="text-primary" />
                <span className="text-xs font-bold text-foreground">{boat.capacity}</span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-display font-700 text-lg text-foreground mb-1">{boat.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{boat.size} · {boat.engine.split(" ").slice(1).join(" ")}</p>

              <div className="flex gap-3">
                <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                  <span className="text-xs text-muted-foreground block mb-1">4h</span>
                  <span className="font-display font-800 text-foreground">{boat.price4h}</span>
                </div>
                <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                  <span className="text-xs text-muted-foreground block mb-1">8h</span>
                  <span className="font-display font-800 text-foreground">{boat.price8h}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}

      <Dialog open={!!selectedBoat} onOpenChange={(open) => !open && setSelectedBoat(null)}>
        {selectedBoat && (
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
            <div className="relative h-56">
              <img
                src={selectedBoat.image}
                alt={selectedBoat.name}
                className="w-full h-full object-cover"
              />
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
                  <span className="font-display text-2xl font-800 text-foreground">{selectedBoat.price4h}</span>
                </div>
                <div className="flex-1 border border-border rounded-xl p-4 text-center">
                  <span className="text-sm text-muted-foreground block mb-1">{t("boat_full_day")}</span>
                  <span className="font-display text-2xl font-800 text-foreground">{selectedBoat.price8h}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {[t("boat_inc_fuel"), t("boat_inc_lifejacket"), t("boat_inc_briefing"), t("boat_inc_insurance")].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-turquoise">✓</span>
                    {item}
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
