'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase';

/** 회원 차단 / 활성화 */
export async function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  const admin = createAdminClient();
  const { error } = await admin.rpc('admin_update_user_status', {
    p_target_user_id: userId,
    p_status: status,
  });
  if (error) return { error: error.message };
  revalidatePath('/users');
  return { error: null };
}

/** 크레딧 수동 수정 */
export async function updateUserCredits(userId: string, amount: number) {
  if (amount < 0) return { error: '크레딧은 0 이상이어야 합니다.' };
  const admin = createAdminClient();
  const { error } = await admin
    .from('credits')
    .update({ amount, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/users');
  return { error: null };
}

/** 구독 플랜 수동 변경 */
export async function updateUserPlan(userId: string, plan: 'free' | 'pro' | 'plus' | 'school' | 'tester') {
  const admin = createAdminClient();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await admin
    .from('subscriptions')
    .upsert({
      user_id:               userId,
      plan,
      status:                plan === 'free' ? 'canceled' : 'active',
      current_period_start:  new Date().toISOString(),
      current_period_end:    plan === 'free' ? null : periodEnd.toISOString(),
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) return { error: error.message };
  revalidatePath('/users');
  return { error: null };
}
