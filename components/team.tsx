import { equipo } from "@/lib/data";

export function TeamLabel({
  code,
  className = "",
  short = false,
}: {
  code: string;
  className?: string;
  short?: boolean;
}) {
  const e = equipo(code);
  if (!e) return <span className={className}>—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-lg leading-none">{e.flag}</span>
      <span>{short ? e.code : e.name}</span>
    </span>
  );
}
