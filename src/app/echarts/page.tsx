"use client";
import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  FinancialRow,
  useFinancialData,
} from "../_providers/financial-data-provider";

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
        <h1 className="text-3xl font-bold text-center mb-8">ECharts</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartContainer title="Line Charts">
          <LineChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Bar Charts">
          <BarChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Pie Charts">
          <PieChartComponent data={filteredData} />
        </ChartContainer>
        <ChartContainer title="Donut Charts">
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
    <div className="h-64">{children}</div>
  </div>
);

const LineChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const option = useMemo(
    () => ({
      title: { text: "Yearly Financial Performance" },
      tooltip: { trigger: "axis" },
      legend: { data: ["Revenue", "Net Profit", "Other Income"] },
      xAxis: {
        type: "category",
        data: data.map((item) => item.catAccountingView),
      },
      yAxis: { type: "value" },
      series: [
        {
          name: "Revenue",
          type: "line",
          data: data.map((item) => item.revenue),
          smooth: true,
        },
        {
          name: "Net Profit",
          type: "line",
          data: data.map((item) => item.netProfit),
          smooth: true,
        },
        {
          name: "Other Income",
          type: "line",
          data: data.map((item) => item.otherIncome),
          smooth: true,
        },
      ],
    }),
    [data]
  );

  return <ReactECharts option={option} style={{ height: "100%" }} />;
};

const BarChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const option = useMemo(
    () => ({
      title: { text: "Revenue vs Expenses" },
      tooltip: { trigger: "axis" },
      legend: { data: ["Revenue", "Net Profit", "Other Income"] },
      xAxis: {
        type: "category",
        data: data.map((item) => item.catAccountingView),
      },
      yAxis: { type: "value" },
      series: [
        {
          name: "Revenue",
          type: "bar",
          data: data.map((item) => item.revenue),
        },
        {
          name: "Net Profit",
          type: "bar",
          data: data.map((item) => item.netProfit),
        },
        {
          name: "Other Income",
          type: "bar",
          data: data.map((item) => item.otherIncome),
        },
      ],
    }),
    [data]
  );

  return <ReactECharts option={option} style={{ height: "100%" }} />;
};

const PieChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const totalRevenue = useMemo(
    () => data.reduce((sum, i) => sum + parseFloat(i.revenue || "0"), 0),
    [data]
  );
  const totalNetProfit = useMemo(
    () => data.reduce((sum, i) => sum + parseFloat(i.netProfit || "0"), 0),
    [data]
  );
  const totalOtherIncome = useMemo(
    () => data.reduce((sum, i) => sum + parseFloat(i.otherIncome || "0"), 0),
    [data]
  );

  const option = {
    title: { text: "Financial Overview", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 10, left: "center" },
    series: [
      {
        name: "Financial Distribution",
        type: "pie",
        radius: "70%",
        data: [
          { value: totalRevenue, name: "Revenue" },
          { value: totalNetProfit, name: "Net Profit" },
          { value: totalOtherIncome, name: "Other Income" },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "100%" }} />;
};

const DonutChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const quarters = useMemo(() => {
    const q = [0, 0, 0, 0];
    data.forEach((item, idx) => {
      const qIndex = Math.floor(idx / 3);
      q[qIndex] += parseFloat(item.netProfit || "0");
    });
    return q;
  }, [data]);

  const option = {
    title: { text: "Quarterly Profit Distribution", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 10, left: "center" },
    series: [
      {
        name: "Profit by Quarter",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        data: [
          { value: quarters[0], name: "Q1" },
          { value: quarters[1], name: "Q2" },
          { value: quarters[2], name: "Q3" },
          { value: quarters[3], name: "Q4" },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: "100%" }} />;
};
