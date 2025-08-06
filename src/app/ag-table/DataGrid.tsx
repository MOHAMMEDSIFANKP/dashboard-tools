// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
'use client';
import { AgGridReact } from 'ag-grid-react';

import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import { FinancialSchema } from "@/types/Schemas";
import { databaseName, useFetchSearchableDataQuery } from '@/lib/services/usersApi';
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { testCase2ProductId, useFetchTestCase2TableDataQuery } from '@/lib/services/testCase2Api';

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { AGGridCaptureScreenshot } from "@/utils/utils";
import { Share } from 'lucide-react';


const DataGrid = ({ }) => {
  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();

  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);


  const [searchParams, setSearchParams] = useState({
    tableName: databaseName,
    column_filters: {},
    limit: 10,
    offset: 0,
  });

  const gridRef = useRef<AgGridReact>(null);

  const isTestCase1 = testCase === "test-case-1";
  const isTestCase2 = testCase === "test-case-2";

  const {
    data: data1,
    error: error1,
    isLoading: isLoading1,
    refetch: refetch1,
  } = useFetchSearchableDataQuery(searchParams, {
    skip: !isTestCase1,
  });

  // Test Case 2 – Data Product table API
  const {
    data: data2,
    error: error2,
    isLoading: isLoading2,
    refetch: refetch2,
  } = useFetchTestCase2TableDataQuery({
    productId: testCase2ProductId,
    limit: searchParams.limit,
    offset: searchParams.offset,
    search: '',
    column_filters: searchParams.column_filters,
    excludeNullRevenue: false,
    includeEnrichment: true,
  }, {
    skip: !isTestCase2,
  });

  const data = isTestCase1 ? data1 : data2;
  const error = isTestCase1 ? error1 : error2;
  const isLoading = isTestCase1 ? isLoading1 : isLoading2;
  const refetchData = isTestCase1 ? refetch1 : refetch2;


  // const financialData = (data?.data ?? []) as FinancialSchema[];
  const financialData = ((data?.data ?? []) as FinancialSchema[]).map(row => ({ ...row }));
  // @ts-ignore
  const totalRows = isTestCase1 ? data?.total_rows : data?.pagination?.total_records ?? 0;
  // @ts-ignore
  const filteredRows = isTestCase1 ? data?.filtered_rows : data?.pagination?.filtered_records ?? 0;

  // Calculate pagination info
  const hasFilters = Object.keys(searchParams.column_filters).length > 0;
  const totalRecords = hasFilters ? filteredRows : totalRows;
  const currentPage = Math.floor(searchParams.offset / searchParams.limit) + 1;
  const totalPages = Math.ceil(totalRecords / searchParams.limit);
  const startRecord = searchParams.offset + 1;
  const endRecord = Math.min(searchParams.offset + searchParams.limit, totalRecords);

  // console.log(data?.total_rows, 'total_rows');

  const onFilterChanged = () => {
    if (!gridRef.current) return;

    const filterModel = gridRef.current.api.getFilterModel();
    const newSearchFilters: Record<string, string> = {};

    Object.entries(filterModel).forEach(([field, model]) => {
      if ('filter' in model && model.filter != null && model.filter !== '') {
        newSearchFilters[field] = String(model.filter);
      }
    });

    // Reset to first page when filters change
    setSearchParams((prev) => ({
      ...prev,
      column_filters: newSearchFilters,
      offset: 0
    }));
  };

  // Pagination handlers
  const handlePageSizeChange = (newPageSize: number) => {
    setSearchParams(prev => ({
      ...prev,
      limit: newPageSize,
      offset: 0 // Reset to first page
    }));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setSearchParams(prev => ({
        ...prev,
        offset: prev.offset - prev.limit
      }));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setSearchParams(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const handleFirstPage = () => {
    setSearchParams(prev => ({
      ...prev,
      offset: 0
    }));
  };

  const handleLastPage = () => {
    const lastPageOffset = (totalPages - 1) * searchParams.limit;
    setSearchParams(prev => ({
      ...prev,
      offset: lastPageOffset
    }));
  };

  const columnDefsTestCase1: ColDef[] = [
    {
      field: 'fiscalyear',
      headerName: 'Fiscal Year',
      sortable: true,
      editable: false,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'period',
      headerName: 'Period',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'cataccountingview',
      headerName: 'Cat Accounting View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'catfinancialview',
      headerName: 'Cat Financial View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'otherincome',
      headerName: 'Other Income',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'grossmargin',
      headerName: 'Gross Margin',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'operatingexpenses',
      headerName: 'Operating Expenses',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'operatingprofit',
      headerName: 'Operating Profit',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'financialresult',
      headerName: 'Financial Result',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'earningsbeforetax',
      headerName: 'Earnings Before Tax',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'nonrecurringresult',
      headerName: 'Non-Recurring Result',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'netprofit',
      headerName: 'Net Profit',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
  ];

  const columnDefsTestCase2: ColDef[] = [
    {
      field: 'fiscal_year_number',
      headerName: 'Fiscal Year',
      sortable: true,
      editable: false,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'fiscal_period_code',
      headerName: 'Period',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'cat_accounting_view',
      headerName: 'Cat Accounting View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'cat_financial_view',
      headerName: 'Cat Financial View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'revenue_amount_usd',
      headerName: 'Revenue',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'gross_margin_amount_usd',
      headerName: 'Gross Margin',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'operating_expenses_amount_usd',
      headerName: 'Operating Expenses',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'operating_profit',
      headerName: 'Operating Profit',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'earnings_before_tax',
      headerName: 'Earnings Before Tax',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'non_recurring_result',
      headerName: 'Non-Recurring Result',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'net_profit_amount_usd',
      headerName: 'Net Profit',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'country_name',
      headerName: 'Country Name',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'continent_name',
      headerName: 'Continent Name',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'account_type_code',
      headerName: 'Account Type Code',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'account_category_code',
      headerName: 'Account Category Code',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'normal_balance_type',
      headerName: 'Normal Balance Type',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'level_1_division_name',
      headerName: 'level_1_division_name',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'level_2_department_name',
      headerName: 'level_2_department_name',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
    {
      field: 'level_3_category_name',
      headerName: 'level_3_category_name',
      sortable: true,
      editable: true,
      floatingFilter: true,
      valueParser: (params) => String(params.newValue)
    },
  ];

  const columnDefs = isTestCase1 ? columnDefsTestCase1 : columnDefsTestCase2;

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    filter: true,
    sortable: true,
    filterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true
    }
  };

  const onCellValueChanged = (params: CellValueChangedEvent) => {
    console.log('Cell value changed:', params);
  };

  const handleShareGrid = async () => {
    if (!gridRef.current) {
      console.error('Grid reference not available');
      return;
    }

    try {
      const imageData = await AGGridCaptureScreenshot(gridRef as React.RefObject<any>);
      handleOpenDrawer("Financial Data - AG Grid", imageData);
    } catch (error) {
      console.error('Failed to capture grid:', error);
      // Add user-friendly error handling
      alert('Failed to capture grid screenshot. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-4">
        <h1 className="text-xl font-bold mb-4">Financial Data - AG Grid</h1>
        <div className="text-center p-8">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <h1 className="text-xl font-bold mb-4">Financial Data - AG Grid</h1>
        <div className="text-red-600 p-4">

          Error: {
            // @ts-ignore
            error?.error || 'Failed to fetch data.'}
          <button
            onClick={() => refetchData()}
            className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold mb-4">Financial Data - Ag Table</h1>
        <button
          onClick={handleShareGrid}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-purple-200 transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm flex items-center gap-2"
        >
          <Share className="w-4 h-4" />
          Share Grid
        </button>
      </div>
      {/* Pagination Info */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {startRecord.toLocaleString()} to {endRecord.toLocaleString()} of {totalRecords.toLocaleString()} records
          {hasFilters && (
            <span className="ml-2 text-blue-600">
              (filtered from {totalRows.toLocaleString()} total)
            </span>
          )}
        </div>

        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={searchParams.limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={financialData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          pagination={false} // Disable AG Grid's built-in pagination
          rowSelection="multiple"
          animateRows={true}
          ref={gridRef}
          onFilterChanged={onFilterChanged}
        />
      </div>

      {/* Custom Pagination Controls */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          {/* First Page */}
          <button
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            First
          </button>

          {/* Previous Page */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              const isCurrentPage = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    const newOffset = (pageNum - 1) * searchParams.limit;
                    setSearchParams(prev => ({ ...prev, offset: newOffset }));
                  }}
                  className={`px-3 py-1 border rounded text-sm ${isCurrentPage
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>

          {/* Last Page */}
          <button
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last
          </button>
        </div>
      </div>
      <EmailShareDrawer
        isOpen={emailDrawer.isOpen}
        onClose={handleCloseDrawer}
        chartTitle={emailDrawer.chartTitle}
        chartImage={emailDrawer.chartImage}
      />
    </div>
  );
};

export default DataGrid;