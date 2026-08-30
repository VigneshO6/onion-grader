import type { OnionReport } from "@/lib/report-shape";
import { verdict } from "@/lib/report-shape";

const INK = { r: 24, g: 26, b: 22 };

export function reportFileName(report: OnionReport) {
  return `${report.lotId}-quality-report.pdf`;
}

/** Builds a neat one-page A4 quality report as a PDF Blob (client-side only). */
export async function buildReportPdf(report: OnionReport): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  // Header band
  doc.setFillColor(24, 26, 22);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(197, 246, 84);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("OnionGrade AI", M, 46);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Digital onion quality report", M, 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(verdict(report.gradeAPercent), W - M, 46, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(new Date(report.createdAt).toLocaleString(), W - M, 64, { align: "right" });

  y = 132;
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Lot ${report.lotId}`, M, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 115, 105);
  doc.text(`AI confidence ${Math.round(report.confidence * 100)}%`, M, y);
  y += 26;

  // Farmer block
  const f = report.farmer;
  const rows: [string, string][] = [
    ["Farmer", f.fullName || "—"],
    ["Phone", f.phone || "—"],
    ["Location", [f.village, f.district, f.state].filter(Boolean).join(", ") || "—"],
    ["Variety", f.onionVariety || "—"],
    ["Harvested", f.harvestDate || "—"],
    ["Storage", f.storageType || "—"],
  ];
  doc.setDrawColor(224, 226, 220);
  doc.setFillColor(246, 247, 243);
  doc.roundedRect(M, y, W - M * 2, 92, 8, 8, "FD");
  rows.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + 16 + col * ((W - M * 2 - 32) / 2);
    const ry = y + 24 + row * 26;
    doc.setTextColor(120, 125, 115);
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, ry - 10);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(value).slice(0, 42), x, ry + 2);
    doc.setFont("helvetica", "normal");
  });
  y += 92 + 28;

  // Grade bars
  const bars: [string, number, [number, number, number], string][] = [
    ["Grade A", report.gradeAPercent, [132, 190, 44], "Firm, dry skin, >=45 mm, no defects"],
    ["URS", report.ursPercent, [232, 168, 46], "Under reference standard"],
    ["Reject", report.rejectPercent, [223, 86, 74], "Rotten, mouldy, split or sprouted"],
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("Grade distribution", M, y);
  y += 16;
  const barW = W - M * 2;
  bars.forEach(([label, pct, color, caption]) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(label, M, y + 10);
    doc.text(`${pct}%`, W - M, y + 10, { align: "right" });
    doc.setFillColor(233, 235, 229);
    doc.roundedRect(M, y + 16, barW, 8, 4, 4, "F");
    const filled = Math.max(0, Math.min(100, pct)) / 100 * barW;
    if (filled > 0) {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(M, y + 16, Math.max(filled, 8), 8, 4, 4, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 125, 115);
    doc.text(caption, M, y + 36);
    y += 50;
  });

  // Stats
  doc.setFontSize(10);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.setFont("helvetica", "bold");
  doc.text(`Bulbs counted: ${report.totalOnions}`, M, y);
  doc.text(`Average diameter: ${report.avgDiameterMm} mm`, M + (W - M * 2) / 2, y);
  y += 26;

  // Defects
  if (report.defects.length) {
    doc.setFontSize(12);
    doc.text("Defect breakdown", M, y);
    y += 16;
    doc.setFontSize(9);
    report.defects.forEach((d) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(INK.r, INK.g, INK.b);
      doc.text(d.category, M, y);
      doc.text(`${d.percentage}%  (${d.count} pcs)`, W - M, y, { align: "right" });
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 125, 115);
      doc.text(doc.splitTextToSize(d.note ?? "", barW - 90), M, y);
      y += 18;
      if (y > 730) return;
    });
    y += 8;
  }

  // Notes
  doc.setDrawColor(224, 226, 220);
  doc.setFillColor(246, 247, 243);
  const summary = doc.splitTextToSize(report.summary, barW - 32) as string[];
  const rec = doc.splitTextToSize(`Recommendation: ${report.recommendation}`, barW - 32) as string[];
  const boxH = 34 + (summary.length + rec.length) * 12;
  doc.roundedRect(M, y, barW, boxH, 8, 8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text("Inspector notes", M + 16, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(summary, M + 16, y + 36);
  doc.setFont("helvetica", "bold");
  doc.text(rec, M + 16, y + 36 + summary.length * 12 + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 155, 145);
  doc.text(
    "Generated automatically by OnionGrade AI image analysis. Grades are advisory and free of manual bias.",
    M,
    812,
  );

  return doc.output("blob");
}

/** Shares the PDF via the native share sheet on phones, otherwise downloads it. */
export async function shareOrDownloadReportPdf(report: OnionReport) {
  const blob = await buildReportPdf(report);
  const name = reportFileName(report);
  const file = new File([blob], name, { type: "application/pdf" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: `Lot ${report.lotId} quality report` });
      return "shared" as const;
    } catch {
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded" as const;
}
