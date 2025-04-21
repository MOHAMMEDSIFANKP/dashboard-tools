"use client";
import React, { useMemo } from "react";
import { FinancialRow } from "@/app/_providers/financial-data-provider";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

interface BarChartExampleProps {
  financialData: FinancialRow[];
}

// interface OptionSchema {
//   title: {
//     text: string;
//   };
//   subtitle: {
//     text: string;
//   };
//   data: FinancialRow[];
//   series: {
//     type: string;
//     xKey: string;
//     yKey: string;
//     yName?: string;
//   }[];
// }

export const BarChartExample: React.FC<BarChartExampleProps> = ({
  financialData,
}) => {
  // Memoize the numeric data conversion to prevent unnecessary recalculations
  const numericData = useMemo(() => {
    return financialData.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue || "0"),
      netProfit: parseFloat(item.netProfit || "0"),
      FinancialResult: parseFloat(item.FinancialResult || "0"),
    }));
  }, [financialData]);
  
  // Memoize the chart options to prevent unnecessary re-renders
  const options: AgChartOptions =  useMemo(() => {
    return {
      title: {
        text: "Profit & Loss Accounts",
      },
      subtitle: {
        text: "Showing numbers in $",
      },
      data: numericData,
      series: [
        {
          type: "bar",
          xKey: "catAccountingView",
          yKey: "revenue",
          yName: "Revenue",
        },
        {
          type: "bar",
          xKey: "catAccountingView",
          yKey: "netProfit",
          yName: "Net Profit",
        },
        {
          type: "bar",
          xKey: "catAccountingView",
          yKey: "FinancialResult",
          yName: "Financial Result",
        },
      ],
    };
  }, [numericData]);

  return <AgCharts options={options} />;
};