// Glifo del brand: un filo che si annoda — richiama il nome dell'app.
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 26C10 20 8 12 14 8c4-2.7 9-2 12 2M26 6c-4 6-2 14-8 18-4 2.7-9 2-12-2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
