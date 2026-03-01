export type Phase = "selection" | "active" | "event" | "review" | "completed";

export const phaseConfig: Record<Phase, { label: string; bg: string; text: string }> = {
  selection: { label: "Velg neste", bg: "bg-blue-100", text: "text-blue-700" },
  active: { label: "Pågår", bg: "bg-green-100", text: "text-green-700" },
  event: { label: "Arrangement", bg: "bg-amber-100", text: "text-amber-700" },
  review: { label: "Vurdering", bg: "bg-purple-100", text: "text-purple-700" },
  completed: { label: "Fullført", bg: "bg-gray-100", text: "text-gray-500" },
};
