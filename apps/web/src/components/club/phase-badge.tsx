import { type Phase, phaseConfig } from "@/lib/phases";

export function PhaseBadge({ phase }: { phase: Phase }) {
  const config = phaseConfig[phase];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
