export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase';
import PaymentTable from '@/components/PaymentTable';

async function getPayments() {
  const admin = createAdminClient();

  const { data: orders, error } = await admin
    .from('payment_orders')
    .select('id, order_id, user_id, plan, amount, status, credits, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('payment_orders error:', error.message);
    return [];
  }

  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
  const { data: users } = await admin
    .from('users')
    .select('id, email')
    .in('id', userIds);

  const emailMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.email]));
  return (orders ?? []).map((o) => ({ ...o, email: emailMap[o.user_id] ?? o.user_id }));
}

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">결제 내역</h1>
        <p className="text-slate-400 text-sm mt-1">전체 결제 주문 조회</p>
      </div>
      <PaymentTable payments={payments} />
    </div>
  );
}
