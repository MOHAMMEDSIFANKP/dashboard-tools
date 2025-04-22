"use client";
import React, { useMemo, useState } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryLegend,
  VictoryGroup,
  VictoryBar,
  VictoryAxis,
  VictoryPie,
} from "victory";

import {
  FinancialRow,
  useFinancialData,
} from "@/app/_providers/financial-data-provider";

const page = () => {
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
  return (
    <section className="p-8 space-y-8">
      
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
        <h1 className="text-center font-bold text-2xl">Victory</h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ChartContainer title="Line Charts">
          <LineChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Line Charts">
          <BarChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Line Charts">
          <PieChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Line Charts">
          <DonutChartComponent data={filteredData} />
        </ChartContainer>
      </div>
    </section>
  );
};
export default page;

const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="h-72">{children}</div>
  </div>
);

const LineChartComponent = ({ data }: { data: FinancialRow[] }) => {
  return (
    <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
      <VictoryLegend
        x={100}
        y={10}
        orientation="horizontal"
        gutter={20}
        data={[
          { name: "Revenue", symbol: { fill: "#4bc0c0" } },
          { name: "Net Profit", symbol: { fill: "#ff6384" } },
          // { name: "Other Income", symbol: { fill: "#359ee4" } },
        ]}
      />
      <VictoryLine
        data={data}
        x="catAccountingView"
        y="revenue"
        style={{ data: { stroke: "#4bc0c0" } }}
      />
      <VictoryLine
        data={data}
        x="catAccountingView"
        y="netProfit"
        style={{ data: { stroke: "#ff6384" } }}
      />
      {/* <VictoryLine
        data={data}
        x="catAccountingView"
        y="otherIncome"
        style={{ data: { stroke: "#359ee4" } }}
      /> */}
    </VictoryChart>
  );
};

const BarChartComponent = ({ data }: { data: FinancialRow[] }) => (
  <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
    <VictoryAxis tickFormat={data.map((d) => d.catAccountingView)} />
    <VictoryGroup offset={20} colorScale={["#4bc0c0", "#ff6384", "#506384"]}>
      <VictoryBar data={data} x="catAccountingView" y="revenue" />
      <VictoryBar data={data} x="catAccountingView" y="netProfit" />
      <VictoryBar data={data} x="catAccountingView" y="otherIncome" />
    </VictoryGroup>
  </VictoryChart>
);

const PieChartComponent = ({ data }: { data: FinancialRow[] }) => {
  const totalRevenue = data.reduce(
    (sum, item) => sum + parseFloat(item.revenue || "0"),
    0
  );
  const totalNetProfit = data.reduce(
    (sum, item) => sum + parseFloat(item.netProfit || "0"),
    0
  );
  const totalOtherIncome = data.reduce(
    (sum, item) => sum + parseFloat(item.otherIncome || "0"),
    0
  );

  const pieData = [
    { x: "Revenue", y: totalRevenue },
    { x: "Net Profit", y: totalNetProfit },
    { x: "Other Income", y: totalOtherIncome },
  ];

  return (
    <VictoryPie
      data={pieData}
      colorScale={["#4bc0c0", "#ff6384", "#359ee4"]}
      labelRadius={50}
      style={{ labels: { fontSize: 14 } }}
    />
  );
};

const DonutChartComponent = ({ data }: { data: FinancialRow[] }) => {
  const quarterlyData = [
    data.slice(0, 3),
    data.slice(3, 6),
    data.slice(6, 9),
    data.slice(9, 12),
  ].map((quarter) =>
    quarter.reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0)
  );

  const donutData = [
    { x: "Q1", y: quarterlyData[0] },
    { x: "Q2", y: quarterlyData[1] },
    { x: "Q3", y: quarterlyData[2] },
    { x: "Q4", y: quarterlyData[3] },
  ];

  return (
    <VictoryPie
      data={donutData}
      colorScale={["#ffce56", "#4bc0c0", "#9966ff", "#ff9f40"]}
      innerRadius={90}
      labelRadius={110}
      style={{ labels: { fontSize: 12 } }}
    />
  );
};
