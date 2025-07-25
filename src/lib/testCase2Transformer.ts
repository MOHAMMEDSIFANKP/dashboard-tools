
// src\lib\testCase2Transformer.ts
export const transformTestCase2ToCommonFormat = (data: any): any => {

    const charts = data.charts;

    return {
      success: data?.success,
      charts: {
        line: {
          success: charts.line_chart.success,
          data: charts.line_chart.data.map((item: any) => ({
            fiscalYear: item.fiscalYear || null,
            period: String(item.period) || null,
            revenue: item.revenue,
            grossMargin: item.grossMargin,
            netProfit: item.netProfit,
          })),
        },
        bar: {
          success: charts.bar_chart.success,
          data: charts.bar_chart.data.map((item: any) => ({
            fiscalYear: item.fiscalYear || null,
            period: String(item.period) || null,
            revenue: item.revenue,
            expenses: item.expenses,
          })),
        },
        pie: {
          success: charts.pie_chart.success,
          data: charts.pie_chart.data.map((item: any) => ({
            catfinancialview: item.cat_financial_view,
            revenue: item.revenue,
          })),
        },
        donut: {
          success: charts.donut_chart.success,
          data: charts.donut_chart.data.map((item: any) => ({
            cataccountingview: item.cat_accounting_view,
            revenue: item.revenue,
          })),
        },
      }
    };
  };

export interface TestCase1DimensionsResponse {
  success: boolean;
  table_name: string;
  dimensions: {
    fiscalyear: number[];
    period: string[];
    cataccountingview: string[];
    catfinancialview: string[];
    country: string[];
    continent: string[];
  };
}

export interface TestCase2DimensionColumn {
  column_name: string;
  data_type: string;
  sample_values: (string | number)[];
  unique_count: number;
}

  export interface TestCase2DimensionsResponse {
  success: boolean;
  product_id: string;
  version: string | null;
  include_reference_tables: boolean;
  dimensions: {
    main_table_dimensions: TestCase2DimensionColumn[];
    reference_table_dimensions: TestCase2DimensionColumn[];
  };
  generated_at: string;
}


export const transformTestCase2ToTestCase1 = (
  testCase2Data: TestCase2DimensionsResponse
): TestCase1DimensionsResponse => {
  const dimensions: TestCase1DimensionsResponse['dimensions'] = {
    fiscalyear: [],
    period: [],
    cataccountingview: [],
    catfinancialview: [],
    country: [],
    continent: [],
  };

  // Process main table dimensions
  testCase2Data.dimensions.main_table_dimensions.forEach(column => {
    switch (column.column_name) {
      case 'fiscal_year_number':
        dimensions.fiscalyear = column.sample_values as number[];
        break;
      case 'fiscal_period_code':
        // Convert period codes to month names
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        dimensions.period = months;
        break;
      case 'cat_accounting_view':
        dimensions.cataccountingview = column.sample_values as string[];
        break;
      case 'cat_financial_view':
        dimensions.catfinancialview = column.sample_values as string[];
        break;
      case 'country_name':
        dimensions.country = column.sample_values as string[];
        break;
      case 'continent_name':
        dimensions.continent = column.sample_values as string[];
        break;
    }
  });

  return {
    success: testCase2Data.success,
    table_name: testCase2Data.product_id,
    dimensions,
  };
};

// Type definitions
interface TestCaseTwoDrillDownResponse {
  fiscal_year_number?: number;
  fiscalyear?: number;
  fiscal_period_code?: number;
  period?: number;
  value?: number;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
  [key: string]: any; // Allow additional properties
}

interface FinancialData {
  fiscalyear?: number;
  period?: number;
  value?: number;
  revenue?: number;
  expenses?: number;
  grossMargin?: number;
  netProfit?: number;
}

interface ApiResponse {
  success: boolean;
  data?: TestCaseTwoDrillDownResponse[];
}

interface TransformResult {
  success: boolean;
  data?: FinancialData[];
  error?: string;
}

// Helper function to check if a value is a valid number
const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const transformTestCase2DrillDownData = (response: ApiResponse): TransformResult => {
  // Validate input structure
  if (!response || !response.success || !Array.isArray(response.data)) {
    return { 
      success: false, 
      error: 'Invalid API response structure' 
    };
  }

  if (response.data.length === 0) {
    return { 
      success: true, 
      data: [] 
    };
  }

  // Transform data
  const transformedData: FinancialData[] = [];
  
  for (const item of response.data) {
    if (!item || typeof item !== 'object') continue;

    // Extract and validate values
    const fiscalyear = isValidNumber(item.fiscal_year_number) 
      ? item.fiscal_year_number 
      : isValidNumber(item.fiscalyear) 
        ? item.fiscalyear 
        : undefined;

    const period = isValidNumber(item.fiscal_period_code) 
      ? item.fiscal_period_code 
      : isValidNumber(item.period) 
        ? item.period 
        : undefined;

    // Create financial data object with only valid numbers
    const financialData: FinancialData = {};

    if (isValidNumber(fiscalyear)) financialData.fiscalyear = fiscalyear;
    if (isValidNumber(period)) financialData.period = period;
    if (isValidNumber(item.value)) financialData.value = item.value;
    if (isValidNumber(item.revenue)) financialData.revenue = item.revenue;
    if (isValidNumber(item.expenses)) financialData.expenses = item.expenses;
    if (isValidNumber(item.grossmargin)) financialData.grossMargin = item.grossmargin;
    if (isValidNumber(item.netprofit)) financialData.netProfit = item.netprofit;

    // Only add if we have at least one valid property
    if (Object.keys(financialData).length > 0) {
      transformedData.push(financialData);
    }
  }

  // Sort by period, then by fiscal year
  transformedData.sort((a, b) => {
    const periodCompare = (a.period || 0) - (b.period || 0);
    if (periodCompare !== 0) return periodCompare;
    return (a.fiscalyear || 0) - (b.fiscalyear || 0);
  });

  return {
    success: true,
    data: transformedData
  };
};