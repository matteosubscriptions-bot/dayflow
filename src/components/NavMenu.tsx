"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/library", label: "Libreria" },
  { href: "/connections", label: "Connessioni" },
  { href: "/projects", label: "Progetti" },
  { href: "/settings", label: "Impostazioni" },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
      >
        <span className="h-[2px] w-6 bg-ink" />
        <span className="h-[2px] w-6 bg-ink" />
        <span className="h-[2px] w-6 bg-ink" />
      </button>

      {open ? (
        <nav className="absolute right-0 top-12 z-40 w-56 animate-fade-in border border-line bg-card p-2 shadow-lg">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-4 py-3 font-mono text-sm uppercase tracking-[0.2em] hover:bg-ink/5 ${
                pathname.startsWith(l.href) ? "text-ink" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full px-4 py-3 text-left font-mono text-sm uppercase tracking-[0.2em] text-muted hover:bg-ink/5"
          >
            Esci
          </button>
        </nav>
      ) : null}
    </div>
  );
}
