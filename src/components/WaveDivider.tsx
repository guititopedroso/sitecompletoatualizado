const WaveDivider = ({ bgColor }: { bgColor: string }) => {
  return (
    <div className="w-full overflow-hidden leading-[0]">
      <svg
        viewBox="0 0 1440 120"
        className="w-full h-20 md:h-28"
        preserveAspectRatio="none"
      >
        <path
          className="animate-wave-slow"
          d="M0,40 C240,100 480,0 720,50 C960,100 1200,10 1440,40 L1440,120 L0,120 Z"
          fill={bgColor}
          opacity="0.5"
        />
        <path
          className="animate-wave-mid"
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z"
          fill={bgColor}
          opacity="0.7"
        />
        <path
          className="animate-wave-front"
          d="M0,80 C180,50 360,100 540,70 C720,40 900,90 1080,70 C1260,50 1380,80 1440,75 L1440,120 L0,120 Z"
          fill={bgColor}
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
