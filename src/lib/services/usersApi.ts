import { ApiResponse, Post } from "@/types/Schemas";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const databaseName = "sample_1m";

// Chart request body interfaces
interface ChartRequestBody {
  chartType: string;
  dimensions?: {
    groupName?: string;
    filteredSelections?: Array<{
      dimension: string;
      members: (string | number)[];
    }>;
  };
  limit?: number;
  groupBy?: string;
}

interface DrillDownParams {
  table_name: string;
  chart_type: string;
  category: string;
  data_type: string;
  value?: string | number;
}

interface SearchInfoResponse {
  table_name: string;
  columns: Array<{
    name: string;
    data_type: string;
    search_type: string;
    searchable: boolean;
    supports_partial_match?: boolean;
    supports_range_search?: boolean;
    range_format?: string;
  }>;
  global_search_columns: string[];
}
interface SearchParams {
  tableName?: string;
  search?: string;
  column_filters?: Record<string, string | number>;
  limit?: number;
  offset?: number;
}

interface SearchDataResponse {
  table_name: string;
  total_rows: number;
  filtered_rows: number;
  returned_rows: number;
  limit: number;
  offset: number;
  search_applied: boolean;
  search_term: string | null;
  column_filters: Record<string, any>;
  data: any[];
}


export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://testcase.mohammedsifankp.online/api/',
  }),
  endpoints: (builder) => ({
     // Table API Endpoints
    fetchSearchableData: builder.query<SearchDataResponse, SearchParams>({
      query: ({ tableName = databaseName, search, column_filters, limit = 100, offset = 0 }) => {
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (column_filters && Object.keys(column_filters).length > 0) {
          params.append('column_filters', JSON.stringify(column_filters));
        }        
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        return `duckdb/tables/${tableName}/data?${params.toString()}`;
      },
    }),

    fetchSearchInfo: builder.query<SearchInfoResponse, { tableName?: string }>({
      query: ({ tableName = databaseName }) => `duckdb/tables/${tableName}/search-info`,
    }),

    // Dashboard Dimensions
    fetchDimensionsData: builder.query<any, { tableName?: string; dimensions?: string }>({
      query: ({ tableName = databaseName, dimensions }) => {
        const params = dimensions ? `?dimensions=${dimensions}` : '';
        return `dashboard/tables/${tableName}/dimensions${params}`;
      },
    }),
    
    fetchAvailableYears: builder.query<any, string>({
      query: (tableName = databaseName) => `dashboard/available-years/${tableName}`,
    }),

    // Chart Data Endpoints
    fetchChartData: builder.mutation<ApiResponse, { tableName?: string; body: ChartRequestBody }>({
      query: ({ tableName = databaseName, body }) => ({
        url: `dashboard/all-charts?table_name=${tableName}`,
        method: 'POST',
        body,
      }),
    }),

    // Drill Down
    fetchDrillDownData: builder.mutation<any, DrillDownParams>({
      query: ({ table_name, chart_type, category, data_type, value }) => {
        const params = new URLSearchParams({
          table_name,
          chart_type,
          category,
          data_type,
        });
        if (value !== undefined) {
          params.append('value', String(value));
        }
        return {
          url: `dashboard/drill-down?${params.toString()}`,
          method: 'POST',
        };
      },
    }),

    // Financial Data
    fetchFinancialData: builder.query<any, { tableName?: string; year: string; month: string }>({
      query: ({ tableName = databaseName, year, month }) => 
        `dashboard/financial-data/${tableName}?year=${year}&month=${month}`,
    }),

    // Group Management
    saveGroupFilter: builder.mutation<any, {
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
     // Fetch Group Filter Datas
    fetchGroupFilters: builder.query<any, {}>({
      query: () => 'dashboard/group-filters',
    }),
    // Delete a Group Filter
    deleteGroupFilter: builder.mutation<any, string>({
      query: (groupName) => ({
        url: `dashboard/group-filters/${groupName}`,
        method: 'DELETE',
      }),
    }),

    // File Upload
    uploadFile: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: 'upload/',
        method: 'POST',
        body: formData,
      }),
    }),
    
    triggerAnalytics: builder.mutation<any, string>({
      query: (tableName) => ({
        url: `upload/trigger-analytics?table_name=${tableName}`,
        method: 'POST',
      }),
    }),
    
    fetchPerformanceHistory: builder.query<any, void>({
      query: () => 'performance/history',
    }),
  }),
});

export const { 
  // Table queries
  useFetchSearchableDataQuery,
  useLazyFetchSearchableDataQuery,
  useFetchSearchInfoQuery,
  
  // Dashboard queries
  useFetchDimensionsDataQuery,
  useFetchAvailableYearsQuery,
  useLazyFetchDimensionsDataQuery,
  
  // Chart mutations
  useFetchChartDataMutation,
  
  // Drill down
  useFetchDrillDownDataMutation,
  
  // Financial data
  useFetchFinancialDataQuery,
  useLazyFetchFinancialDataQuery,
  
  // Group management
  useSaveGroupFilterMutation,
  useFetchGroupFiltersQuery,
  useDeleteGroupFilterMutation,
  
  // File operations
  useUploadFileMutation,
  useTriggerAnalyticsMutation,
  
  useFetchPerformanceHistoryQuery,
} = api;

export const sapi = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({baseUrl: 'https://jsonplaceholder.typicode.com/'}),
    endpoints: (builder) => ({
        // Fetch list of posts
        getPosts: builder.query<Post[], void>({
            query: () => "posts",
          }),
        // Fetch single post by ID
        getPostById: builder.query<Post, number>({
            query: (id) => `posts/${id}`,
        }),
        createPost: builder.mutation<Post, Partial<Post>>({
            query: (newPost) => ({
                url: 'posts',
                method: 'POST',
                body: newPost,
            }),
        }),
    }),
    // overrideExisting: false,
})

export const {
    useGetPostsQuery,
    useGetPostByIdQuery,
    useCreatePostMutation,
} = sapi