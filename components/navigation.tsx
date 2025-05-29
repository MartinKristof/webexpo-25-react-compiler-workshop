'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">React Compiler Demo</h1>
      <div className="flex space-x-2">
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
