// app/financial-data/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import DataGrid from "@/components/DataGrid";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { FinancialSchema } from "@/types/Schemas";

export default function FinancialDataPage() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [financialData, setFinancialData] = useState<FinancialSchema[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isDataLoaded) return;

    try {
      const result = await executeQuery("SELECT * FROM financial_data");
      if (result.success && result.data) {
        setFinancialData(result.data);        
      } else {
        setError(result.error || "Failed to fetch data");
      }
    } catch (err:unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  }, [isDataLoaded, executeQuery]);

  useEffect(() => {
    if (isDataLoaded) {
      fetchData();
    }
  }, [isDataLoaded, fetchData]);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-4">
      <h1 className="text-xl font-bold mb-4">Financial Data - Ag Table</h1>
      <DataGrid financialData={financialData} />
    </section>
  );
}