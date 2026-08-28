import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FarmerProfile = {
  fullName: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  farmSizeAcres: number | null;
  onionVariety: string;
  harvestDate: string | null;
  storageType: string;
};

const ProfileInput = z.object({
  fullName: z.string().trim().max(80),
  phone: z.string().trim().max(20),
  village: z.string().trim().max(80),
  district: z.string().trim().max(80),
  state: z.string().trim().max(80),
  farmSizeAcres: z.number().min(0).max(100000).nullable(),
  onionVariety: z.string().trim().max(80),
  harvestDate: z.string().trim().max(20).nullable(),
  storageType: z.string().trim().max(80),
});

export const emptyProfile: FarmerProfile = {
  fullName: "",
  phone: "",
  village: "",
  district: "",
  state: "",
  farmSizeAcres: null,
  onionVariety: "",
  harvestDate: null,
  storageType: "",
};

export const getFarmerProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FarmerProfile> => {
    const { data } = await context.supabase
      .from("farmer_profiles")
      .select(
        "full_name, phone, village, district, state, farm_size_acres, onion_variety, harvest_date, storage_type",
      )
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data) return emptyProfile;
    return {
      fullName: data.full_name ?? "",
      phone: data.phone ?? "",
      village: data.village ?? "",
      district: data.district ?? "",
      state: data.state ?? "",
      farmSizeAcres: data.farm_size_acres === null ? null : Number(data.farm_size_acres),
      onionVariety: data.onion_variety ?? "",
      harvestDate: data.harvest_date ?? null,
      storageType: data.storage_type ?? "",
    };
  });

export const saveFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("farmer_profiles").upsert(
      {
        user_id: context.userId,
        full_name: data.fullName,
        phone: data.phone,
        village: data.village,
        district: data.district,
        state: data.state,
        farm_size_acres: data.farmSizeAcres,
        onion_variety: data.onionVariety,
        harvest_date: data.harvestDate || null,
        storage_type: data.storageType,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
