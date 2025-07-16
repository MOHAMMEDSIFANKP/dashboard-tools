// src\lib\testCase2Transformer.ts
export const transformTestCase2ToCommonFormat = (data: any): any => {

    const charts = data.charts;

    return {
      success: data?.success,
      charts: {
        line: {
          success: charts.line_chart.success,
          data: charts.line_chart.data.map((item: any) => ({
            period: item.period,
            revenue: item.revenue,
            grossMargin: item.grossMargin,
            netProfit: item.netProfit,
          })),
        },
        bar: {
          success: charts.bar_chart.success,
          data: charts.bar_chart.data.map((item: any) => ({
            period: item.period,
            revenue: item.revenue,
            expenses: item.expenses,
          })),
        },
        pie: {
          success: charts.pie_chart.success,
          data: charts.pie_chart.data.map((item: any) => ({
            catfinancialview: item.catfinancialview,
            revenue: item.revenue,
          })),
        },
        donut: {
          success: charts.donut_chart.success,
          data: charts.donut_chart.data.map((item: any) => ({
            cataccountingview: item.cataccountingview,
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

export const transformTestCase2DrillDownData = (data: any) => {
  if (!data?.success || !Array.isArray(data.data)) {
    return { success: false };
  }

  // Transform and sort the data
  const transformedData = data.data
  //@ts-ignore
    .map(item => ({
      fiscalyear: item.fiscal_year_number,
      period: item.fiscal_period_code,
      value: item.value,
      catfinancialview: item.level_3_category_name,
      // cataccountingview: item.level_2_department_name,
      // country: item.country_name,
    }))
    .sort((a:any, b:any) => a.period - b.period);

  return {
    success: true,
    data: transformedData
  };
};