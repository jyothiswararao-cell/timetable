'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Clock } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3 animate-pulse">
      <Clock className="animate-spin w-8 h-8 text-indigo-500" />
      <span className="text-zinc-500 text-sm font-semibold">Redirecting...</span>
    </div>
  );
}
