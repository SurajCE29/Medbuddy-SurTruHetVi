import React from 'react';
import { motion } from 'motion/react';

export const Background3D: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Mesh Gradients */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#DBEAFE] to-transparent blur-[100px] opacity-40" />
      </div>

      {/* Floating Blobs */}
      <motion.div
        animate={{
          y: [0, -40, 0],
          x: [0, 20, 0],
          rotate: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-gradient-to-tr from-[#3B82F6]/10 to-transparent border border-white/20 backdrop-blur-3xl"
      />

      <motion.div
        animate={{
          y: [0, 50, 0],
          x: [0, -30, 0],
          rotate: [0, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full bg-gradient-to-bl from-[#BFDBFE]/10 to-transparent border border-white/20 backdrop-blur-3xl"
      />

      {/* Particle System (Simplified) */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: [null, '-=100', '+=100'],
              opacity: [null, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-brand-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Floating Medical Icons (Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] select-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] right-[30%]"
        >
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [360, 0] }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[30%] left-[25%]"
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </motion.div>
      </div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
