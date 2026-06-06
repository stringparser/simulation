import type { ReactNode } from "react";

interface FieldControlProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FieldControl({ label, children, className }: FieldControlProps) {
  return (
    <label className={className ? `control ${className}` : "control"}>
      <span className="control__label">{label}</span>
      {children}
    </label>
  );
}
