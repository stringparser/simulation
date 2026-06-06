import type { ReactNode } from "react";

interface MetricRowProps {
  label: string;
  value: ReactNode;
}

export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
