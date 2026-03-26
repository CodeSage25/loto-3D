export function EmptySlot({ type }) {
  const border = {
    gagnante: "border-blue-700/40",
    bonus: "border-purple-600/40",
    finale: "border-yellow-500/40",
  }[type];

  const label = {
    gagnante: "🔵",
    bonus: "🟣",
    finale: "⭐",
  }[type];

  return (
    <div
      className={`w-9 h-9 md:w-11 md:h-11 border-2 border-dashed ${border} rounded-full flex items-center justify-center`}
    >
      <span className="text-[8px] opacity-30">{label}</span>
    </div>
  );
}