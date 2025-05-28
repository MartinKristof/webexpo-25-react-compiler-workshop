import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const DeveloperEffortAnalysis: React.FC = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Developer Effort Saved: Compiler vs. Manual Memoization</CardTitle>
        <CardDescription>
          An analysis of the lines of code and developer time saved by using the React Compiler.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Comparing the manual memoization implementation (`components/memoized-todos`) to the auto-memoized
            implementation (`components/auto-memoized-todos`), we can observe a significant reduction in code related to
            manual memoization.
          </p>
          <p>
            In the manually memoized components, there are multiple instances of <code>useCallback</code>,{' '}
            <code>useMemo</code>, and <code>memo</code> calls, along with their associated dependency arrays. These
            require careful management to avoid bugs and ensure correct behavior.
          </p>
          <p>
            In contrast, the auto-memoized components directory shows no usage of these manual memoization hooks. This
            is because the React Compiler automatically handles the optimization, eliminating the need for developers to
            manually apply <code>useCallback</code>, <code>useMemo</code>, and <code>memo</code>.
          </p>
          <h4>Estimated Lines of Code Saved:</h4>
          <p>
            Based on the search results and the typical structure of components requiring memoization, the manual
            memoization in this Todo App example adds approximately <strong>10-20 lines</strong> of code across various
            components for managing <code>useCallback</code>, <code>useMemo</code> wrappers, and <code>memo</code> HOCs,
            plus their dependency arrays.
          </p>
          <h4>Estimated Developer Time Saved:</h4>
          <p>The saved lines of code translate directly into saved developer time. Developers no longer need to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Identify where memoization is necessary.</li>
            <li>
              Manually wrap functions with <code>useCallback</code> or values with <code>useMemo</code>.
            </li>
            <li>
              Wrap components with <code>memo</code>.
            </li>
            <li>
              Critically, manually manage and debug dependency arrays for these hooks, a common source of bugs and
              performance issues.
            </li>
            <li>Spend time on performance profiling to identify missing memoizations.</li>
          </ul>
          <p>
            While the exact time saved varies per project complexity, for an application of this size, it could easily
            save a developer anywhere from <strong>a few hours to a day or more</strong> of initial development and
            ongoing maintenance effort related to memoization concerns.
          </p>
          <p>
            For larger applications, the time savings and reduced potential for bugs become even more significant,
            freeing up developers to focus on building features rather than managing manual performance optimizations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeveloperEffortAnalysis;
