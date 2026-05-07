import { motion } from "motion/react";

interface AudioVisualizerProps {
  active: boolean;
}

export function AudioVisualizer({ active }: AudioVisualizerProps) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer rings */}
      <motion.div
        animate={{
          scale: active ? [1, 1.1, 1] : 1,
          opacity: active ? [0.1, 0.3, 0.1] : 0.1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-full h-full border border-white rounded-full bg-white/5"
      />
      <motion.div
        animate={{
          scale: active ? [1, 1.2, 1] : 1,
          opacity: active ? [0.05, 0.2, 0.05] : 0.05,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[120%] h-[120%] border border-white/20 rounded-full"
      />

      {/* Core */}
      <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-slate-900 border-2 border-slate-700 shadow-2xl">
        <div className="flex items-end justify-center gap-1.5 h-12">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: active ? [12, Math.random() * 40 + 12, 12] : 12,
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-2 rounded-full bg-indigo-400"
            />
          ))}
        </div>
      </div>
      
      {/* Pulse effect */}
      {active && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="absolute w-32 h-32 rounded-full bg-indigo-500/20 pointer-events-none"
        />
      )}
    </div>
  );
}
