"use client";
import React, { useMemo} from "react";
import { FinancialRow } from "@/app/_providers/financial-data-provider";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

interface PieChartExampleProps {
  financialData: FinancialRow[];
}

export const PieChartExample: React.FC<PieChartExampleProps> = ({
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

  const options:AgChartOptions = useMemo(() => {
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
          type: "pie",
          angleKey: "netProfit",
          legendItemKey: "catAccountingView",
        },
      ],
    };
  }, [numericData]);


  return <AgCharts options={options} />;
};
