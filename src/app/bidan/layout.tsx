import { Suspense } from "react";
import { BilahAtas } from "@/components/app/BilahAtas";
import { wajibPeran } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function BilahBidan() {
  const pengguna = await wajibPeran("bidan");
  const supabase = await createClient();
  const { data } = pengguna.puskesmasId
    ? await supabase.from("puskesmas").select("nama").eq("id", pengguna.puskesmasId).maybeSingle()
    : { data: null };
  return <BilahAtas pengguna={pengguna} beranda="/bidan" konteks={data?.nama ?? "Bidan"} />;
}

export default function LayoutBidan({ children }: LayoutProps<"/bidan">) {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-garis bg-white" />}>
        <BilahBidan />
      </Suspense>
      <main className="flex-1 bg-latar">{children}</main>
    </>
  );
}
