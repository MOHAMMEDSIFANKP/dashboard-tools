import { ApiResponse } from "@/types/Schemas";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const testCase2ProductId = "financial_data_100M_product_v1";
// data_1m_product_v1

interface ChartRequestBody {
  chartType: string;
  dimensions?: {
    groupName?: string;
    filteredSelections?: Array<{
      dimension: string;
      members: (string | number)[];
    }>;
  };
  year?: string;
  limit?: number;
  groupBy?: string;
}

interface DrillDownParams {
  productId?: string;
  chartType: string;
  category: string;
  dataType: string;
  value?: string | number;
  drillDownLevel?: string;
  includeReferenceContext?: boolean;
  excludeNullRevenue?: boolean;
}

interface TableFetchParams {
  productId?: string;
  limit?: number;
  offset?: number;
  search?: string;
  column_filters?: Record<string, string[]>;
  excludeNullRevenue?: boolean;
  includeEnrichment?: boolean;
}

interface TableApiResponse {
  success: boolean;
  data: Record<string, any>[];
  metadata: {
    product_id: string;
    record_counts: {
      total_records: number;
      filtered_records: number;
      showing_records: number;
      offset: number;
      has_more: boolean;
    };
    columns: string[];
    query_info: {
      main_table: string;
      joins_count: number;
      limit: number;
      offset: number;
      enrichment_enabled: boolean;
    };
    filters_applied: {
      manual_conditions: number;
      advanced_filters: number;
      total_conditions: number;
    };
    filter_summary: {
      search_text: string | null;
      country_filter: string | null;
      account_type_filter: string | null;
      revenue_range: string | null;
      year_range: string | null;
      countries_list: string[] | null;
      account_types_list: string[] | null;
      years_list: number[] | null;
      exclude_null_revenue: boolean;
    };
    endpoint_type: string;
    description: string;
  };
  pagination: {
    current_page: number;
    page_size: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    total_records: number;
    filtered_records: number;
    showing_records: number;
  };
}



export const testCase2Api = createApi({
  reducerPath: 'testCase2Api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://testcase2.mohammedsifankp.online/api/',
  }),
  endpoints: (builder) => ({
    // Chart Data Endpoints for Test Case 2
    fetchTestCase2ChartData: builder.mutation<ApiResponse, {
      productId?: string;
      body: ChartRequestBody;
      excludeNullRevenue?: boolean;
      crossChartFilter?: string;
    }>({
      query: ({ crossChartFilter, productId = testCase2ProductId, body, excludeNullRevenue = false }) => ({
        url: `dashboard/all-charts?product_id=${productId}&exclude_null_revenue=${excludeNullRevenue}&${crossChartFilter ? `&year_filter=${crossChartFilter}` : ''}`,
        method: 'POST',
        body,
      }),
    }),
    // 🆕 Fetch Dimensions (No Reference Tables)
    fetchTestCase2Dimensions: builder.query<
      any,
      { productId?: string; includeReferenceTables?: boolean }
    >({
      query: ({
        productId = testCase2ProductId,
        includeReferenceTables = false,
      }) =>
        `dashboard/tables/${productId}/dimensions?include_reference_tables=${includeReferenceTables}`,
    }),
    // Group Management
    testCase2saveGroupFilter: builder.mutation<any, {
      groupName: string;
      filteredSelections: Array<{
        dimension: string;
        members: (string | number)[];
      }>;
    }>({
      query: (body) => ({
        url: 'dashboard/group-filter',
        method: 'POST',
        body,
      }),
    }),
    // Drill Down
    fetchTestCase2DrillDownData: builder.mutation<ApiResponse, DrillDownParams>({
      query: ({
        productId = testCase2ProductId,
        chartType,
        category,
        dataType,
        drillDownLevel = "detailed",
        includeReferenceContext = true,
        excludeNullRevenue = false,
      }) => ({
        url: `dashboard/drill-down?product_id=${productId}&chart_type=${chartType}&category=${category}&data_type=${dataType}&drill_down_level=${drillDownLevel}&include_reference_context=${includeReferenceContext}&exclude_null_revenue=${excludeNullRevenue}`,
        method: "POST",
      }),
    }),

    fetchTestCase2TableData: builder.query<TableApiResponse, TableFetchParams>({
      query: ({
        productId = testCase2ProductId,
        limit = 100,
        offset = 0,
        search,
        column_filters,
        excludeNullRevenue = false,
        includeEnrichment = true,
      }) => {
        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        params.set("offset", offset.toString());
        params.set("exclude_null_revenue", excludeNullRevenue.toString());
        params.set("include_enrichment", includeEnrichment.toString());
        if (search) params.set("search", search);
        if (column_filters && Object.keys(column_filters).length > 0) {
          params.set("column_filters", JSON.stringify(column_filters));
        }
        return `data-products/data-products/${productId}/records?${params.toString()}`;
      },
    }),

    // Financial Data
    fetchFinancialDataTestCase2: builder.query<any, { productId?: string; year: string; month: string }>({
      query: ({ productId = testCase2ProductId, year, month }) =>
        `dashboard/financial-data/${productId}?year=${year}&month=${month}`,
    }),
    // Fetch Group Filter Datas
    fetchTestCase2groupFilters: builder.query<any, {}>({
      query: () => 'dashboard/group-filters',
    }),
    // Delete a Group Filter
    deleteTestCase2GroupFilter: builder.mutation<any, string>({
      query: (groupName) => ({
        url: `dashboard/group-filters/${groupName}`,
        method: 'DELETE',
      }),
    }),

    fetchTestCase2AvailableYears: builder.query<any, string>({
      query: (productId = testCase2ProductId) => `dashboard/available-years/${productId}`,
    }),

    // Comparing charts
    fetchTestCase2ComparisonData: builder.mutation<any, {
      productId?: string;
      chartType: string;
      year1: number;
      year2: number;
    }>({
      query: ({ productId = testCase2ProductId, chartType, year1, year2 }) => ({
        url: `dashboard/charts/compare?product_id=${productId}&chart_type=${chartType}&year1=${year1}&year2=${year2}`,
        method: 'POST',
      }),
    }),


  }),
});

export const {
  useFetchTestCase2ChartDataMutation,
  useFetchTestCase2DimensionsQuery,
  useTestCase2saveGroupFilterMutation,
  useFetchTestCase2DrillDownDataMutation,
  useFetchTestCase2TableDataQuery,
  useLazyFetchFinancialDataTestCase2Query,
  useFetchTestCase2groupFiltersQuery,
  useDeleteTestCase2GroupFilterMutation,
  useFetchTestCase2AvailableYearsQuery,

  // Comparing
  useFetchTestCase2ComparisonDataMutation

} = testCase2Api;