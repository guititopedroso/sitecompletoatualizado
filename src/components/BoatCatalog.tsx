import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Anchor, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import boatKeltAzura from "@/assets/boat-kelt-azura.webp";
import boatCapCamarat from "@/assets/boat-cap-camarat.jpg";
import boatSanRemo from "@/assets/boat-san-remo.jpg";
import boatSaver from "@/assets/boat-saver.jpg";
import boatSelva from "@/assets/boat-selva.jpg";
import boatBayliner from "@/assets/boat-bayliner.jpg";
import boatNireus from "@/assets/boat-nireus.jpg";
import boatSacs from "@/assets/boat-sacs.jpg";
import boatBwa from "@/assets/boat-bwa.webp";
import boatSilverMarine from "@/assets/boat-silver-marine.jpg";

type Boat = {
  name: string;
  size: string;
  engine: string;
  capacity: number;
  price4h: string;
  price8h: string;
  image: string;
  slug: string;
};

const boats: Boat[] = [
  { name: "Kelt Azura", size: "5 mts", engine: "Motor Yamaha 50hp four stroke", capacity: 5, price4h: "190€", price8h: "230€", image: boatKeltAzura, slug: "kelt-azura" },
  { name: "Cap Camarat", size: "5,15 mts", engine: "Motor Honda 75hp four stroke", capacity: 6, price4h: "200€", price8h: "285€", image: boatCapCamarat, slug: "cap-camarat" },
  { name: "San Remo", size: "5,65 mts", engine: "Motor Yamaha 80hp four stroke", capacity: 6, price4h: "200€", price8h: "285€", image: boatSanRemo, slug: "san-remo" },
  { name: "Saver", size: "5,80 mts", engine: "Motor Yamaha 100hp four stroke", capacity: 6, price4h: "210€", price8h: "300€", image: boatSaver, slug: "saver" },
  { name: "Selva", size: "5,80 mts", engine: "Motor Selva 100hp four stroke", capacity: 7, price4h: "220€", price8h: "310€", image: boatSelva, slug: "selva" },
  { name: "Bayliner", size: "5,70 mts", engine: "Motor Honda 115hp four stroke", capacity: 7, price4h: "220€", price8h: "310€", image: boatBayliner, slug: "bayliner" },
  { name: "Nireus", size: "5,70 mts", engine: "Motor Yamaha 90hp VMAX four stroke", capacity: 8, price4h: "230€", price8h: "320€", image: boatNireus, slug: "nireus" },
  { name: "Sacs", size: "6 mts", engine: "Motor Honda 150hp four stroke", capacity: 10, price4h: "250€", price8h: "330€", image: boatSacs, slug: "sacs" },
  { name: "BWA", size: "6,50 mts", engine: "Motor Suzuki 150hp four stroke", capacity: 12, price4h: "285€", price8h: "360€", image: boatBwa, slug: "bwa" },
  { name: "Silver Marine", size: "6,60 mts", engine: "Motor Yamaha 175hp four stroke", capacity: 14, price4h: "330€", price8h: "410€", image: boatSilverMarine, slug: "silver-marine" },
];

const BoatCatalog = ({ referralCode }: { referralCode?: string }) => {
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boats.map((boat, i) => (
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
