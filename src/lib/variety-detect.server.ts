import { visionJson } from "@/lib/ai-vision.server";
import { LOW_CONFIDENCE_THRESHOLD, type OnionType } from "@/lib/onion-variety";

/**
 * Decides which grading module should handle a photo.
 * Kept standalone so a dedicated classifier endpoint can replace it later.
 */

const SYSTEM_PROMPT = `You classify a photograph of harvested onions into one of two Indian market varieties.

- "big": common large bulb onion (Allium cepa), typically 40-90 mm across, one bulb per plant.
- "small": China Vengayam / small onion / shallot (Allium cepa var. aggregatum), typically 10-30 mm across, grows in clusters, deeper red-purple, often many bulbs heaped together.
- "unknown": the image does not clearly show onions.

Return ONLY minified JSON: {"onionType":"big"|"small"|"unknown","confidence":number}
confidence is 0-1 for your choice. Judge by bulb size relative to each other and the scene, clustering, and shape.`;

export async function detectOnionType(imageDataUrl: string): Promise<{
  onionType: OnionType;
  confidence: number;
}> {
  const parsed = await visionJson({
    system: SYSTEM_PROMPT,
    prompt: "Which onion variety is in this photo?",
    imageDataUrl,
  });

  const raw = String(parsed["onionType"] ?? "").toLowerCase();
  const confidence = Math.min(1, Math.max(0, Number(parsed["confidence"]) || 0));
  const onionType: OnionType =
    raw === "small" ? "small" : raw === "big" ? "big" : "unknown";

  // A weak "small" call falls back to the proven big-onion grader.
  if (onionType === "small" && confidence < LOW_CONFIDENCE_THRESHOLD) {
    return { onionType: "big", confidence };
  }
  return { onionType, confidence };
}
