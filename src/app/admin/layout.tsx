import { Suspense } from "react";
import { BilahAtas } from "@/components/app/BilahAtas";
import { wajibPeran } from "@/lib/auth";

async function BilahAdmin() {
  const pengguna = await wajibPeran("admin");
  return <BilahAtas pengguna={pengguna} beranda="/admin" konteks="Pengelolaan sistem" />;
}

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-garis bg-white" />}>
        <BilahAdmin />
      </Suspense>
      <main className="flex-1 bg-latar">{children}</main>
    </>
  );
}
