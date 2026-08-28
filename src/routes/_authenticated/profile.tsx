import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  emptyProfile,
  getFarmerProfile,
  saveFarmerProfile,
  type FarmerProfile,
} from "@/lib/farmer.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Farmer profile — OnionGrade AI" },
      {
        name: "description",
        content:
          "Save your farm details — village, district, onion variety, farm size, harvest date and storage type — so every quality report is stamped with them.",
      },
      { property: "og:title", content: "Farmer profile — OnionGrade AI" },
      {
        property: "og:description",
        content: "Your farm template auto-fills every onion lot quality report.",
      },
    ],
  }),
  component: ProfileScreen,
});

const fields: { key: keyof FarmerProfile; label: string; placeholder: string; type?: string }[] = [
  { key: "fullName", label: "Full name", placeholder: "Ramesh Patil" },
  { key: "phone", label: "Phone", placeholder: "+91 98xxxxxx01", type: "tel" },
  { key: "village", label: "Village", placeholder: "Pimpalgaon" },
  { key: "district", label: "District", placeholder: "Nashik" },
  { key: "state", label: "State", placeholder: "Maharashtra" },
  { key: "onionVariety", label: "Onion variety", placeholder: "Nashik Red / Bhima Shakti" },
  { key: "storageType", label: "Storage type", placeholder: "Ventilated chawl / cold store" },
];

function ProfileScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getFarmerProfile);
  const save = useServerFn(saveFarmerProfile);
  const [form, setForm] = useState<FarmerProfile>(emptyProfile);

  const { data, isPending } = useQuery({
    queryKey: ["farmer-profile"],
    queryFn: () => fetchProfile({}),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => save({ data: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer-profile"] });
      toast.success("Farm template saved");
    },
    onError: (error: Error) => toast.error(error.message || "Could not save"),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <ScreenHeader title="Farmer template" subtitle="Auto-filled into every report" />

      <section className="px-5">
        <form
          className="surface space-y-4 rounded-3xl p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          {isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : null}

          {fields.map((f) => (
            <div key={f.key}>
              <Label
                htmlFor={f.key}
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {f.label}
              </Label>
              <Input
                id={f.key}
                type={f.type ?? "text"}
                value={(form[f.key] as string) ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="mt-1.5 h-12 rounded-2xl"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="farmSize"
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Farm size (acres)
              </Label>
              <Input
                id="farmSize"
                type="number"
                min="0"
                step="0.1"
                value={form.farmSizeAcres ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    farmSizeAcres: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="mt-1.5 h-12 rounded-2xl"
              />
            </div>
            <div>
              <Label
                htmlFor="harvest"
                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Harvest date
              </Label>
              <Input
                id="harvest"
                type="date"
                value={form.harvestDate ?? ""}
                onChange={(e) => setForm({ ...form, harvestDate: e.target.value || null })}
                className="mt-1.5 h-12 rounded-2xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="btn-lime h-12 w-full rounded-2xl font-semibold"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save template
          </Button>
        </form>

        <Button
          variant="secondary"
          onClick={signOut}
          className="mt-4 h-12 w-full rounded-2xl font-semibold"
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </section>
    </AppShell>
  );
}
