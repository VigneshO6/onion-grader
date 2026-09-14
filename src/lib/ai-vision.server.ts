/** Server-only helper: one JSON-returning vision call through the Lovable AI gateway. */

export async function visionJson(args: {
  system: string;
  prompt: string;
  imageDataUrl: string;
  model?: string;
}): Promise<Record<string, unknown>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: args.model ?? "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: args.system },
        {
          role: "user",
          content: [
            { type: "text", text: args.prompt },
            { type: "image_url", image_url: { url: args.imageDataUrl } },
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

  const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const jsonText = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    throw new Error("Could not read the analysis result. Try a clearer, well-lit photo.");
  }
}
