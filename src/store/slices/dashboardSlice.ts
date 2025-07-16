// src/store/slices/dashboardSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChartAttribute, ChartConfig, ChartConfigurations, ChartLibrary } from "@/types/Schemas";

type TestCaseType = "test-case-1" | "test-case-2";

interface DashboardState {
  chartConfigurations: ChartConfigurations;
  selectedLibrary: ChartLibrary;
  selectedTestCase: TestCaseType;
}

const initialState: DashboardState = {
  chartConfigurations: {
    line: {
      chart: [],
      filters: [],
      filterValues: {}
    },
    bar: {
      chart: [],
      filters: [],
      filterValues: {}
    }
  },
  selectedLibrary: 'ag-charts',
  selectedTestCase: (typeof window !== "undefined" && localStorage.getItem("selectedTestCase") === "test-case-2")
    ? "test-case-2"
    : "test-case-1"
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setChartConfigurations: (state, action: PayloadAction<ChartConfigurations>) => {
      state.chartConfigurations = action.payload;
    },
    setSelectedLibrary: (state, action: PayloadAction<ChartLibrary>) => {
      state.selectedLibrary = action.payload;
    },
    updateChartConfig: (state, action: PayloadAction<{
      chartType: 'line' | 'bar';
      config: ChartConfig;
    }>) => {
      const { chartType, config } = action.payload;
      state.chartConfigurations[chartType] = config;
    },
    setSelectedTestCase: (state, action: PayloadAction<TestCaseType>) => {
    state.selectedTestCase = action.payload;
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedTestCase", action.payload);
    }
  }

  }
});

export const { setChartConfigurations, setSelectedLibrary, updateChartConfig,setSelectedTestCase } = dashboardSlice.actions;
export default dashboardSlice.reducer;