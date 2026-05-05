import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Video */}
      <motion.div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-[120%] object-cover">
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center p-8 max-w-lg mx-auto bg-black/40 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-coral/20 flex items-center justify-center">
          <Lock className="w-10 h-10 text-coral" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Em Manutenção
        </h1>
        <p className="text-white/80 text-lg mb-8 font-medium">
          Estamos a trabalhar para melhorar a sua experiência. O site voltará a estar disponível em breve!
        </p>
        
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-coral animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-coral animate-pulse delay-150" />
        </div>
      </motion.div>
    </div>
  );
};

export default Maintenance;
