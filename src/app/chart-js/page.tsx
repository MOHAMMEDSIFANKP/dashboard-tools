"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  useFinancialData,
  FinancialRow,
} from "@/app/_providers/financial-data-provider";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart container component for reusability
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
};

// Line Chart Component
const LineChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    return {
      labels: data.map((item) => item.catAccountingView),
      datasets: [
        {
          label: "Revenue",
          data: data.map((item) => item.revenue),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.1,
        },
        {
          label: "Net Profit",
          data: data.map((item) => item.netProfit),
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          tension: 0.1,
        },
        {
          label: "Other Income",
          data: data.map((item) => item.otherIncome),
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          tension: 0.1,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Yearly Financial Performance",
      },
    },
  };

  return <Line options={options} data={chartData} />;
};

// Bar Chart Component
const BarChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    return {
      labels: data.map((item) => item.catAccountingView),
      datasets: [
        {
          label: "Revenue",
          data: data.map((item) => item.revenue),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Net Profit",
          data: data.map((item) => item.netProfit),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
        {
          label: "Other Income",
          data: data.map((item) => item.otherIncome),
          backgroundColor: "rgba(80, 99, 132, 0.6)",
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Revenue vs Expenses",
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

// Pie Chart Component
const PieChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  const totalRevenue = useMemo(
    () => data.reduce((sum, item) => sum + parseFloat(item.revenue || "0"), 0),
    [data]
  );
  const totalnetProfit = useMemo(
    () =>
      data.reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0),
    [data]
  );
  const totalotherIncome = useMemo(
    () =>
      data.reduce((sum, item) => sum + parseFloat(item.otherIncome || "0"), 0),
    [data]
  );

  const chartData = useMemo(() => {
    return {
      labels: ["Revenue", "Expenses", "Profit"],
      datasets: [
        {
          data: [totalRevenue, totalnetProfit, totalotherIncome],
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(53, 162, 235, 0.6)",
          ],
          borderColor: [
            "rgb(75, 192, 192)",
            "rgb(255, 99, 132)",
            "rgb(53, 162, 235)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [totalRevenue, totalnetProfit, totalotherIncome]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Financial Overview",
      },
    },
  };

  return <Pie options={options} data={chartData} />;
};

// Donut Chart Component
const DonutChartComponent: React.FC<{ data: FinancialRow[] }> = ({ data }) => {
  // For donut chart, we'll look at the quarterly profit distribution
  const quarterlyData = useMemo(() => {
    const Q1 = data.slice(0, 3).reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0);
    const Q2 = data.slice(3, 6).reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0);
    const Q3 = data.slice(6, 9).reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0);
    const Q4 = data.slice(9, 12).reduce((sum, item) => sum + parseFloat(item.netProfit || "0"), 0);
    return [Q1, Q2, Q3, Q4];
  }, [data]);

  const chartData = useMemo(() => {
    return {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          data: quarterlyData,
          backgroundColor: [
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
          borderColor: [
            "rgb(255, 206, 86)",
            "rgb(75, 192, 192)",
            "rgb(153, 102, 255)",
            "rgb(255, 159, 64)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [quarterlyData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Quarterly Profit Distribution",
      },
    },
    cutout: "50%", // This makes it a donut chart
  };

  return <Doughnut options={options} data={chartData} />;
};

// Year filter component
const YearFilter: React.FC<{
  yearList: string[];
  selectedYear: string;
  onChange: (year: string) => void;
}> = ({ yearList, selectedYear, onChange }) => {

  return (
    <div className="mb-6">
      <label className="mr-2 font-medium">Filter by Year:</label>
      <select
        value={selectedYear}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2"
      >
        {yearList.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

// Main page component
export default function ChartJsPage() {
  const { financialData } = useFinancialData();
  const [selectedYear, setSelectedYear] = useState("2024");
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

  return (
    <section className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-8">
        Financial Dashboard
      </h1>

      <YearFilter yearList={fiscalYears} selectedYear={selectedYear} onChange={setSelectedYear} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartContainer title="Revenue Trends">
          <LineChartComponent data={filteredData} />
        </ChartContainer>

        <ChartContainer title="Revenue vs Expenses">
          <BarChartComponent data={filteredData} />
        </ChartContainer>

        <ChartContainer title="Financial Distribution">
          {filteredData && <PieChartComponent data={filteredData} />}
        </ChartContainer>

        <ChartContainer title="Quarterly Profit">
          <DonutChartComponent data={filteredData} />
        </ChartContainer>
      </div>
    </section>
  );
}
