"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  useFinancialData,
  FinancialRow,
} from "@/app/_providers/financial-data-provider";
import { BarChartExample } from "@/components/Charts/ag-charts/BarChart";
import { LineChartExample } from "@/components/Charts/ag-charts/LineChart";
import { PieChartExample } from "@/components/Charts/ag-charts/PieChart";
import { DonutExample } from "@/components/Charts/ag-charts/DonutChar";

interface ChartContainerProps {
  title: string;
  financialData: FinancialRow[];
  ChartComponent: React.FC<{ financialData: FinancialRow[] }>;
}

// Reusable chart container component
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  financialData,
  ChartComponent,
}) => {
  const fiscalYears = useMemo(() => {
    return Array.from(
      new Set(financialData.map((item) => item.fiscalYear))
    ).sort();
  }, [financialData]);

  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    if (fiscalYears.length && !selectedYear) {
      setSelectedYear(fiscalYears[0]);
    }
  }, [fiscalYears, selectedYear]);

  const filteredData = useMemo(() => {
    return financialData.filter((item) => item.fiscalYear === selectedYear);
  }, [financialData, selectedYear]);

  return (
    <div className="bg-gray-200 p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="mb-6 ">
        <label className="mr-2 font-medium">Filter by Fiscal Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-400 rounded px-2 py-1"
        >
          {fiscalYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {filteredData.length > 0 && <ChartComponent financialData={filteredData} />}
    </div>
  );
};

export default function AgChartsPage() {
  const { financialData } = useFinancialData();
  
  // Handle loading or empty data state
  if (!financialData || financialData.length === 0) {
    return (
      <section className="p-5">
        <h1 className="text-2xl font-bold text-center mb-4">Ag Charts</h1>
        <div className="text-center">Loading financial data...</div>
      </section>
    );
  }

  return (
    <section className="p-5">
      <h1 className="text-2xl font-bold text-center mb-4">Ag Charts</h1>
      <div className="grid grid-cols-2 gap-4">
        <ChartContainer 
          title="Bar Series" 
          financialData={financialData}
          ChartComponent={BarChartExample}
        />
        <ChartContainer 
          title="Line Series" 
          financialData={financialData}
          ChartComponent={LineChartExample}
        />
        <ChartContainer 
          title="Pie Series" 
          financialData={financialData}
          ChartComponent={PieChartExample}
        />
        <ChartContainer 
          title="Donut Series" 
          financialData={financialData}
          ChartComponent={DonutExample}
        />
      </div>
    </section>
  );
}