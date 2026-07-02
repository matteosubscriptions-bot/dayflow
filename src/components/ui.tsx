// La soglia: due materiali. OFFICINA è carta/laboratorio (chiaro, caldo),
// SPECCHIO è notte/interiorità (scuro, freddo). Componenti base condivisi.

"use client";

import type { CSSProperties, ReactNode } from "react";

export type Theme = {
  bg: string; panel: string; ink: string; sub: string; line: string;
  accent: string; accSoft: string; good: string; danger: string; dark: boolean;
};

export const T_OFF: Theme = {
  bg: "#E8EAE1", panel: "#F4F5EF", ink: "#22271F", sub: "#5B6354", line: "#C7CCBA",
  accent: "#8A611C", accSoft: "#EFE4CB", good: "#47594B", danger: "#8C3B2E", dark: false,
};
export const T_SPE: Theme = {
  bg: "#14161F", panel: "#1D2130", ink: "#E9E4D8", sub: "#9BA2B5", line: "#333B52",
  accent: "#9DB2D4", accSoft: "#262E45", good: "#8FB59A", danger: "#C98A7D", dark: true,
};

export const SERIF = "'Fraunces', Georgia, serif";
export const SANS = "'Archivo', system-ui, sans-serif";

export function Card({ th, children, style }: { th: Theme; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: 14, padding: 14, ...style }}>
      {children}
    </div>
  );
}

export function Btn({
  th, children, onClick, ghost, small, danger, style, disabled, title,
}: {
  th: Theme; children: ReactNode; onClick?: () => void; ghost?: boolean;
  small?: boolean; danger?: boolean; style?: CSSProperties; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        border: ghost ? `1px solid ${th.line}` : "none",
        background: ghost ? "transparent" : danger ? th.danger : th.accent,
        color: ghost ? th.ink : th.dark && !danger ? "#14161F" : "#FBFAF6",
        borderRadius: 10,
        padding: small ? "6px 10px" : "10px 14px",
        fontSize: small ? 13 : 14,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ th, children }: { th: Theme; children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: th.sub, fontWeight: 600, marginBottom: 8 }}>
      {children}
    </div>
  );
}

export const inputStyle = (th: Theme): CSSProperties => ({
  width: "100%",
  background: th.bg,
  color: th.ink,
  border: `1px solid ${th.line}`,
  borderRadius: 10,
  padding: 10,
});
