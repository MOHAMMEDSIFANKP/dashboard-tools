"use client";
import React, { useMemo} from "react";
import { FinancialRow } from "@/app/_providers/financial-data-provider";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

interface LineChartExampleProps {
  financialData: FinancialRow[];
}

export const LineChartExample: React.FC<LineChartExampleProps> = ({
  financialData,
}) => {
  const numericData = useMemo(() => {
    return financialData.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue || "0"),
      netProfit: parseFloat(item.netProfit || "0"),
      FinancialResult: parseFloat(item.FinancialResult || "0"),
    }));
  }, [financialData]);

  const options: AgChartOptions = useMemo(() => {
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
          type: "line",
          xKey: "catAccountingView",
          yKey: "revenue",
          yName: "Revenue",
        },
        {
          type: "line",
          xKey: "catAccountingView",
          yKey: "netProfit",
          yName: "Net Profit",
        },
        {
          type: "line",
          xKey: "catAccountingView",
          yKey: "FinancialResult",
          yName: "Financial Result",
        },
      ],
    };
  }, [numericData]);

  return <AgCharts options={options} />;
};
