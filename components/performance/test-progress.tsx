interface TestProgressProps {
  currentTest: number;
  totalTests: number;
  isRunning: boolean;
}

export function TestProgress({ currentTest, totalTests, isRunning }: TestProgressProps) {
  if (!isRunning) return null;

  return (
    <div className="text-center">
      <p>
        Running test {currentTest} of {totalTests}...
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentTest / totalTests) * 100}%` }}
        />
      </div>
    </div>
  );
}
