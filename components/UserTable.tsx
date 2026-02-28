'use client';

import { useState, useTransition, useMemo } from 'react';
import { updateUserStatus, updateUserCredits, updateUserPlan } from '@/actions/users';
import { ShieldOff, ShieldCheck, Loader2, Save } from 'lucide-react';

type UserRow = {
  id: string;
  email: string;
  status: 'active' | 'blocked';
  role: string;
  plan: string;
  credits: number;
  created_at: string;
};

const PLAN_OPTIONS = ['free', 'tester', 'pro', 'plus', 'school'] as const;

export default function UserTable({ users }: { users: UserRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<Record<string, string>>({});
  const [editPlan, setEditPlan] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (planFilter !== 'all' && u.plan !== planFilter) return false;
      return true;
    });
  }, [users, search, statusFilter, planFilter]);

  const handleStatus = (user: UserRow) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setPendingId(user.id + '_status');
    startTransition(async () => {
      const res = await updateUserStatus(user.id, newStatus);
      setPendingId(null);
      showToast(res.error ?? `${user.email} → ${newStatus}`);
    });
  };

  const handleCredits = (user: UserRow) => {
    const val = parseInt(editCredits[user.id] ?? String(user.credits), 10);
    if (isNaN(val)) return;
    setPendingId(user.id + '_credits');
    startTransition(async () => {
      const res = await updateUserCredits(user.id, val);
      setPendingId(null);
      setEditCredits((p) => { const n = { ...p }; delete n[user.id]; return n; });
      showToast(res.error ?? `크레딧 → ${val}`);
    });
  };

  const handlePlan = (user: UserRow) => {
    const val = (editPlan[user.id] ?? user.plan) as 'free' | 'pro' | 'plus' | 'school' | 'tester';
    setPendingId(user.id + '_plan');
    startTransition(async () => {
      const res = await updateUserPlan(user.id, val);
      setPendingId(null);
      setEditPlan((p) => { const n = { ...p }; delete n[user.id]; return n; });
      showToast(res.error ?? `플랜 → ${val}`);
    });
  };

  return (
    <div>
      {/* 토스트 */}
      {toast && (
        <div className="fixed top-5 right-5 bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="이메일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">상태: 전체</option>
          <option value="active">활성</option>
          <option value="blocked">차단</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">플랜: 전체</option>
          {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="ml-auto text-sm text-slate-400 self-center">{filtered.length}명</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['이메일', '상태', '플랜', '크레딧', '가입일', '액션'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">회원이 없습니다.</td></tr>
            )}
            {filtered.map((user) => {
              const creditsVal = editCredits[user.id] ?? String(user.credits);
              const planVal    = editPlan[user.id] ?? user.plan;
              const creditsChanged = editCredits[user.id] !== undefined && editCredits[user.id] !== String(user.credits);
              const planChanged    = editPlan[user.id] !== undefined && editPlan[user.id] !== user.plan;

              return (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  {/* 이메일 */}
                  <td className="px-4 py-3 font-medium text-slate-700 max-w-[180px] truncate">{user.email}</td>

                  {/* 상태 */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>

                  {/* 플랜 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={planVal}
                        onChange={(e) => setEditPlan((p) => ({ ...p, [user.id]: e.target.value }))}
                        className="border border-slate-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {planChanged && (
                        <button
                          onClick={() => handlePlan(user)}
                          disabled={isPending}
                          className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                          title="저장"
                        >
                          {pendingId === user.id + '_plan' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 크레딧 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={creditsVal}
                        onChange={(e) => setEditCredits((p) => ({ ...p, [user.id]: e.target.value }))}
                        className="w-20 border border-slate-200 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      {creditsChanged && (
                        <button
                          onClick={() => handleCredits(user)}
                          disabled={isPending}
                          className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                          title="저장"
                        >
                          {pendingId === user.id + '_credits' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 가입일 */}
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>

                  {/* 차단/해제 */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatus(user)}
                      disabled={isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${
                        user.status === 'active'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {pendingId === user.id + '_status' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : user.status === 'active' ? (
                        <><ShieldOff size={13} /> 차단</>
                      ) : (
                        <><ShieldCheck size={13} /> 해제</>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
