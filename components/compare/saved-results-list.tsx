import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp, Trash2 } from 'lucide-react';
import type { TestResult } from '@/lib/types';

interface SavedResultsListProps {
  savedResults: TestResult[];
  filteredResults: TestResult[];
  selectedResults: TestResult[];
  baselineResult: TestResult | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearAllResults: () => void;
  toggleResultSelection: (result: TestResult) => void;
  setBaselineResult: (result: TestResult | null) => void;
}

const SavedResultsList: React.FC<SavedResultsListProps> = ({
  savedResults,
  filteredResults,
  selectedResults,
  baselineResult,
  fileInputRef,
  handleFileUpload,
  clearAllResults,
  toggleResultSelection,
  setBaselineResult,
}) => {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Saved Test Results</CardTitle>
        <CardDescription>Select results to compare</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button onClick={() => fileInputRef.current?.click()} className="w-full">
            <FileUp className="mr-2 h-4 w-4" />
            Upload Results
          </Button>
          {savedResults.length > 0 && (
            <Button onClick={clearAllResults} variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Results
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredResults.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No matching results found</p>
          ) : (
            filteredResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedResults.includes(result)
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${baselineResult === result ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                onClick={() => toggleResultSelection(result)}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium">{result.testDescription}</p>
                  {selectedResults.includes(result) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        setBaselineResult(result);
                      }}
                    >
                      {baselineResult === result ? 'Baseline' : 'Set as baseline'}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {result.testType}
                  {result.scenario ? ` - ${result.scenario}` : ''}
                </p>
                <p className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedResultsList;
