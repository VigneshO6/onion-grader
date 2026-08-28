import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Loader2, ScanLine, Upload, RotateCcw, Printer, Download } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ReportView } from "@/components/report-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeOnionImage } from "@/lib/onion.functions";
import { getFarmerProfile } from "@/lib/farmer.functions";
import { fileToCompressedDataUrl } from "@/lib/image";
import type { OnionReport } from "@/lib/report-shape";
import heroImage from "@/assets/onion-hero.jpg";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "OnionGrade AI — Instant onion quality grading" },
      {
        name: "description",
        content:
          "Scan an onion lot with your phone camera and get Grade A vs URS percentages, defect breakdown and a shareable digital quality report in seconds.",
      },
      { property: "og:title", content: "OnionGrade AI — Instant onion quality grading" },
      {
        property: "og:description",
        content:
          "AI image analysis that spots rotten, sprouted, damaged and undersized onions and grades any lot without human bias.",
      },
    ],
  }),
  component: ScanScreen,
});

function ScanScreen() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeOnionImage);
  const fetchProfile = useServerFn(getFarmerProfile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lotId, setLotId] = useState("");
  const [report, setReport] = useState<OnionReport | null>(null);

  const profile = useQuery({ queryKey: ["farmer-profile"], queryFn: () => fetchProfile({}) });

  const mutation = useMutation({
    mutationFn: async (imageDataUrl: string) =>
      analyze({ data: { imageDataUrl, lotId: lotId || undefined } }),
    onSuccess: (result) => {
      setReport(result);
      toast.success("Quality report ready");
    },
    onError: (error: Error) => toast.error(error.message || "Analysis failed"),
  });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a photo of the onion lot");
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPreview(dataUrl);
      setReport(null);
      mutation.mutate(dataUrl);
    } catch {
      toast.error("Could not read that image");
    }
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.lotId}-quality-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const name = profile.data?.fullName?.trim();

  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-b-[2rem]">
        <img
          src={heroImage}
          alt="Freshly harvested red onions spread on a jute sack"
          className="h-44 w-full object-cover"
        />
        <div className="bg-gradient-ink absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Bias-free digital grading
          </p>
          <h1 className="mt-1 truncate font-display text-2xl font-bold text-foreground">
            {name ? `Namaste, ${name}` : "OnionGrade AI"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photograph a lot for Grade A, URS and reject percentages.
          </p>
        </div>
      </header>

      <section className="px-5 pt-5">
        <div className="surface rounded-3xl p-5">
          <Label
            htmlFor="lot"
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Lot / bag reference (optional)
          </Label>
          <Input
            id="lot"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            placeholder="e.g. Nashik-B12"
            className="mt-2 h-12 rounded-2xl"
          />

          {preview ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <img src={preview} alt="Onion lot submitted for grading" className="w-full" />
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-9 text-center">
              <ScanLine className="size-7 text-primary" />
              <p className="text-sm font-medium text-foreground">Spread onions in one layer</p>
              <p className="text-xs text-muted-foreground">
                Even daylight, plain background, whole lot in frame
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              className="btn-lime h-12 rounded-2xl font-semibold"
              onClick={() => navigate({ to: "/camera" })}
              disabled={mutation.isPending}
            >
              <Camera className="size-4" /> Camera
            </Button>
            <Button
              variant="secondary"
              className="h-12 rounded-2xl font-semibold"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
            >
              <Upload className="size-4" /> Upload
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {mutation.isPending ? (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="size-4 animate-spin" /> Inspecting bulbs for rot, sprouts,
              damage…
            </p>
          ) : null}
        </div>
      </section>

      {report ? (
        <section className="mt-5 space-y-4 px-5">
          <ReportView report={report} />
          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" className="h-11 rounded-xl" onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
            <Button variant="secondary" className="h-11 rounded-xl" onClick={downloadReport}>
              <Download className="size-4" /> Save
            </Button>
            <Button
              className="btn-lime h-11 rounded-xl"
              onClick={() => {
                setPreview(null);
                setReport(null);
                mutation.reset();
              }}
            >
              <RotateCcw className="size-4" /> New
            </Button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
