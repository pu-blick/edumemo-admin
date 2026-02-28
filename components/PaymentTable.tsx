'use client';

import { useState, useMemo } from 'react';

type PaymentRow = {
  id: string;
  order_id: string;
  email: string;
  plan: string | null;
  amount: number;
  status: string;
  credits: number;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  failed:    'bg-rose-100 text-rose-600',
  canceled:  'bg-slate-100 text-slate-500',
};

export default function PaymentTable({ payments }: { payments: PaymentRow[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !p.email.toLowerCase().includes(search.toLowerCase()) && !p.order_id.includes(search)) return false;
      return true;
    });
  }, [payments, statusFilter, search]);

  const totalAmount = filtered
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <input
          type="text"
          placeholder="이메일 / 주문ID 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">상태: 전체</option>
          <option value="completed">completed</option>
          <option value="pending">pending</option>
          <option value="failed">failed</option>
          <option value="canceled">canceled</option>
        </select>
        <span className="ml-auto text-sm text-slate-400">
          {filtered.length}건 · 완료 합계 <strong className="text-slate-700">₩{totalAmount.toLocaleString()}</strong>
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['주문 ID', '이메일', '플랜', '금액', '크레딧', '상태', '일시'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">결제 내역이 없습니다.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[140px] truncate" title={p.order_id}>
                  {p.order_id}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 max-w-[180px] truncate">{p.email}</td>
                <td className="px-4 py-3 capitalize font-semibold">{p.plan ?? '-'}</td>
                <td className="px-4 py-3 font-bold">₩{p.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-indigo-600 font-semibold">{p.credits}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(p.created_at).toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
