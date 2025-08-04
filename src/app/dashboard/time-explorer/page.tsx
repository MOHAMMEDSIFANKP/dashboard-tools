"use client";
import React, { useState } from "react";

export default function TimeExplorerPage() {
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar
        title="Time-Based Data Explorer"
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <TimeFilterSidebar
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 p-4 overflow-auto">
          {/* Time Navigator */}
          <TimeNavigator
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

          {/* Chart Area */}
          <div className="mt-4 bg-white shadow rounded-xl p-4">
            {/* <ChartContainer
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            /> */}
          </div>
        </div>
      </div>

      {/* Compare Drawer */}
      {/* <CompareDrawer
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      /> */}
    </div>
  );
}

export function TopBar({ title, onOpenCompare }: { title: string; onOpenCompare: () => void }) {
  return (
    <div className="flex justify-between items-center bg-white shadow px-6 py-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <button
        onClick={onOpenCompare}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        Compare
      </button>
    </div>
  );
}

interface Props {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: string | null;
  setSelectedMonth: (month: string | null) => void;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TimeFilterSidebar({ selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }: Props) {
  return (
    <aside className="w-64 bg-white shadow-md p-4 flex flex-col space-y-6">
      <div>
        <h2 className="font-medium mb-2">Year</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        >
          {[2022, 2023, 2024, 2025].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="font-medium mb-2">Month</h2>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-2 py-1 rounded ${
                selectedMonth === month ? "bg-indigo-600 text-white" : "bg-gray-100"
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}


interface Props {
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedMonth: string | null;
  onMonthChange: (month: string | null) => void;
}

export function TimeNavigator({ selectedYear, onYearChange }: Props) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto bg-white shadow px-4 py-2 rounded-lg">
      {[2021, 2022, 2023, 2024, 2025].map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`px-4 py-2 rounded-lg ${
            selectedYear === year ? "bg-indigo-600 text-white" : "bg-gray-200"
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
