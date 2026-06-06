interface SparklineProps {
  values: number[];
  stroke?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  values,
  stroke = "var(--color-accent)",
  width = 120,
  height = 32,
}: SparklineProps) {
  if (values.length < 2) {
    return <div className="sparkline sparkline--empty" aria-hidden />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
    >
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" points={points} />
    </svg>
  );
}
