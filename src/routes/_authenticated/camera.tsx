import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldCheck, Upload, CircleDot } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { analyzeOnionImage } from "@/lib/onion.functions";
import { fileToCompressedDataUrl, videoFrameToDataUrl } from "@/lib/image";

export const Route = createFileRoute("/_authenticated/camera")({
  head: () => ({
    meta: [
      { title: "Live camera scan — OnionGrade AI" },
      {
        name: "description",
        content:
          "Allow camera access and capture your onion lot live to grade it instantly with OnionGrade AI.",
      },
      { property: "og:title", content: "Live camera scan — OnionGrade AI" },
      {
        property: "og:description",
        content: "Point your phone camera at the lot and capture a frame for instant AI grading.",
      },
    ],
  }),
  component: CameraScreen,
});

type Stage = "explainer" | "live" | "denied";

function CameraScreen() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeOnionImage);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("explainer");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const mutation = useMutation({
    mutationFn: async (imageDataUrl: string) => analyze({ data: { imageDataUrl } }),
    onSuccess: (report) => {
      stop();
      toast.success("Quality report ready");
      navigate({ to: "/report/$id", params: { id: report.id } });
    },
    onError: (error: Error) => toast.error(error.message || "Analysis failed"),
  });

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setStage("live");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setStage("denied");
    }
  }

  function capture() {
    if (!videoRef.current) return;
    try {
      mutation.mutate(videoFrameToDataUrl(videoRef.current));
    } catch {
      toast.error("Could not capture the frame");
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      mutation.mutate(await fileToCompressedDataUrl(file));
    } catch {
      toast.error("Could not read that image");
    }
  }

  return (
    <AppShell>
      <ScreenHeader title="Live scan" subtitle="Capture the lot straight from your camera" />

      <section className="px-5">
        {stage === "explainer" ? (
          <div className="surface rounded-3xl p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent">
              <Camera className="size-7 text-accent-foreground" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Allow camera access
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              OnionGrade AI needs your camera to photograph the onion lot. The frame is analysed for
              grading only — nothing is recorded or streamed.
            </p>
            <Button onClick={requestCamera} className="btn-lime mt-5 h-12 w-full rounded-2xl font-semibold">
              <ShieldCheck className="size-4" /> Allow camera
            </Button>
            <Button
              variant="secondary"
              className="mt-3 h-12 w-full rounded-2xl font-semibold"
              onClick={() => uploadRef.current?.click()}
            >
              <Upload className="size-4" /> Upload a photo instead
            </Button>
          </div>
        ) : null}

        {stage === "denied" ? (
          <div className="surface rounded-3xl p-6 text-center">
            <h2 className="font-display text-xl font-bold text-foreground">Camera blocked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Camera permission was denied. Open your browser's site settings, allow camera access
              for this app, then try again — or upload a photo from your gallery.
            </p>
            <Button onClick={requestCamera} className="btn-lime mt-5 h-12 w-full rounded-2xl font-semibold">
              Try again
            </Button>
            <Button
              variant="secondary"
              className="mt-3 h-12 w-full rounded-2xl font-semibold"
              onClick={() => uploadRef.current?.click()}
            >
              <Upload className="size-4" /> Upload a photo
            </Button>
          </div>
        ) : null}

        {stage === "live" ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-primary/70" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Fit the whole lot inside the frame, in even light.
            </p>
            <Button
              onClick={capture}
              disabled={mutation.isPending}
              className="btn-lime h-14 w-full rounded-2xl text-sm font-bold tracking-widest uppercase"
            >
              {mutation.isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <CircleDot className="size-5" />
              )}
              {mutation.isPending ? "Analysing" : "Capture"}
            </Button>
          </div>
        ) : null}

        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </section>
    </AppShell>
  );
}
