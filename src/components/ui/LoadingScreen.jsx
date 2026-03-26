import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <motion.div
      key="loader"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900"
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animation de la sphère (boule de loto abstraite) */}
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          className="absolute w-20 h-20  bg-blue-500rounded-full blur-xl opacity-20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="text-center z-10">
        <h2 className="text-2xl font-bold text-white mb-1">LOTO 3D</h2>
        <p className="text-slate-400 text-sm animate-pulse">Préparation du tirage...</p>
      </div>
      
      <p className="absolute bottom-8 text-slate-600 text-xs">
        &copy; 2026 Loto Experience
      </p>
    </motion.div>
  );
}