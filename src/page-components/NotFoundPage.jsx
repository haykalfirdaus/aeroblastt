'use client';
import Link from 'next/link';
import { Rocket, Home, ShoppingBag } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <PageLayout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="relative">
          <p className="select-none font-display text-[9rem] font-extrabold leading-none text-[#BFFF5E]/15 sm:text-[12rem]">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket size={56} className="text-[#BFFF5E]/50" />
          </div>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2b1f] sm:text-3xl">Halaman Tidak Ditemukan</h1>
          <p className="mt-2 max-w-sm text-sm text-[#4a5e3a]">
            Sepertinya pesawatmu tersesat di luar angkasa. Halaman yang kamu cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Link href="/"><Button size="sm"><Home size={13} /> Kembali ke Beranda</Button></Link>
          <Link href="/store"><Button variant="secondary" size="sm"><ShoppingBag size={13} /> Buka Store</Button></Link>
        </div>
      </div>
    </PageLayout>
  );
}
