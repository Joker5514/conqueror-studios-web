export default function HudCorners({
  color = "#e84040",
  size = 12,
  opacity = 0.5,
  className = "",
}: {
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  const s = { borderColor: color, width: size, height: size, opacity };
  return (
    <>
      <span className={`pointer-events-none absolute left-0 top-0 border-l-2 border-t-2 ${className}`} style={s} />
      <span className={`pointer-events-none absolute right-0 top-0 border-r-2 border-t-2 ${className}`} style={s} />
      <span className={`pointer-events-none absolute bottom-0 left-0 border-b-2 border-l-2 ${className}`} style={s} />
      <span className={`pointer-events-none absolute bottom-0 right-0 border-b-2 border-r-2 ${className}`} style={s} />
    </>
  );
}
