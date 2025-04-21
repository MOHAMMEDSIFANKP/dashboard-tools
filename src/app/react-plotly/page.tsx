"use client";
import React, { useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { useFinancialData } from "../_providers/financial-data-provider";

export default function ReactPlotly() {
  const { financialData } = useFinancialData();
  const [selectedYear, setSelectedYear] = useState<string>("2021");

  const fiscalYears = useMemo(() => {
    return Array.from(
      new Set(financialData.map((item) => item.fiscalYear))
    ).sort();
  }, [financialData]);

  const filteredData = useMemo(() => {
    return financialData.filter((item) => item.fiscalYear === selectedYear);
  }, [financialData, selectedYear]);

  if (financialData.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading financial data...</div>
      </div>
    );
  }

  const yearLabel = selectedYear;
  const catAccountingView = filteredData.map((d) => d.catAccountingView);
  const revenue = filteredData.map((d) => Number(d.revenue));
  const netProfit = filteredData.map((d) => Number(d.netProfit));
  const grossMargin = filteredData.map((d) => Number(d.grossMargin));
  const operatingExpenses = filteredData.map((d) =>
    Number(d.operatingExpenses)
  );

  return (
    <section className="p-8 space-y-8">
      {/* Year Filter */}
      <div className="mb-4">
        <label htmlFor="fiscalYear" className="mr-2 font-semibold text-lg">
          Select Fiscal Year:
        </label>
        <select
          id="fiscalYear"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded"
        >
          {fiscalYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Bar Series">
          <Plot
            data={[
              {
                x: catAccountingView,
                y: revenue,
                type: "bar",
                name: "Revenue",
                marker: { color: "teal" },
              },
              {
                x: catAccountingView,
                y: netProfit,
                type: "bar",
                name: "Net Profit",
                marker: { color: "orange" },
              },
            ]}
            layout={{
              title: "Revenue vs Net Profit",
              barmode: "group",
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Line Series">
          <Plot
            data={[
              {
                x: catAccountingView,
                y: grossMargin,
                type: "scatter",
                mode: "lines+markers",
                name: "Gross Margin",
                line: { color: "purple" },
              },
              {
                x: catAccountingView,
                y: operatingExpenses,
                type: "scatter",
                mode: "lines+markers",
                name: "Operating Expenses",
                line: { color: "red" },
              },
            ]}
            layout={{ title: "Gross Margin vs Operating Expenses" }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Pie Series">
          <Plot
            data={[
              {
                values: [
                  revenue[0],
                  netProfit[0],
                  grossMargin[0],
                  operatingExpenses[0],
                ],
                labels: [
                  "Revenue",
                  "Net Profit",
                  "Gross Margin",
                  "Operating Expenses",
                ],
                type: "pie",
              },
            ]}
            layout={{ title: `Financial Breakdown (${yearLabel})` }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>

        <ChartContainer title="Donut Series">
          <Plot
            data={[
              {
                values: [
                  revenue[0],
                  netProfit[0],
                  grossMargin[0],
                  operatingExpenses[0],
                ],
                labels: [
                  "Revenue",
                  "Net Profit",
                  "Gross Margin",
                  "Operating Expenses",
                ],
                type: "pie",
                hole: 0.5,
              },
            ]}
            layout={{
              title: `Donut Chart - Financial Breakdown (${yearLabel})`,
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </ChartContainer>
      </div>
    </section>
  );
}

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
};
