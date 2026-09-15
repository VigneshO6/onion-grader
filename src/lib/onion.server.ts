import { visionJson } from "@/lib/ai-vision.server";
import {
  LOW_CONFIDENCE_MESSAGE,
  LOW_CONFIDENCE_THRESHOLD,
  type OnionType,
} from "@/lib/onion-variety";
import type { OnionDefect } from "@/lib/report-shape";

const SYSTEM_PROMPT = `You are an agricultural produce inspector specialising in onion (Allium cepa) post-harvest grading for Indian mandi and NAFED procurement standards.

Grade definitions:
- Grade A: firm, dry outer skin, no rot/mould, no sprouting, no mechanical damage, diameter >= 45 mm, uniform colour.
- URS (Under Reference Standard): marketable but off-spec — undersized (30-45 mm), minor skin peeling, slight discolouration, mild neck damage.
- Reject: rotten, black mould, water-soaked, heavily sprouted, split, insect damaged, diameter < 30 mm.

Inspect the photograph. Count visible onions, classify each, estimate diameters from relative scale.

Return ONLY minified JSON, no markdown fence, with this exact shape:
{"totalOnions":int,"gradeAPercent":number,"ursPercent":number,"rejectPercent":number,"avgDiameterMm":number,"confidence":number,"defects":[{"category":string,"count":int,"percentage":number,"note":string}],"summary":string,"recommendation":string}

Rules: the three percentages must sum to 100 (one decimal max). defects must cover these categories when present: "Rotten / Mould", "Sprouted", "Mechanical damage", "Undersized", "Skin peeling / discolouration". confidence is 0-1. summary <= 220 characters. recommendation <= 180 characters, actionable (storage, re-sorting, pricing). If the image contains no onions, return totalOnions 0, all percentages 0, and say so in summary.`;

export type AnalysisResult = {
  onionType: OnionType;
  /** Dominant condition, only used for small onions ("Healthy", "Rotten", …). */
  condition: string;
  conditionConfidence: number;
  qualityStatus: string;
  totalOnions: number;
  gradeAPercent: number;
  ursPercent: number;
  rejectPercent: number;
  avgDiameterMm: number;
  confidence: number;
  defects: OnionDefect[];
  summary: string;
  recommendation: string;
};

function clampPercents(a: number, u: number, r: number): [number, number, number] {
  const vals: [number, number, number] = [a, u, r].map((v) =>
    Number.isFinite(v) && v > 0 ? v : 0,
  ) as [number, number, number];
  const sum = vals[0] + vals[1] + vals[2];
  if (sum <= 0) return [0, 0, 0];
  const scale = (v: number) => Math.round((v / sum) * 1000) / 10;
  return [scale(vals[0]), scale(vals[1]), scale(vals[2])];
}

export async function gradeOnionPhoto(imageDataUrl: string): Promise<AnalysisResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Grade this onion lot and return the JSON report." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Too many scans right now — please retry in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted for this workspace. Add credits to keep scanning.");
    if (res.status === 403) throw new Error("AI access is blocked by workspace policy.");
    throw new Error(`Quality analysis failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const jsonText = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Could not read the analysis result. Try a clearer, well-lit photo.");
  }

  const [gradeAPercent, ursPercent, rejectPercent] = clampPercents(
    Number(parsed["gradeAPercent"]),
    Number(parsed["ursPercent"]),
    Number(parsed["rejectPercent"]),
  );

  const defects: OnionDefect[] = Array.isArray(parsed["defects"])
    ? (parsed["defects"] as Array<Record<string, unknown>>)
        .map((d) => ({
          category: String(d["category"] ?? "Other"),
          count: Math.max(0, Math.round(Number(d["count"]) || 0)),
          percentage: Math.max(0, Math.round((Number(d["percentage"]) || 0) * 10) / 10),
          note: String(d["note"] ?? ""),
        }))
        .slice(0, 8)
    : [];

  const confidence = Math.min(1, Math.max(0, Number(parsed["confidence"]) || 0));

  return {
    onionType: "big",
    condition: "",
    conditionConfidence: confidence,
    qualityStatus:
      confidence < LOW_CONFIDENCE_THRESHOLD
        ? LOW_CONFIDENCE_MESSAGE
        : "Big onion lot graded against Grade A / URS / Reject standards.",
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
