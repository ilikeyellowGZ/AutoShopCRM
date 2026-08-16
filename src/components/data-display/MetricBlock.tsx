import type { ReactNode } from "react";

export function MetricBlock({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return <section className="metric-block" aria-label={label}><p>{label}</p><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</section>;
}
