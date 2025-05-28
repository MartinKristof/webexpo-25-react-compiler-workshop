'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { JSX } from 'react/jsx-runtime'; // Import JSX to fix the undeclared variable error

interface FlameGraphNode {
  id: string;
  value: number;
  children?: FlameGraphNode[];
  color?: string;
  tooltip?: string;
}

interface FlameGraphProps {
  data: FlameGraphNode;
  width?: number;
  height?: number;
  colorScheme?: 'blue' | 'red' | 'green' | 'purple';
}

const colorSchemes = {
  blue: ['#cfe2ff', '#9ec5fe', '#6ea8fe', '#3d8bfd', '#0d6efd'],
  red: ['#f8d7da', '#f5c2c7', '#ea868f', '#dc3545', '#b02a37'],
  green: ['#d1e7dd', '#a3cfbb', '#75c095', '#479f76', '#146c43'],
  purple: ['#e2d9f3', '#c5b3e6', '#a98eda', '#8c68cd', '#6f42c1'],
};

export default function FlameGraph({ data, width = 1000, height = 300, colorScheme = 'blue' }: FlameGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<FlameGraphNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate the total value of all nodes at the same level
  const calculateTotalValue = (nodes: FlameGraphNode[]): number => {
    return nodes.reduce((sum, node) => sum + node.value, 0);
  };

  // Recursively render the flame graph
  const renderNode = (
    node: FlameGraphNode,
    x: number,
    y: number,
    width: number,
    depth: number,
    maxDepth: number,
  ): JSX.Element[] => {
    const colors = colorSchemes[colorScheme];
    const colorIndex = depth % colors.length;
    const nodeColor = node.color || colors[colorIndex];
    const nodeHeight = height / (maxDepth + 1);

    const elements: JSX.Element[] = [];

    // Add the current node
    elements.push(
      <rect
        key={`${node.id}-${x}-${y}`}
        x={x}
        y={y}
        width={Math.max(width, 1)} // Ensure minimum width of 1px
        height={nodeHeight}
        fill={nodeColor}
        stroke="#fff"
        strokeWidth={0.5}
        onMouseEnter={e => {
          setHoveredNode(node);
          setTooltipPosition({ x: e.clientX, y: e.clientY });
        }}
        onMouseMove={e => {
          setTooltipPosition({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => {
          setHoveredNode(null);
        }}
      />,
    );

    // Add label if there's enough space
    if (width > 30) {
      elements.push(
        <text
          key={`text-${node.id}-${x}-${y}`}
          x={x + 3}
          y={y + nodeHeight / 2}
          fontSize="10"
          fill="#000"
          dominantBaseline="middle"
          textAnchor="start"
          style={{ pointerEvents: 'none' }}
        >
          {node.id.length > width / 6 ? `${node.id.substring(0, Math.floor(width / 6))}...` : node.id}
        </text>,
      );
    }

    // Render children if any
    if (node.children && node.children.length > 0) {
      const totalChildValue = calculateTotalValue(node.children);
      let childX = x;

      node.children.forEach(child => {
        const childWidth = (child.value / totalChildValue) * width;
        elements.push(...renderNode(child, childX, y + nodeHeight, childWidth, depth + 1, maxDepth));
        childX += childWidth;
      });
    }

    return elements;
  };

  // Calculate the maximum depth of the tree
  const calculateMaxDepth = (node: FlameGraphNode, currentDepth = 0): number => {
    if (!node.children || node.children.length === 0) {
      return currentDepth;
    }

    return Math.max(...node.children.map(child => calculateMaxDepth(child, currentDepth + 1)));
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = e.deltaY < 0 ? scale * 1.1 : scale / 1.1;
    setScale(Math.max(0.1, Math.min(10, newScale)));
  };

  // Update scale when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setScale(containerWidth / width);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  const maxDepth = calculateMaxDepth(data);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="overflow-auto"
          style={{ maxWidth: '100%', maxHeight: '500px' }}
          onWheel={handleWheel}
        >
          <svg width={scaledWidth} height={scaledHeight} style={{ minWidth: '100%' }}>
            <g transform={`scale(${scale})`}>{renderNode(data, 0, 0, width, 0, maxDepth)}</g>
          </svg>
          {hoveredNode && (
            <div
              className="absolute bg-white dark:bg-gray-800 p-2 rounded shadow-lg z-50 text-sm"
              style={{
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y + 10,
                maxWidth: '300px',
              }}
            >
              <div className="font-bold">{hoveredNode.id}</div>
              <div>Duration: {hoveredNode.value.toFixed(3)} ms</div>
              {hoveredNode.tooltip && <div>{hoveredNode.tooltip}</div>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
