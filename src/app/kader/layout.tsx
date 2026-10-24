import { Suspense } from "react";
import { BilahAtas } from "@/components/app/BilahAtas";
import { wajibPeran } from "@/lib/auth";
import { posyanduSaya } from "@/lib/data/kader";

async function BilahKader() {
  const pengguna = await wajibPeran("kader");
  const posyandu = await posyanduSaya(pengguna.id);
  return <BilahAtas pengguna={pengguna} beranda="/kader" konteks={posyandu.map((p) => p.nama).join(", ") || "Kader posyandu"} />;
}

export default function LayoutKader({ children }: LayoutProps<"/kader">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-garis bg-white" />}>
        <BilahKader />
      </Suspense>
      <main className="flex-1 bg-latar">{children}</main>
    </>
  );
}
