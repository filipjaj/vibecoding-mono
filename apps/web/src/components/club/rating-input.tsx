const ratingConfig = [
  { value: 1, emoji: "😴", label: "Kjedelig" },
  { value: 2, emoji: "😐", label: "Ok" },
  { value: 3, emoji: "🙂", label: "Bra" },
  { value: 4, emoji: "🤩", label: "Elsket" },
  { value: 5, emoji: "🏆", label: "Mesterverk" },
];

export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {ratingConfig.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-sm transition-all ${
            value === r.value
              ? "bg-primary/10 ring-2 ring-primary/30 scale-110"
              : "hover:bg-muted"
          }`}
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="text-xs text-muted-foreground">{r.label}</span>
        </button>
      ))}
    </div>
  );
}
