import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, IBM_Plex_Mono } from "next/font/google";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/brand";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f5f2ec",
  width: "device-width",
  initialScale: 1,
};

// Applica tema e dimensione testo prima del paint per evitare flash.
const themeScript = `
try {
  var t = localStorage.getItem("filo-theme");
  if (t === "dark") document.documentElement.classList.add("dark");
  var s = parseInt(localStorage.getItem("filo-text-scale") || "100", 10);
  if (s && s !== 100) document.documentElement.style.fontSize = s + "%";
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${plexMono.variable} min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
