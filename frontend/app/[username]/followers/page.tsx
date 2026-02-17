'use client';

import { useParams, useSearchParams } from 'next/navigation';
import FollowListPage from '@/components/app/profile/FollowListPage';

export default function FollowersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = (params?.username as string) || '';
  const tab = searchParams.get('tab') === 'following' ? 'following' : 'followers';

  return <FollowListPage username={username} initialTab={tab} />;
}
