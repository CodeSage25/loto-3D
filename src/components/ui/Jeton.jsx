import { motion } from "framer-motion";
import { getBallDisplayColor } from "../../utils/getBallDisplayColor";

export function Jeton({ number, type, delay = 0 }) {
  const colorType = getBallDisplayColor(number);

  const styles = {
    blue: { bg: "bg-blue-600", ring: "ring-blue-400/60" },
    red: { bg: "bg-red-600", ring: "ring-red-400/60" },
    green: { bg: "bg-emerald-600", ring: "ring-emerald-400/60" },
  }[colorType];

  const typeIcon = {
    gagnante: "🔵",
    bonus: "🟣",
    finale: "⭐",
  }[type];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay * 0.08,
      }}
      className={`relative w-9 h-9 md:w-11 md:h-11 ${styles.bg} text-white 
                  rounded-full font-bold flex items-center justify-center 
                  text-sm md:text-base shadow-lg ring-2 ${styles.ring}`}
    >
      <motion.span
        animate={{ scale: [1, 1.35, 1] }}
        transition={{ duration: 0.35, delay: delay * 0.08 + 0.12 }}
      >
        {number}
      </motion.span>

      {/* Badge du type en haut à droite */}
      <span className="absolute -top-1 -right-1 text-[10px] drop-shadow">
        {typeIcon}
      </span>
    </motion.div>
  );
}