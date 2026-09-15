import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rowToReport, type OnionReport } from "@/lib/report-shape";

export const analyzeOnionImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        imageDataUrl: z.string().min(32),
        lotId: z.string().max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<OnionReport> => {
    const { detectOnionType } = await import("@/lib/variety-detect.server");
    const { onionType } = await detectOnionType(data.imageDataUrl);

    let analysis;
    if (onionType === "small") {
      const { gradeSmallOnionPhoto } = await import("@/lib/small-onion.server");
      analysis = await gradeSmallOnionPhoto(data.imageDataUrl);
    } else {
      const { gradeOnionPhoto } = await import("@/lib/onion.server");
      analysis = await gradeOnionPhoto(data.imageDataUrl);
    }

    const { data: profile } = await context.supabase
      .from("farmer_profiles")
      .select(
        "full_name, phone, village, district, state, onion_variety, harvest_date, storage_type",
      )
      .eq("user_id", context.userId)
      .maybeSingle();

    const snapshot = {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      village: profile?.village ?? "",
      district: profile?.district ?? "",
      state: profile?.state ?? "",
      onionVariety: profile?.onion_variety ?? "",
      harvestDate: profile?.harvest_date ?? null,
      storageType: profile?.storage_type ?? "",
    };

    const { data: row, error } = await context.supabase
      .from("onion_reports")
      .insert({
        user_id: context.userId,
        lot_id: data.lotId?.trim() || `LOT-${Date.now().toString(36).toUpperCase()}`,
        total_onions: analysis.totalOnions,
        grade_a_percent: analysis.gradeAPercent,
        urs_percent: analysis.ursPercent,
        reject_percent: analysis.rejectPercent,
        avg_diameter_mm: analysis.avgDiameterMm,
        confidence: analysis.confidence,
        defects: analysis.defects,
        summary: analysis.summary,
        recommendation: analysis.recommendation,
        farmer_snapshot: snapshot,
      })
      .select("*")
      .single();

    if (error || !row) throw new Error(error?.message ?? "Could not save the report.");
    return rowToReport(row);
  });
