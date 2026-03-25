import { motion } from "framer-motion";

export function Jeton({ number, type, delay = 0 }) {
  const bg = {
    gagnante: "bg-blue-700",
    bonus: "bg-purple-600",
    finale: "bg-yellow-500",
  }[type];
  const text = type === "finale" ? "text-black" : "text-white";

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
      className={`w-9 h-9 md:w-11 md:h-11 ${bg} ${text} rounded-full font-bold flex items-center justify-center text-sm md:text-base shadow-lg`}
    >
      <motion.span
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 0.3, delay: delay * 0.08 + 0.15 }}
      >
        {number}
      </motion.span>
    </motion.div>
  );
}
