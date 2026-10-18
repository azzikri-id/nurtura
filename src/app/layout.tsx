import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nurtura — Dampingi Tumbuh Kembang Anak",
    template: "%s · Nurtura",
  },
  description:
    "Platform yang menghubungkan kader posyandu, orang tua, dan puskesmas untuk memantau tumbuh kembang anak dan mencegah stunting sejak dini.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
