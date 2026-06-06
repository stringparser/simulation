import type { ReactNode } from "react";

interface PanelSectionProps {
  title: string;
  className: string;
  children: ReactNode;
}

export function PanelSection({ title, className, children }: PanelSectionProps) {
  return (
    <section className={className}>
      <h2 className="side-panel__heading">{title}</h2>
      {children}
    </section>
  );
}
