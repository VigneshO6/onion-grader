/** Shared, client-safe vocabulary for the two supported onion varieties. */

export type OnionType = "big" | "small" | "unknown";

export const SMALL_ONION_CLASSES = [
  "Healthy_Small_Onion",
  "Damaged_Small_Onion",
  "Rotten_Small_Onion",
  "Sprouted_Small_Onion",
  "Rooted_Small_Onion",
  "Undersized_Small_Onion",
] as const;

export type SmallOnionClass = (typeof SMALL_ONION_CLASSES)[number];

export const SMALL_ONION_CONDITION_LABEL: Record<string, string> = {
  Healthy_Small_Onion: "Healthy",
  Damaged_Small_Onion: "Damaged",
  Rotten_Small_Onion: "Rotten",
  Sprouted_Small_Onion: "Sprouted",
  Rooted_Small_Onion: "Rooted",
  Undersized_Small_Onion: "Undersized",
};

export function onionTypeLabel(type: OnionType): string {
  if (type === "small") return "China Vengayam (Small Onion)";
  if (type === "big") return "Big Onion";
  return "Unrecognised onion type";
}

/** Human-readable condition name for a raw model class or already-clean label. */
export function conditionLabel(raw: string): string {
  if (!raw) return "";
  return SMALL_ONION_CONDITION_LABEL[raw] ?? raw.replace(/_/g, " ");
}

/** Confidence below this is treated as an unreliable classification. */
export const LOW_CONFIDENCE_THRESHOLD = 0.55;

export const LOW_CONFIDENCE_MESSAGE =
  "The photo could not be classified confidently. Retake it in even daylight, with the onions spread out on a plain surface and the whole lot in frame.";
