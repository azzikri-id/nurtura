import Image from "next/image";

const MENU = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#coba", label: "Coba hitung" },
  { href: "#untuk-siapa", label: "Untuk siapa" },
  { href: "#privasi", label: "Privasi" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-garis bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <a href="#" aria-label="Nurtura, kembali ke atas">
          <Image src="/brand/nurtura-logo-horizontal.svg" alt="Nurtura" width={132} height={33} priority />
        </a>
        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex gap-8 text-sm font-medium text-redup">
            {MENU.map((m) => (
              <li key={m.href}>
                <a href={m.href} className="transition-colors hover:text-tinta">{m.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="/masuk" className="rounded-lg border border-tinta/15 px-4 py-2 text-sm font-semibold text-tinta transition-colors hover:border-langit hover:text-langit-tua">
          Masuk
        </a>
      </div>
    </header>
  );
}
