import { Suspense } from "react";
import { BilahAtas } from "@/components/app/BilahAtas";
import { wajibPeran } from "@/lib/auth";

async function BilahOrangTua() {
  const pengguna = await wajibPeran("orang_tua");
  return <BilahAtas pengguna={pengguna} beranda="/orang-tua" konteks="Tumbuh kembang anak" />;
}

export default function LayoutOrangTua({ children }: LayoutProps<"/orang-tua">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-garis bg-white" />}>
        <BilahOrangTua />
      </Suspense>
      <main className="flex-1 bg-latar">{children}</main>
    </>
  );
}
