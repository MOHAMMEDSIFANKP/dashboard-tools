// app/_providers/financial-data-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Papa from "papaparse";

// Define the type of your CSV row (adjust fields as needed)
export interface FinancialRow {
  fiscalYear: string;
  period: string;
  revenue: string;
  operatingExpenses: string;
  netProfit: string;
  [key: string]: string; // To support any additional columns
}

interface FinancialDataContextType {
  financialData: FinancialRow[];
}

const FinancialDataContext = createContext<
  FinancialDataContextType | undefined
>(undefined);

export const FinancialDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [financialData, setFinancialData] = useState<FinancialRow[]>([]);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const res = await fetch(
          "/files/dataset_eventscop_financier_YYYYMM.csv"
        );
        const text = await res.text();
        const parsed = Papa.parse<FinancialRow>(text, {
          header: true,
          skipEmptyLines: true,
        });

        const slicedData = parsed.data.slice(0, 100);
        setFinancialData(slicedData);
      } catch (err) {
        console.error("Error loading CSV:", err);
      }
    };

    loadCSV();
  }, []);

  return (
    <FinancialDataContext.Provider value={{ financialData }}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = (): FinancialDataContextType => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error(
      "useFinancialData must be used within a FinancialDataProvider"
    );
  }
  return context;
};
