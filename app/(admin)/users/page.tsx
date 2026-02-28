export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase';
import UserTable from '@/components/UserTable';

async function getUsers() {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('admin_get_users');
  if (error) {
    console.error('admin_get_users error:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">회원 관리</h1>
        <p className="text-slate-400 text-sm mt-1">회원 상태 변경, 크레딧·플랜 수동 조정</p>
      </div>
      <UserTable users={users} />
    </div>
  );
}
