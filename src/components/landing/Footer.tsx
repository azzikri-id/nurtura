import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-garis bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-redup md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/brand/nurtura-mark.svg" alt="" width={36} height={36} />
          <p>
            <span className="font-semibold text-tinta">Nurtura</span> · Karya untuk Web Development Competition UINIC 8.0
            <br className="hidden sm:block" /> Sedang dalam pengembangan.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href="/privasi" className="hover:text-tinta">Kebijakan privasi</a>
          </li>
          <li>
            <a href="https://github.com/azzikri-id/nurtura" className="hover:text-tinta" target="_blank" rel="noreferrer">
              Kode sumber
            </a>
          </li>
          <li>
            <a href="https://www.who.int/tools/child-growth-standards" className="hover:text-tinta" target="_blank" rel="noreferrer">
              Standar pertumbuhan WHO
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
