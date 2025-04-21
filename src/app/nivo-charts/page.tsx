"use client";
import { ResponsiveLine } from "@nivo/line";
import React, { useMemo, useState } from "react";
import { useFinancialData } from "../_providers/financial-data-provider";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";

export default function page() {
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

  //   Line Chart Data
  const lineData = [
    {
      id: "Revenue",
      data: filteredData.map((d, i) => ({
        x: d?.catAccountingView,
        y: d?.revenue,
      })),
    },
    {
      id: "Net Profit",
      data: filteredData.map((d, i) => ({
        x: d?.catAccountingView,
        y: d?.netProfit,
      })),
    },
  ];

  //   Pie Chart Data
  const pieData = useMemo(() => {
    const grouped: { [key: string]: number } = {};

    filteredData.forEach((item) => {
      const key = item.catAccountingView ?? "Unknown";
      const revenue = Number(item.revenue) || 0;
      if (grouped[key]) {
        grouped[key] += revenue;
      } else {
        grouped[key] = revenue;
      }
    });

    return Object.entries(grouped).map(([key, value]) => ({
      id: key,
      label: key,
      value,
    }));
  }, [filteredData]);

  if (financialData.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading financial data...</div>
      </div>
    );
  }

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
        <ChartContainer title="Line Series">
          <div style={{ height: "400px" }}>
            <ResponsiveLine
              data={lineData}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: "auto",
                max: "auto",
                stacked: false,
                reverse: false,
              }}
              axisBottom={{
                legend: "Year",
                legendOffset: 36,
                legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                legendPosition: "middle",
              }}
              colors={{ scheme: "nivo" }}
              pointSize={10}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              useMesh={true}
            />
          </div>
        </ChartContainer>
        <ChartContainer title="Bar Chart">
          <div style={{ height: "400px" }}>
            <ResponsiveBar
              data={filteredData.map((item: any) => ({
                year: item.fiscalYear,
                revenue: Number(item.revenue),
                netProfit: Number(item.netProfit),
              }))}
              keys={["revenue", "netProfit"]}
              indexBy="year"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              colors={{ scheme: "paired" }}
              axisBottom={{
                legend: "Year",
                legendOffset: 36,
                legendPosition: "middle",
              }}
              axisLeft={{
                legend: "Amount",
                legendOffset: -40,
                legendPosition: "middle",
              }}
            />
          </div>
        </ChartContainer>
        <ChartContainer title="Pie Chart">
          <div style={{ height: "400px" }}>
            <ResponsivePie
              data={pieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0} // Set to 0 for Pie Chart. Set > 0 (e.g., 0.5) for Donut Chart
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: "category10" }}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: "color" }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
            />
          </div>
        </ChartContainer>
        <ChartContainer title="Donut Charts">
          <div style={{ height: "400px" }}>
            <ResponsivePie
              data={pieData}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5} // 👈 Donut effect
              padAngle={0.7}
              cornerRadius={3}
              colors={{ scheme: "nivo" }}
              enableRadialLabels={false}
              enableSliceLabels={true}
            />
          </div>
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
