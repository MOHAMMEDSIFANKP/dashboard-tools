// src/store/slices/dashboardSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChartAttribute, ChartConfig, ChartConfigurations, ChartLibrary } from "@/types/Schemas";

interface DashboardState {
  chartConfigurations: ChartConfigurations;
  selectedLibrary: ChartLibrary;
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
  selectedLibrary: 'ag-charts'
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
    }
  }
});

export const { setChartConfigurations, setSelectedLibrary, updateChartConfig } = dashboardSlice.actions;
export default dashboardSlice.reducer;