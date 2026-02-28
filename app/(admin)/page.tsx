export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase';
import { Users, Zap, CreditCard, TrendingUp } from 'lucide-react';

async function getStats() {
  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: activeSubs },
    { data: monthlyPayments },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin
      .from('payment_orders')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const monthlyRevenue = (monthlyPayments ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const monthlyCount   = monthlyPayments?.length ?? 0;

  return { totalUsers: totalUsers ?? 0, activeSubs: activeSubs ?? 0, monthlyRevenue, monthlyCount };
}

async function getRecentPayments() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('payment_orders')
    .select('order_id, user_id, plan, amount, status, created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  // 이메일 조회
  const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: users } = await admin
    .from('users')
    .select('id, email')
    .in('id', userIds);

  const emailMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.email]));
  return (data ?? []).map((r) => ({ ...r, email: emailMap[r.user_id] ?? r.user_id }));
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  failed:    'bg-rose-100 text-rose-700',
  canceled:  'bg-slate-100 text-slate-500',
};

export default async function DashboardPage() {
  const [stats, recent] = await Promise.all([getStats(), getRecentPayments()]);

  const cards = [
    { label: '총 회원 수',        value: stats.totalUsers.toLocaleString() + '명',  icon: Users,      color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '활성 구독자',       value: stats.activeSubs.toLocaleString() + '명',  icon: Zap,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '이번달 결제 건수',  value: stats.monthlyCount.toLocaleString() + '건', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: '이번달 결제액',     value: '₩' + stats.monthlyRevenue.toLocaleString(), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-800 mb-6">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* 최근 결제 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-700">최근 완료 결제</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">플랜</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">일시</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">결제 내역이 없습니다.</td>
                </tr>
              )}
              {recent.map((r) => (
                <tr key={r.order_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-700">{r.email}</td>
                  <td className="px-6 py-3.5 capitalize font-semibold">{r.plan ?? '-'}</td>
                  <td className="px-6 py-3.5 font-bold">₩{r.amount.toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 text-xs">
                    {new Date(r.created_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
