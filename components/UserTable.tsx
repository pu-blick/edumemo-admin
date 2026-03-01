'use client';

import { useState, useTransition, useMemo } from 'react';
import { updateUserStatus, updateUserCredits, updateUserPlan, deleteClassroom, resetUserPassword } from '@/actions/users';
import { ShieldOff, ShieldCheck, Loader2, Save, Key, ChevronDown, Trash2, Users } from 'lucide-react';

/* ── 타입 ── */
type UserRow = {
  id: string;
  email: string;
  status: 'active' | 'blocked';
  role: string;
  plan: string;
  credits: number;
  created_at: string;
};
type ClassroomRow = {
  id: string;
  user_id: string;
  user_email: string;
  name: string;
  student_count: number;
  created_at: string;
};

/* ── 플랜 라벨 & 색상 ── */
const PLAN_OPTIONS = ['free', 'tester', 'pro', 'plus', 'school'] as const;
const PLAN_LABELS: Record<string, string> = {
  free: 'Free', pro: 'Basic', plus: 'Pro', school: 'School',
  tester: 'Event', test: 'Event', event: 'Event',
};
const PLAN_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-indigo-100 text-indigo-700',
  plus: 'bg-violet-100 text-violet-700',
  school: 'bg-emerald-100 text-emerald-700',
  tester: 'bg-amber-100 text-amber-700',
  test: 'bg-amber-100 text-amber-700',
  event: 'bg-amber-100 text-amber-700',
};
const getPlanLabel = (p: string) => PLAN_LABELS[p] || p;
const getPlanColor = (p: string) => PLAN_COLORS[p] || 'bg-slate-100 text-slate-600';
const PLAN_DISPLAY: Record<string, string> = {
  free: 'Free', tester: 'Event', pro: 'Basic', plus: 'Pro', school: 'School',
};

export default function UserTable({ users, classrooms }: { users: UserRow[]; classrooms: ClassroomRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<Record<string, string>>({});
  const [editPlan, setEditPlan] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [toast, setToast] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [localClassrooms, setLocalClassrooms] = useState<ClassroomRow[]>(classrooms);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  /* 유저별 채널 수 */
  const classroomCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    localClassrooms.forEach((c) => { map[c.user_id] = (map[c.user_id] || 0) + 1; });
    return map;
  }, [localClassrooms]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (planFilter !== 'all' && u.plan !== planFilter) return false;
      return true;
    });
  }, [users, search, statusFilter, planFilter]);

  /* ── 핸들러 ── */
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
    const val = (editPlan[user.id] ?? user.plan) as typeof PLAN_OPTIONS[number];
    setPendingId(user.id + '_plan');
    startTransition(async () => {
      const res = await updateUserPlan(user.id, val);
      setPendingId(null);
      setEditPlan((p) => { const n = { ...p }; delete n[user.id]; return n; });
      showToast(res.error ?? `플랜 → ${getPlanLabel(val)}`);
    });
  };

  const handleResetPassword = (user: UserRow) => {
    setPendingId(user.id + '_pw');
    startTransition(async () => {
      const res = await resetUserPassword(user.email);
      setPendingId(null);
      showToast(res.error ?? `${user.email} 비밀번호 재설정 메일 발송`);
    });
  };

  const handleDeleteClassroom = (classroom: ClassroomRow) => {
    if (!confirm(`"${classroom.name}" 채널을 삭제하시겠습니까?\n학생 ${classroom.student_count}명 데이터가 함께 삭제됩니다.`)) return;
    setPendingId(classroom.id + '_del');
    startTransition(async () => {
      const res = await deleteClassroom(classroom.id);
      setPendingId(null);
      if (res.error) {
        showToast(res.error);
      } else {
        setLocalClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
        showToast(`"${classroom.name}" 삭제 완료`);
      }
    });
  };

  const userClassrooms = (userId: string) => localClassrooms.filter((c) => c.user_id === userId);

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
          {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{PLAN_DISPLAY[p]}</option>)}
        </select>
        <span className="ml-auto text-sm text-slate-400 self-center">{filtered.length}명</span>
      </div>

      {/* ── PC 테이블 ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">이메일</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">플랜 / 크레딧</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">가입일</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">상태</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">채널</th>
              <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">회원이 없습니다.</td></tr>
            )}
            {filtered.map((user) => {
              const creditsVal = editCredits[user.id] ?? String(user.credits);
              const planVal = editPlan[user.id] ?? user.plan;
              const creditsChanged = editCredits[user.id] !== undefined && editCredits[user.id] !== String(user.credits);
              const planChanged = editPlan[user.id] !== undefined && editPlan[user.id] !== user.plan;
              const chCount = classroomCountMap[user.id] || 0;
              const isExpanded = expandedUserId === user.id;
              const uClassrooms = userClassrooms(user.id);

              return (
                <tbody key={user.id}>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    {/* 이메일 — 왼쪽정렬 */}
                    <td className="px-4 py-3 text-left font-medium text-slate-700 max-w-[220px] truncate">{user.email}</td>

                    {/* 플랜 + 크레딧 — 왼쪽정렬 */}
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getPlanColor(user.plan)}`}>
                          {getPlanLabel(user.plan)}
                        </span>
                        <div className="flex items-center gap-1">
                          <select
                            value={planVal}
                            onChange={(e) => setEditPlan((p) => ({ ...p, [user.id]: e.target.value }))}
                            className="border border-slate-200 rounded-lg text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-[70px]"
                          >
                            {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{PLAN_DISPLAY[p]}</option>)}
                          </select>
                          {planChanged && (
                            <button onClick={() => handlePlan(user)} disabled={isPending} className="p-0.5 text-indigo-600 hover:text-indigo-800 disabled:opacity-40" title="저장">
                              {pendingId === user.id + '_plan' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            </button>
                          )}
                        </div>
                        <span className="text-slate-300 mx-0.5">·</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={creditsVal}
                            onChange={(e) => setEditCredits((p) => ({ ...p, [user.id]: e.target.value }))}
                            className="w-16 border border-slate-200 rounded-lg text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <span className="text-[10px] text-slate-400">크레딧</span>
                          {creditsChanged && (
                            <button onClick={() => handleCredits(user)} disabled={isPending} className="p-0.5 text-indigo-600 hover:text-indigo-800 disabled:opacity-40" title="저장">
                              {pendingId === user.id + '_credits' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 가입일 — 왼쪽정렬 */}
                    <td className="px-4 py-3 text-left text-slate-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>

                    {/* 상태 — 중앙정렬 */}
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {user.status === 'active' ? '활성' : '차단'}
                      </span>
                    </td>

                    {/* 채널 수 — 중앙정렬 */}
                    <td className="px-4 py-3 text-center">
                      {chCount > 0 ? (
                        <button
                          onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Users size={13} /> {chCount}
                          <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>

                    {/* 관리 — 우측정렬 */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                          title="비밀번호 재설정 메일"
                        >
                          {pendingId === user.id + '_pw' ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                          PW
                        </button>
                        <button
                          onClick={() => handleStatus(user)}
                          disabled={isPending}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-40 ${
                            user.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {pendingId === user.id + '_status' ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.status === 'active' ? (
                            <><ShieldOff size={12} /> 차단</>
                          ) : (
                            <><ShieldCheck size={12} /> 복구</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* 채널 확장 영역 */}
                  {isExpanded && uClassrooms.length > 0 && (
                    <tr className="bg-indigo-50/30">
                      <td colSpan={6} className="px-4 py-3 border-l-4 border-indigo-200">
                        <div className="grid gap-2">
                          {uClassrooms.map((c) => (
                            <div key={c.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-100">
                              <div>
                                <span className="font-semibold text-sm text-slate-700">{c.name}</span>
                                <span className="text-xs text-slate-400 ml-2">학생 {c.student_count}명</span>
                                <span className="text-xs text-slate-300 ml-2">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteClassroom(c)}
                                disabled={isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40"
                              >
                                {pendingId === c.id + '_del' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 모바일 카드 ── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center text-slate-400 py-8">회원이 없습니다.</div>
        )}
        {filtered.map((user) => {
          const creditsVal = editCredits[user.id] ?? String(user.credits);
          const planVal = editPlan[user.id] ?? user.plan;
          const creditsChanged = editCredits[user.id] !== undefined && editCredits[user.id] !== String(user.credits);
          const planChanged = editPlan[user.id] !== undefined && editPlan[user.id] !== user.plan;
          const chCount = classroomCountMap[user.id] || 0;
          const isExpanded = expandedUserId === user.id;
          const uClassrooms = userClassrooms(user.id);

          return (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              {/* 상단: 이메일 + 상태 */}
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-700 text-sm truncate">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(user.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
                <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                }`}>
                  {user.status === 'active' ? '활성' : '차단'}
                </span>
              </div>

              {/* 플랜 + 크레딧 */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getPlanColor(user.plan)}`}>
                  {getPlanLabel(user.plan)}
                </span>
                <div className="flex items-center gap-1">
                  <select
                    value={planVal}
                    onChange={(e) => setEditPlan((p) => ({ ...p, [user.id]: e.target.value }))}
                    className="border border-slate-200 rounded-lg text-[11px] px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{PLAN_DISPLAY[p]}</option>)}
                  </select>
                  {planChanged && (
                    <button onClick={() => handlePlan(user)} disabled={isPending} className="p-0.5 text-indigo-600 disabled:opacity-40">
                      {pendingId === user.id + '_plan' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    </button>
                  )}
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={creditsVal}
                    onChange={(e) => setEditCredits((p) => ({ ...p, [user.id]: e.target.value }))}
                    className="w-14 border border-slate-200 rounded-lg text-[11px] px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  {creditsChanged && (
                    <button onClick={() => handleCredits(user)} disabled={isPending} className="p-0.5 text-indigo-600 disabled:opacity-40">
                      {pendingId === user.id + '_credits' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* 액션 버튼 행 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleResetPassword(user)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40"
                >
                  {pendingId === user.id + '_pw' ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                  PW
                </button>
                <button
                  onClick={() => handleStatus(user)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40 ${
                    user.status === 'active'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {pendingId === user.id + '_status' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : user.status === 'active' ? (
                    <><ShieldOff size={12} /> 차단</>
                  ) : (
                    <><ShieldCheck size={12} /> 복구</>
                  )}
                </button>
                {chCount > 0 && (
                  <button
                    onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-600"
                  >
                    <Users size={12} /> 채널 {chCount}
                    <ChevronDown size={11} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* 채널 확장 */}
              {isExpanded && uClassrooms.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {uClassrooms.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                      <div>
                        <span className="font-semibold text-xs text-slate-700">{c.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">학생 {c.student_count}명</span>
                      </div>
                      <button
                        onClick={() => handleDeleteClassroom(c)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                      >
                        {pendingId === c.id + '_del' ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <p className="text-xs text-slate-400 mt-4 text-center">
        관리자 유의사항: 사용자 차단 시 해당 계정의 로그인이 제한됩니다. 채널 삭제 시 학생 데이터가 함께 삭제됩니다.
      </p>
    </div>
  );
}
