import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TestConfig, TestScenario, TestType, CustomTestScenario } from '@/lib/performance/types';

interface TestControlsProps {
  testName: string;
  onTestNameChange: (name: string) => void;
  onStartTest: (config: TestConfig) => void;
  onStopTest: () => void;
  isRunning: boolean;
  activeTab: TestType;
  onTabChange: (tab: TestType) => void;
  defaultSettings?: {
    updateTestCount?: number;
    mountTestCount?: number;
    interactionTestCount?: number;
    defaultScenario?: TestScenario;
    defaultTodoText?: string;
    defaultTestType?: TestType;
    customScenarios?: CustomTestScenario[];
  };
}

export function TestControls({
  testName,
  onTestNameChange,
  onStartTest,
  onStopTest,
  isRunning,
  activeTab,
  onTabChange,
  defaultSettings = {},
}: TestControlsProps) {
  const {
    updateTestCount: defaultUpdateTestCount = 20,
    mountTestCount: defaultMountTestCount = 10,
    interactionTestCount: defaultInteractionTestCount = 20,
    defaultScenario = 'toggleTodo',
    defaultTodoText = 'Performance Test Todo',
    customScenarios = [],
  } = defaultSettings;

  // Update test state
  const [updateTestCount, setUpdateTestCount] = useState(defaultUpdateTestCount);
  const [todoText, setTodoText] = useState(defaultTodoText);

  // Mount test state
  const [mountTestCount, setMountTestCount] = useState(defaultMountTestCount);

  // Interaction test state
  const [interactionTestCount, setInteractionTestCount] = useState(defaultInteractionTestCount);
  const [interactionScenario, setInteractionScenario] = useState<TestScenario>(defaultScenario);
  const [selectedCustomScenario, setSelectedCustomScenario] = useState<CustomTestScenario | null>(() => {
    // Initialize selectedCustomScenario based on defaultScenario
    return customScenarios.find(s => s.id === defaultScenario) || null;
  });

  // Only initialize the scenario selection once when the component mounts
  useEffect(() => {
    const customScenario = customScenarios.find(s => s.id === defaultScenario);
    setSelectedCustomScenario(customScenario || null);
    setInteractionScenario(defaultScenario);
  }, []); // Empty dependency array means this only runs once on mount

  const handleStartTest = () => {
    const config: TestConfig = {
      testName,
      testType: activeTab,
      testCount:
        activeTab === 'update' ? updateTestCount : activeTab === 'mount' ? mountTestCount : interactionTestCount,
      ...(activeTab === 'update' && { todoText }),
      ...(activeTab === 'interaction' && {
        ...(selectedCustomScenario ? { customScenario: selectedCustomScenario } : { scenario: interactionScenario }),
      }),
    };

    onStartTest(config);
  };

  const handleScenarioChange = (value: string) => {
    const customScenario = customScenarios.find(s => s.id === value);

    // Determine the base test name by splitting at the first ' - '
    const baseTestName = testName.includes(' - ') ? testName.split(' - ')[0] : testName;

    if (customScenario) {
      setSelectedCustomScenario(customScenario);
      setInteractionScenario(customScenario.id);
      // Use the scenario name for the test name suffix
      onTestNameChange(`${baseTestName} - ${customScenario.name}`);
    } else {
      // This case should ideally not happen if the select is populated correctly
      // but as a fallback, set the state and use the value as the suffix
      setSelectedCustomScenario(null);
      setInteractionScenario(value as TestScenario);
      onTestNameChange(`${baseTestName} - ${value}`); // Fallback using ID as name
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label htmlFor="testName" className="block text-sm font-medium mb-1">
          Test Name
        </label>
        <Input
          id="testName"
          type="text"
          value={testName}
          onChange={e => onTestNameChange(e.target.value)}
          disabled={isRunning}
          placeholder="Enter a name for this test"
        />
      </div>

      <Tabs value={activeTab} onValueChange={value => onTabChange(value as TestType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="update">Update Performance</TabsTrigger>
          <TabsTrigger value="mount">Mount Performance</TabsTrigger>
          <TabsTrigger value="interaction">Interaction Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="update" className="space-y-4 pt-4">
          <form>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="updateTestCount" className="block text-sm font-medium mb-1">
                  Number of Tests
                </label>
                <Input
                  id="updateTestCount"
                  type="number"
                  min="1"
                  max="100"
                  value={updateTestCount}
                  onChange={e => {
                    const value = Number.parseInt(e.target.value) || 1;
                    setUpdateTestCount(Math.min(Math.max(value, 1), 100));
                  }}
                  disabled={isRunning}
                />
              </div>
              <div>
                <label htmlFor="todoText" className="block text-sm font-medium mb-1">
                  Todo Text Prefix
                </label>
                <Input
                  id="todoText"
                  type="text"
                  value={todoText}
                  onChange={e => setTodoText(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="mount" className="space-y-4 pt-4">
          <div>
            <label htmlFor="mountTestCount" className="block text-sm font-medium mb-1">
              Number of Mount Tests
            </label>
            <Input
              id="mountTestCount"
              type="number"
              min="1"
              max="100"
              value={mountTestCount}
              onChange={e => {
                const value = Number.parseInt(e.target.value) || 1;
                setMountTestCount(Math.min(Math.max(value, 1), 100));
              }}
              disabled={isRunning}
            />
          </div>
        </TabsContent>

        <TabsContent value="interaction" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="interactionTestCount" className="block text-sm font-medium mb-1">
                Number of Tests
              </label>
              <Input
                id="interactionTestCount"
                type="number"
                min="1"
                max="100"
                value={interactionTestCount}
                onChange={e => {
                  const value = Number.parseInt(e.target.value) || 1;
                  setInteractionTestCount(Math.min(Math.max(value, 1), 100));
                }}
                disabled={isRunning}
              />
            </div>
            <div>
              <label htmlFor="interactionScenario" className="block text-sm font-medium mb-1">
                Test Scenario
              </label>
              <Select value={interactionScenario} onValueChange={handleScenarioChange} disabled={isRunning}>
                <SelectTrigger id="interactionScenario">
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {customScenarios.map(scenario => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomScenario && (
                <p className="mt-1 text-sm text-gray-500">{selectedCustomScenario.description}</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex space-x-4">
        <Button onClick={handleStartTest} disabled={isRunning} className="flex-1">
          Start {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Test
        </Button>
        <Button onClick={onStopTest} disabled={!isRunning} variant="destructive" className="flex-1">
          Stop Test
        </Button>
      </div>
    </div>
  );
}
