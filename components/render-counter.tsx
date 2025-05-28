'use client';

import { useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface RenderCounterProps {
  componentName: string;
  position?: 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'top';
  showArrow?: boolean;
}

export default function RenderCounter({
  componentName,
  position = 'top-right',
  showArrow = false,
}: RenderCounterProps) {
  const renderCount = useRef(1);

  useEffect(() => {
    renderCount.current += 1;
  });

  // Map position to CSS classes
  const positionClasses = {
    'top-right': 'top-0 right-0 translate-x-full mr-2',
    right: 'top-1/2 right-0 -translate-y-1/2 translate-x-full mr-2',
    'bottom-right': 'bottom-0 right-0 translate-x-full mr-2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full mb-2',
    'bottom-left': 'bottom-0 left-0 -translate-x-full ml-2',
    left: 'top-1/2 left-0 -translate-y-1/2 -translate-x-full ml-2',
    'top-left': 'top-0 left-0 -translate-x-full ml-2',
    top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full mt-2',
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-10 flex items-center`}>
      {showArrow && position.includes('right') && <ArrowLeft className="h-4 w-4 mr-1 text-gray-500" />}
      <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        {componentName}: {renderCount.current} renders
      </Badge>
      {showArrow && position.includes('left') && <ArrowRight className="h-4 w-4 ml-1 text-gray-500" />}
    </div>
  );
}
