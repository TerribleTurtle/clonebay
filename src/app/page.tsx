import { Dashboard } from '../components/Dashboard';
import Link from 'next/link';

export default function Home() {
  return (
    <main role="main" className="relative min-h-screen bg-zinc-950">
      <Dashboard />
      <div className="absolute bottom-4 right-4">
        <Link href="/debug" className="text-xs text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-mono">
          [ DEBUG TERMINAL ]
        </Link>
      </div>
    </main>
  );
}
