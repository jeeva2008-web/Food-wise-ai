import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TestScenario } from '../../types';
import { getTestScenarios } from '../../utils/testRunner';

export const TestCenterView: React.FC = () => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [results, setResults] = useState<
    Record<string, { passed: boolean; actualResult: string; details: string }>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    const list = getTestScenarios();
    setScenarios(list);
    // Auto-run on load
    runAllTests(list);
  }, []);

  const runAllTests = (testsList: TestScenario[] = scenarios) => {
    setIsRunning(true);
    const newResults: Record<string, { passed: boolean; actualResult: string; details: string }> = {};

    for (const test of testsList) {
      try {
        newResults[test.id] = test.runTest();
      } catch (err: any) {
        newResults[test.id] = {
          passed: false,
          actualResult: `Execution error: ${err?.message || err}`,
          details: 'Runtime exception occurred during test assertion execution.',
        };
      }
    }

    setResults(newResults);
    setIsRunning(false);
  };

  const runSingleTest = (test: TestScenario) => {
    try {
      const outcome = test.runTest();
      setResults((prev) => ({ ...prev, [test.id]: outcome }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [test.id]: {
          passed: false,
          actualResult: `Error: ${err?.message}`,
          details: 'Exception encountered',
        },
      }));
    }
  };

  const passedCount = Object.values(results).filter((r) => r.passed).length;
  const totalCount = scenarios.length;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-bold text-neutral-900">
              System Test Centre & Algorithm Verification Suite
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => runAllTests()}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isRunning ? 'Running Verification...' : 'Run All 12 Test Scenarios'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Automated integration test runner verifying core edge cases: mass balance physics, attendance drop sensitivity, zero-leftover tolerances, chronological checks, and forecast accuracy. Every test evaluates real algorithm output against strict expected assertions.
        </p>

        {/* Results summary pill strip */}
        <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Passed: <strong className="text-emerald-800 font-bold tabular-nums">{passedCount}</strong> / {totalCount}</span>
          </div>
          {totalCount - passedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Failed: <strong className="text-red-700 font-bold tabular-nums">{totalCount - passedCount}</strong></span>
            </div>
          )}
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-500 font-medium">All tests execute in-browser with zero mocked passes</span>
        </div>
      </div>

      {/* Test Scenarios List */}
      <div className="space-y-3">
        {scenarios.map((test, index) => {
          const outcome = results[test.id];
          const isExpanded = expandedId === test.id;

          return (
            <div
              key={test.id}
              className={`rounded-xl border transition-all bg-white shadow-2xs ${
                outcome?.passed
                  ? 'border-emerald-200 hover:border-emerald-300'
                  : outcome?.passed === false
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-neutral-200'
              }`}
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {outcome?.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : outcome?.passed === false ? (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300 animate-spin" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        #{index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-neutral-900">{test.name}</h3>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        [{test.category}]
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {test.description}
                    </p>
                  </div>
                </div>

                {/* Status & Toggle */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase ${
                      outcome?.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : outcome?.passed === false
                        ? 'bg-red-100 text-red-800'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {outcome?.passed ? 'Passed' : outcome?.passed === false ? 'Failed' : 'Pending'}
                  </span>

                  <button
                    onClick={() => runSingleTest(test)}
                    title="Re-run Test"
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : test.id)}
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Technical Details Panel */}
              {isExpanded && (
                <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 text-xs space-y-3">
                  <div>
                    <span className="font-bold text-neutral-700 block mb-1">Input Parameters:</span>
                    <pre className="rounded-lg bg-white p-2.5 border border-neutral-200 text-[11px] font-mono text-neutral-800 overflow-x-auto">
                      {JSON.stringify(test.inputData, null, 2)}
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3 border border-neutral-200">
                      <span className="font-bold text-neutral-700 block mb-1">Expected Output:</span>
                      <p className="text-neutral-600">{test.expectedResult}</p>
                    </div>

                    <div className="rounded-lg bg-white p-3 border border-neutral-200">
                      <span className="font-bold text-neutral-700 block mb-1">Actual Result:</span>
                      <p className={outcome?.passed ? 'text-emerald-800 font-medium' : 'text-red-700'}>
                        {outcome?.actualResult || 'Running...'}
                      </p>
                    </div>
                  </div>

                  {outcome?.details && (
                    <div className="text-[11px] text-neutral-500">
                      <strong>Audit Details: </strong> {outcome.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Documented System Limitations & CS Discussion */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
          <Info className="h-4 w-4 text-emerald-800" />
          <span>Documented Limitations & University Research Roadmap</span>
        </div>

        <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
          <p>
            <strong>1. Attendance vs. Consumption Non-Linearity: </strong>
            While the current heuristic dynamically adapts demand using empirical attendance ratios, student appetite varies non-linearly during exam periods, rainy weather, and sporting events. Future iterations can incorporate academic timetabling APIs and weather forecasts via polynomial regression.
          </p>
          <p>
            <strong>2. Sensory Food Safety Constraints: </strong>
            Software systems cannot physically measure bacterial proliferation, moisture loss, or oil rancidity. Software timestamps are helpful guidelines, but mandatory in-person probe thermometry (&ge;65&deg;C) and physical kitchen inspection remain irreplaceable legal requirements.
          </p>
          <p>
            <strong>3. Single-Point Plate Waste vs. Kitchen Buffet Leftovers: </strong>
            FoodWise AI currently monitors batch preparation mass balance. Extending the system to student tray return weighing stations with computer vision will distinguish kitchen over-prep from individual student plate waste.
          </p>
        </div>
      </div>
    </div>
  );
};
