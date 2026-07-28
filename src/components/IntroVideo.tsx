import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroVideoProps {
  onComplete: () => void;
}

const IntroVideo = ({ onComplete }: IntroVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoURL = "https://res.cloudinary.com/dw86u43e6/video/upload/v1/Timeline_1_m0bngd";

  const handleStartVideo = () => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer"
      onClick={handleStartVideo}
    >
      <video
        ref={videoRef}
        src={videoURL}
        className="w-full h-full object-cover"
        onEnded={onComplete}
        playsInline
        preload="auto"
        muted
      />
    </motion.div>
  );
};

export default IntroVideo;
