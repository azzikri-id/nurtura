import Image from "next/image";
import Link from "next/link";
import { keluar } from "@/app/masuk/actions";
import { NAMA_PERAN, type Pengguna } from "@/lib/auth";

/** Bilah atas aplikasi untuk semua peran. */
export function BilahAtas({ pengguna, konteks, beranda }: { pengguna: Pengguna; konteks?: string; beranda: string }) {
  return (
    <header className="border-b border-garis bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={beranda} aria-label="Beranda">
            <Image src="/brand/nurtura-mark.svg" alt="Nurtura" width={34} height={34} priority />
          </Link>
          <div className="min-w-0 border-l border-garis pl-4">
            <p className="truncate text-sm font-bold text-tinta">{konteks ?? NAMA_PERAN[pengguna.peran]}</p>
            <p className="truncate text-xs text-redup">{pengguna.nama} · {NAMA_PERAN[pengguna.peran]}</p>
          </div>
        </div>
        <form action={keluar}>
          <button type="submit" className="text-sm font-semibold text-redup transition-colors hover:text-tinta">
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
