export type Phase = "selection" | "active" | "event" | "review" | "completed";

type RoundForPhase = {
  mediaItemId: string | null;
  completedAt: Date | null;
  phaseOverride: Phase | null;
};

type EventForPhase = {
  startsAt: Date;
  endsAt: Date | null;
} | null;

export function derivePhase(round: RoundForPhase, event: EventForPhase): Phase {
  if (round.phaseOverride) return round.phaseOverride;
  if (round.completedAt) return "completed";
  if (!round.mediaItemId) return "selection";
  if (!event) return "active";
  const now = new Date();
  if (now < event.startsAt) return "active";
  if (!event.endsAt || now < event.endsAt) return "event";
  return "review";
}

export const phaseLabels: Record<Phase, string> = {
  selection: "Velg neste",
  active: "Pågår",
  event: "Arrangement",
  review: "Vurdering",
  completed: "Fullført",
};
