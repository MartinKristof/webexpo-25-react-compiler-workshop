'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart2, HandMetal, Home, Sparkles, TestTube } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">React Compiler Demo</h1>
      <div className="flex space-x-2">
        <Link href="/">
          <Button variant={pathname === '/' ? 'default' : 'outline'} size="sm">
            <Home className="h-4 w-4 mr-2" />
            Un-memoized Todo App
          </Button>
        </Link>
        <Link href="/automemoized">
          <Button variant={pathname === '/automemoized' ? 'default' : 'outline'} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-memoized Todo App
          </Button>
        </Link>
        <Link href="/memoized">
          <Button variant={pathname === '/memoized' ? 'default' : 'outline'} size="sm">
            <HandMetal className="h-4 w-4 mr-2" />
            Memoized manually Todo App
          </Button>
        </Link>
        <Link href="/test">
          <Button variant={pathname === '/test' ? 'default' : 'outline'} size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            External library Test
          </Button>
        </Link>
        <Link href="/compare">
          <Button variant={pathname === '/compare' ? 'default' : 'outline'} size="sm">
            <BarChart2 className="h-4 w-4 mr-2" />
            Compare Results
          </Button>
        </Link>
      </div>
    </div>
  );
}
