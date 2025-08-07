export interface Post {
    id: number;
    userId : number;
    title : string;
    body: string;
}

export interface FinancialSchema {
  fiscalYear: number;
  period: number;
  catAccountingView: string;
  catFinancialView: string;
  revenue: number;
  otherincome: number;
  grossmargin: number;
  operatingexpenses: number;
  operatingprofit: number;
  financialresult: number;
  earningsbeforetax: number;
  nonrecurringresult: number;
  netProfit: number;
  country?: string;
  continent?: string;
}

export interface FinancialData {
  fiscalYear: number
  period: string
  catAccountingView: string
  catFinancialView: string
  revenue: number
  otherIncome: number
  grossMargin: number
  operatingExpenses: number
  operatingProfit: number
  FinancialResult: number
  EarningsBeforeTax: number
  nonRecurringResult: number
  netProfit: number
  country: string
  continent: string
  
}

export interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
}

type DimensionSelection = {
  dimension: string;
  members: string[];
};

export type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

// Api Response
export interface FinancialDataResponse {
  table_name: string;
  total_rows: number;
  limit: number;
  offset: number;
  data: FinancialData[];
}


// Data interfaces matching backend response for all charts
export interface LineChartData {
  period?: string;
  fiscalYear :string;
  // country: string;
  revenue: number;
  grossMargin: number;
  netProfit: number;
}

export interface BarChartData {
  period?: string;
  fiscalYear :string;
  country: string;
  revenue: number;
  expenses: number;
}

export interface PieChartData {
  catfinancialview: string;
  revenue: number;
}

export interface DonutChartData {
  cataccountingview: string;
  country: string;
  revenue: number;
}

export interface ChartResponse<T> {
  success: boolean;
  chart_type: string;
  data?: T[];
  columns?: string[];
  grouped_by?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  charts?: {
    line?: ChartResponse<LineChartData>;
    bar?: ChartResponse<BarChartData>;
    pie?: ChartResponse<PieChartData>;
    donut?: ChartResponse<DonutChartData>;
  };
}


// Dashboard configuration interfaces
export interface ChartAttribute {
  key: string;
  label: string;
  color: string;
  iconName: string;
  type: 'measure' | 'dimension';
}

export interface ChartType {
  key: 'line' | 'bar';
  label: string;
  iconName: string;
}

export interface ChartConfig {
  chart: ChartAttribute[];
  filters: ChartAttribute[];
  groupBy?: string;
  filterValues: Record<string, string[]>;
}

export interface ChartConfigurations {
  line: ChartConfig;
  bar: ChartConfig;
}

export interface DraggableAttributeProps {
  attribute: ChartAttribute;
  isUsed: boolean;
}

// Chart Library types
export type ChartLibrary = 'ag-charts' | 'chart-js' | 'plotly' | 'nivo' | 'victory' | 'echarts' | 'highcharts';

export interface ChartLibraryOption {
  key: ChartLibrary;
  label: string;
  icon: string;
  color: string;
  implemented: boolean;
}
