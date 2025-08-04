import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  useFetchChartDataMutation,
  useFetchDrillDownDataMutation,
  databaseName
} from '@/lib/services/usersApi';
import { testCase2ProductId, useFetchTestCase2ChartDataMutation, useFetchTestCase2DrillDownDataMutation } from '@/lib/services/testCase2Api';
import { transformTestCase2DrillDownData, transformTestCase2ToCommonFormat } from '@/lib/testCase2Transformer';
import { buildRequestBody } from '@/lib/services/buildWhereClause';
import { Dimensions } from '@/types/Schemas';

interface ChartDataPoint {
  period?: string;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  catAccountingView?: string;
  catfinancialview?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

interface ChartData {
  line: ChartDataPoint[];
  bar: ChartDataPoint[];
  pie: ChartDataPoint[];
  donut: ChartDataPoint[];
  drillDown: any[];
}

interface DrillDownState {
  isDrilled: boolean;
  chartType: string | null;
  title: string;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  category: string;
  value: any;
  chartType: string;
  dataType: string;
}

export const useVictoryCharts = () => {
  // State
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [crossChartFilter, setCrossChartFilter] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    isDrilled: false,
    chartType: null,
    title: ''
  });
  const [chartData, setChartData] = useState<ChartData>({
    line: [],
    bar: [],
    pie: [],
    donut: [],
    drillDown: [],
  });

  // Redux
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  // API Mutations
  const [fetchAllChartData] = useFetchChartDataMutation();
  const [fetchDrillDownData] = useFetchDrillDownDataMutation();
  const [FetchTestCase2AllChartData] = useFetchTestCase2ChartDataMutation();
  const [fetchTestCase2DrillDownData] = useFetchTestCase2DrillDownDataMutation();

  // Data fetching functions
  const fetchChartDataByTestCase = useCallback(async () => {
    try {
      if (testCase === "test-case-1") {
        const res = await fetchAllChartData({ 
          body: buildRequestBody(dimensions, 'all'), 
          crossChartFilter 
        }).unwrap();
        if (!res?.success) throw new Error(res.message || "Error");
        return res;
      } else {
        const raw = await FetchTestCase2AllChartData({ 
          body: buildRequestBody(dimensions, 'all'), 
          crossChartFilter, 
          productId: testCase2ProductId, 
          excludeNullRevenue: false 
        }).unwrap();
        const transformed = transformTestCase2ToCommonFormat(raw);
        if (!transformed?.success) throw new Error(transformed.message || "Error");
        return transformed;
      }
    } catch (error) {
      console.log(error, 'Error fetching chart data');
      throw error;
    }
  }, [testCase, dimensions, crossChartFilter, fetchAllChartData, FetchTestCase2AllChartData]);

  const fetchAllChartDataHandle = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result: any = await fetchChartDataByTestCase();

      setChartData({
        line: result?.charts?.line?.success ? result?.charts?.line?.data || [] : [],
        bar: result?.charts?.bar?.success ? result?.charts?.bar?.data || [] : [],
        pie: result?.charts?.pie?.success ? result?.charts?.pie?.data || [] : [],
        donut: result?.charts?.donut?.success ? result?.charts?.donut?.data || [] : [],
        drillDown: []
      });
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch chart data");
      console.error("Error fetching chart data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChartDataByTestCase]);

  const handleDrillDown = useCallback(async (
    chartType: string, 
    category: string, 
    value: any, 
    dataType: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: any = testCase === "test-case-1"
        ? await fetchDrillDownData({
          table_name: databaseName,
          chart_type: chartType,
          category: category,
          data_type: dataType,
          value: value
        }).unwrap()
        : transformTestCase2DrillDownData(await fetchTestCase2DrillDownData({
          productId: testCase2ProductId,
          chartType: chartType,
          category: category,
          dataType: dataType,
          value: value
        }).unwrap());

      if (result.success && result.data && result.data.length > 0) {
        const drillData = result.data;
        const title = result.title || `${dataType} Breakdown for ${category}`;

        setChartData(prev => ({
          ...prev,
          drillDown: drillData,
        }));

        setDrillDownState({
          isDrilled: true,
          chartType: chartType,
          title: title
        });
      } else {
        setError("No data available for this selection");
      }
    } catch (err: any) {
      setError(err?.data?.detail || err.message || "Failed to fetch drill-down data");
      console.error("Error in drill-down:", err);
    } finally {
      setIsLoading(false);
    }
  }, [testCase, fetchDrillDownData, fetchTestCase2DrillDownData]);

  // Event handlers
  const handleCreateGroup = useCallback((datas: any) => {
    setDimensions(datas);
  }, []);

  const handleResetGroup = useCallback(() => {
    setDimensions(null);
  }, []);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  const handleContextMenuFilter = useCallback(() => {
    if (contextMenu) {
      setCrossChartFilter(contextMenu.category);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuDrillDown = useCallback(() => {
    if (contextMenu) {
      handleDrillDown(contextMenu.chartType, contextMenu.category, contextMenu.value, contextMenu.dataType);
      setContextMenu(null);
    }
  }, [contextMenu, handleDrillDown]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleResetDrillDown = useCallback(() => {
    setDrillDownState({
      isDrilled: false,
      chartType: null,
      title: ''
    });
    setChartData(prev => ({
      ...prev,
      drillDown: [],
    }));
  }, []);

  const handleResetCrossChartFilter = useCallback(() => {
    setCrossChartFilter('');
    handleResetDrillDown();
  }, [handleResetDrillDown]);

  // Effects
  useEffect(() => {
    fetchAllChartDataHandle();
  }, [dimensions, testCase, crossChartFilter, fetchAllChartDataHandle]);

  return {
    // State
    error,
    isLoading,
    dimensions,
    crossChartFilter,
    contextMenu,
    drillDownState,
    chartData,
    testCase,
    
    // Setters
    setContextMenu,
    setError,
    
    // Handlers
    handleCreateGroup,
    handleResetGroup,
    handleDismissError,
    handleContextMenuFilter,
    handleContextMenuDrillDown,
    handleContextMenuClose,
    handleResetDrillDown,
    handleResetCrossChartFilter,
    handleDrillDown,
    fetchAllChartDataHandle,
  };
}; 