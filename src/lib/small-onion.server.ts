import { visionJson } from "@/lib/ai-vision.server";
import {
  LOW_CONFIDENCE_MESSAGE,
  LOW_CONFIDENCE_THRESHOLD,
  SMALL_ONION_CLASSES,
  conditionLabel,
} from "@/lib/onion-variety";
import type { AnalysisResult } from "@/lib/onion.server";

/**
 * China Vengayam (small onion / shallot) grading module.
 *
 * Kept separate from the big-onion grader so a dedicated small-onion model
 * (e.g. a Roboflow endpoint) can replace `gradeSmallOnionPhoto` without
 * touching any other part of the app.
 */

const SYSTEM_PROMPT = `You are an agricultural produce inspector specialising in China Vengayam (small onion / shallot, Allium cepa var. aggregatum) post-harvest grading for Indian mandi procurement.

Classify every visible small onion into exactly one of these classes:
- Healthy_Small_Onion: firm, dry papery skin, intact neck, no rot/sprout/roots, diameter >= 20 mm.
- Damaged_Small_Onion: bruised, split, peeled, cut or insect-bitten but not rotten.
- Rotten_Small_Onion: soft, black/grey mould, water-soaked or decayed.
- Sprouted_Small_Onion: green shoot emerging from the neck.
- Rooted_Small_Onion: white root hairs regrown from the base.
- Undersized_Small_Onion: sound but diameter < 20 mm.

Grading logic (same standard as the big-onion grader):
- Grade A % = share of Healthy_Small_Onion.
- URS % = share of Undersized_Small_Onion plus Damaged_Small_Onion with only minor blemish.
- Reject % = share of Rotten_Small_Onion, Sprouted_Small_Onion, Rooted_Small_Onion and heavily damaged.

Return ONLY minified JSON, no markdown fence, exact shape:
{"totalOnions":int,"gradeAPercent":number,"ursPercent":number,"rejectPercent":number,"avgDiameterMm":number,"confidence":number,"dominantClass":string,"conditionConfidence":number,"qualityStatus":string,"classCounts":[{"class":string,"count":int,"percentage":number,"note":string}],"summary":string,"recommendation":string}

Rules: the three percentages must sum to 100 (one decimal max). dominantClass is the single most representative class of the lot, using the exact class names above. conditionConfidence is 0-1 for that class. confidence is 0-1 overall. qualityStatus <= 140 characters explaining the detected condition in plain words. summary <= 220 characters. recommendation <= 180 characters and actionable (storage, re-sorting, pricing). classCounts must list only classes actually present. If you cannot see small onions clearly, set totalOnions 0, all percentages 0, confidence and conditionConfidence low, and say so in summary.`;

function clampPercents(a: number, u: number, r: number): [number, number, number] {
  const vals = [a, u, r].map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const sum = vals[0]! + vals[1]! + vals[2]!;
  if (sum <= 0) return [0, 0, 0];
  const scale = (v: number) => Math.round((v / sum) * 1000) / 10;
  return [scale(vals[0]!), scale(vals[1]!), scale(vals[2]!)];
}

function normaliseClass(raw: string): string {
  const match = SMALL_ONION_CLASSES.find(
    (c) => c.toLowerCase() === raw.trim().toLowerCase().replace(/\s+/g, "_"),
  );
  return match ?? raw.trim();
}

export async function gradeSmallOnionPhoto(imageDataUrl: string): Promise<AnalysisResult> {
  const parsed = await visionJson({
    system: SYSTEM_PROMPT,
    prompt: "Grade this China Vengayam (small onion) lot and return the JSON report.",
    imageDataUrl,
  });

  const [gradeAPercent, ursPercent, rejectPercent] = clampPercents(
    Number(parsed["gradeAPercent"]),
    Number(parsed["ursPercent"]),
    Number(parsed["rejectPercent"]),
  );

  const defects = Array.isArray(parsed["classCounts"])
    ? (parsed["classCounts"] as Array<Record<string, unknown>>)
        .map((d) => {
          const cls = normaliseClass(String(d["class"] ?? d["category"] ?? "Other"));
          return {
            category: `${conditionLabel(cls)} (small onion)`,
            count: Math.max(0, Math.round(Number(d["count"]) || 0)),
            percentage: Math.max(0, Math.round((Number(d["percentage"]) || 0) * 10) / 10),
            note: String(d["note"] ?? ""),
          };
        })
        .slice(0, 8)
    : [];

  const confidence = Math.min(1, Math.max(0, Number(parsed["confidence"]) || 0));
  const conditionConfidence = Math.min(
    1,
    Math.max(0, Number(parsed["conditionConfidence"]) || confidence),
  );
  const dominantClass = normaliseClass(String(parsed["dominantClass"] ?? ""));
  const lowConfidence = conditionConfidence < LOW_CONFIDENCE_THRESHOLD || !dominantClass;

  return {
    onionType: "small",
    condition: lowConfidence ? "" : conditionLabel(dominantClass),
    conditionConfidence,
    qualityStatus: lowConfidence
      ? LOW_CONFIDENCE_MESSAGE
      : String(parsed["qualityStatus"] ?? "").slice(0, 220),
    totalOnions: Math.max(0, Math.round(Number(parsed["totalOnions"]) || 0)),
    gradeAPercent,
    ursPercent,
    rejectPercent,
    avgDiameterMm: Math.max(0, Math.round(Number(parsed["avgDiameterMm"]) || 0)),
    confidence,
    defects,
    summary: String(parsed["summary"] ?? "").slice(0, 400),
    recommendation: String(parsed["recommendation"] ?? "").slice(0, 300),
  };
}
