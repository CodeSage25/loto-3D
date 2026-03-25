import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <motion.div
      key="loader"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center">
        <p className="text-4xl mb-4 animate-bounce">⏳</p>
        <p className="text-white text-lg">Chargement...</p>
        <p className="text-gray-500 text-xs mt-2">
          Initialisation du moteur physique WASM
        </p>
      </div>
    </motion.div>
  );
}
