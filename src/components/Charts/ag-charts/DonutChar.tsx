"use client";
import React, { useMemo} from "react";
import { FinancialRow } from "@/app/_providers/financial-data-provider";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-community";

interface DonutExampleProps {
  financialData: FinancialRow[];
}

export const DonutExample: React.FC<DonutExampleProps> = ({
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
          type: 'donut',
          calloutLabelKey: 'catAccountingView',
          angleKey: 'netProfit',
        },
      ],
    };
  }, [numericData]);


  return <AgCharts options={options} />;
};
