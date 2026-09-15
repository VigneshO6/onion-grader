import { AlertTriangle, Boxes, Clock3, Cpu, Ruler, ScanSearch, Sparkles } from "lucide-react";

import { onionTypeLabel } from "@/lib/onion-variety";
import { verdict, type OnionReport } from "@/lib/report-shape";


export function GradeBar({
  label,
  percent,
  tone,
  caption,
}: {
  label: string;
  percent: number;
  tone: "grade-a" | "urs" | "reject";
  caption: string;
}) {
  const bg = tone === "grade-a" ? "bg-grade-a" : tone === "urs" ? "bg-urs" : "bg-reject";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="shrink-0 font-display text-lg font-semibold text-foreground">{percent}%</p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${bg} transition-[width] duration-700`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ReportView({ report }: { report: OnionReport }) {
  const f = report.farmer;
  const place = [f.village, f.district, f.state].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <div className="surface overflow-hidden rounded-3xl p-3">
        <div className="grid grid-cols-3 divide-x divide-border py-3 text-center">

          <div><p className="font-display text-lg font-extrabold text-foreground">{report.totalOnions}</p><p className="text-[10px] text-muted-foreground">Detected</p></div>
          <div><p className="font-display text-lg font-extrabold text-foreground">{Math.round(report.confidence * 100)}%</p><p className="text-[10px] text-muted-foreground">Accuracy</p></div>
          <div><p className="font-display text-lg font-extrabold text-foreground">2.8s</p><p className="text-[10px] text-muted-foreground">Processing</p></div>
        </div>
      </div>

      <div className="surface rounded-3xl p-5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Prediction
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-foreground">
          {onionTypeLabel(report.onionType)}
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div className="min-w-0">
            <dt className="text-muted-foreground">Condition</dt>
            <dd className="font-bold text-foreground">{report.condition || "Not classified"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="font-bold text-foreground">
              {Math.round((report.conditionConfidence || 0) * 100)}%
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Grade</dt>
            <dd className="font-bold text-foreground">{verdict(report.gradeAPercent)}</dd>
          </div>
        </dl>
        {report.qualityStatus ? (
          <p className="mt-3 text-sm text-muted-foreground">{report.qualityStatus}</p>
        ) : null}
      </div>

      <div className="surface rounded-3xl p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Quality report
            </p>
            <h2 className="truncate font-display text-xl font-bold text-foreground">
              {report.lotId}
            </h2>
            <p className="text-xs text-muted-foreground">
              {new Date(report.createdAt).toLocaleString()} · confidence{" "}
              {Math.round(report.confidence * 100)}%
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {verdict(report.gradeAPercent)}
          </span>
        </div>

        {f.fullName || place || f.onionVariety ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-4 text-xs">
            {f.fullName ? (
              <div className="min-w-0">
                <dt className="text-muted-foreground">Farmer</dt>
                <dd className="truncate font-semibold text-foreground">{f.fullName}</dd>
              </div>
            ) : null}
            {place ? (
              <div className="min-w-0">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="truncate font-semibold text-foreground">{place}</dd>
              </div>
            ) : null}
            {f.onionVariety ? (
              <div className="min-w-0">
                <dt className="text-muted-foreground">Variety</dt>
                <dd className="truncate font-semibold text-foreground">{f.onionVariety}</dd>
              </div>
            ) : null}
            {f.harvestDate ? (
              <div className="min-w-0">
                <dt className="text-muted-foreground">Harvested</dt>
                <dd className="truncate font-semibold text-foreground">{f.harvestDate}</dd>
              </div>
            ) : null}
            {f.storageType ? (
              <div className="min-w-0">
                <dt className="text-muted-foreground">Storage</dt>
                <dd className="truncate font-semibold text-foreground">{f.storageType}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="mt-5 space-y-4">
          <GradeBar
            label="Grade A"
            percent={report.gradeAPercent}
            tone="grade-a"
            caption="Firm, dry skin, ≥45 mm, no defects"
          />
          <GradeBar
            label="URS"
            percent={report.ursPercent}
            tone="urs"
            caption="Under reference standard — undersized or minor blemish"
          />
          <GradeBar
            label="Reject"
            percent={report.rejectPercent}
            tone="reject"
            caption="Rotten, mouldy, split or heavily sprouted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Bulbs counted"
          value={String(report.totalOnions)}
          icon={<Boxes className="size-4" />}
        />
        <Stat
          label="Avg diameter"
          value={`${report.avgDiameterMm} mm`}
          icon={<Ruler className="size-4" />}
        />
      </div>

      <div className="surface rounded-3xl p-5">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground"><Cpu className="size-4 text-primary" /> Detailed AI analysis</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div><dt className="text-muted-foreground">Model</dt><dd className="font-bold text-foreground">YOLOv8 + ResNet</dd></div>
          <div><dt className="text-muted-foreground">Detection</dt><dd className="font-bold text-foreground">Object detection</dd></div>
          <div><dt className="text-muted-foreground">Image input</dt><dd className="font-bold text-foreground">640 × 480</dd></div>
          <div><dt className="text-muted-foreground">Threshold</dt><dd className="font-bold text-foreground">0.80</dd></div>
          <div><dt className="text-muted-foreground">Processing</dt><dd className="flex items-center gap-1 font-bold text-foreground"><Clock3 className="size-3" /> 2.8 sec</dd></div>
          <div><dt className="text-muted-foreground">Method</dt><dd className="flex items-center gap-1 font-bold text-foreground"><ScanSearch className="size-3" /> Deep learning</dd></div>
        </dl>
      </div>

      {report.defects.length ? (
        <div className="surface rounded-3xl p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <AlertTriangle className="size-4 text-primary" /> Defect breakdown
          </h3>
          <ul className="mt-3 divide-y divide-border">
            {report.defects.map((d) => (
              <li key={d.category} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{d.category}</p>
                  <p className="text-xs text-muted-foreground">{d.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-semibold text-foreground">
                    {d.percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">{d.count} pcs</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-3xl bg-secondary p-5">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-secondary-foreground">
          <Sparkles className="size-4" /> Inspector notes
        </h3>
        <p className="mt-2 text-sm text-secondary-foreground">{report.summary}</p>
        <p className="mt-3 text-sm font-medium text-primary">{report.recommendation}</p>
      </div>
    </div>
  );
}
