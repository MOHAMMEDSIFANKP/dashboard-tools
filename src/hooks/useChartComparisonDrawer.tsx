// src\hooks\useChartComparisonDrawer.tsx
import { useState, useCallback } from 'react';

export const useChartComparisonDrawer = () => {
  const [comparisonDrawer, setComparisonDrawer] = useState<{
    isOpen: boolean;
    chartType: string;
  }>({
    isOpen: false,
    chartType: '',
  });

  const handleComparisonOpenDrawer = (chartType: string) => {
    setComparisonDrawer({
      isOpen: true,
      chartType: chartType,
    });
  };

  const handleComparisonCloseDrawer = useCallback(() => {
    setComparisonDrawer({
      isOpen: false,
      chartType: '',
    });
  }, []);

  return {
    comparisonDrawer,
    handleComparisonOpenDrawer,
    handleComparisonCloseDrawer
  };
};
