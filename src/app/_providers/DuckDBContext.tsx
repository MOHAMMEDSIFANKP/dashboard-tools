// providers/DuckDBContext.tsx
"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";

interface DuckDBContextType {
  executeQuery: (sql: string) => Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }>;
  isLoading: boolean;
  isDataLoaded: boolean;
  error: string | null;
}

const DuckDBContext = createContext<DuckDBContextType | null>(null);

export function DuckDBProvider({ children }: { children: ReactNode }) {
  const duckDBValues = useDuckDB();

  if (!duckDBValues.isDataLoaded) {
    return <div className="text-center p-4">Loading database...</div>;
  }

  return (
    <DuckDBContext.Provider value={duckDBValues}>
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDuckDBContext() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error("useDuckDBContext must be used within a DuckDBProvider");
  }
  return context;
}