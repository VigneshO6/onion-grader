export type OnionDefect = {
  category: string;
  count: number;
  percentage: number;
  note: string;
};

export type FarmerSnapshot = {
  fullName?: string;
  village?: string;
  district?: string;
  state?: string;
  onionVariety?: string;
  harvestDate?: string | null;
  storageType?: string;
  phone?: string;
};

export type OnionReport = {
  id: string;
  lotId: string;
  createdAt: string;
  onionType: "big" | "small" | "unknown";
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
  farmer: FarmerSnapshot;
};

type ReportRow = {
  id: string;
  lot_id: string;
  created_at: string;
  total_onions: number;
  grade_a_percent: number | string;
  urs_percent: number | string;
  reject_percent: number | string;
  avg_diameter_mm: number;
  confidence: number | string;
  defects: unknown;
  summary: string;
  recommendation: string;
  farmer_snapshot: unknown;
};

export function rowToReport(row: ReportRow): OnionReport {
  return {
    id: row.id,
    lotId: row.lot_id,
    createdAt: row.created_at,
    totalOnions: row.total_onions,
    gradeAPercent: Number(row.grade_a_percent),
    ursPercent: Number(row.urs_percent),
    rejectPercent: Number(row.reject_percent),
    avgDiameterMm: row.avg_diameter_mm,
    confidence: Number(row.confidence),
    defects: Array.isArray(row.defects) ? (row.defects as OnionDefect[]) : [],
    summary: row.summary,
    recommendation: row.recommendation,
    farmer: (row.farmer_snapshot as FarmerSnapshot) ?? {},
  };
}

export function verdict(gradeAPercent: number): string {
  if (gradeAPercent >= 70) return "Export ready";
  if (gradeAPercent >= 45) return "Mixed lot";
  return "Re-sort needed";
}
