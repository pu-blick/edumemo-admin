'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

const nav = [
  { href: '/',         label: '대시보드',  icon: LayoutDashboard },
  { href: '/users',    label: '회원 관리', icon: Users },
  { href: '/payments', label: '결제 내역', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const NavLinks = () => (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
              active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-300'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ── 모바일 상단 헤더 ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 flex items-center justify-between px-4 h-14 border-b border-slate-700">
        <div>
          <span className="text-white font-black text-base tracking-tight">Edumemo </span>
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Admin</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-300 hover:text-white p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── 모바일 드로어 오버레이 ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute left-0 top-14 bottom-0 w-60 bg-slate-900 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 px-3 py-3 space-y-1">
              <NavLinks />
            </nav>
            <div className="px-3 py-4 border-t border-slate-700">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              >
                <LogOut size={17} /> 로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 데스크탑 사이드바 ── */}
      <aside className="hidden md:flex w-56 min-h-screen bg-slate-900 text-slate-300 flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <p className="text-white font-black text-lg tracking-tight">Edumemo</p>
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <LogOut size={17} /> 로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
