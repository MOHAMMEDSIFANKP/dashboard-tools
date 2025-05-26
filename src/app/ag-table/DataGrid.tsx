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

const DataGrid = ({ }) => {
  const [searchParams, setSearchParams] = useState({
    tableName: databaseName,
    column_filters: {},
    limit: 10,
    offset: 0,
  });

  const gridRef = useRef<AgGridReact>(null);

  const {
    data,
    error,
    isLoading,
    refetch: refetchData,
  } = useFetchSearchableDataQuery(searchParams);

  const financialData = (data?.data ?? []) as FinancialSchema[];
  const totalRows = data?.total_rows ?? 0;
  const filteredRows = data?.filtered_rows ?? 0;
  
  // Calculate pagination info
  const hasFilters = Object.keys(searchParams.column_filters).length > 0;
  const totalRecords = hasFilters ? filteredRows : totalRows;
  const currentPage = Math.floor(searchParams.offset / searchParams.limit) + 1;
  const totalPages = Math.ceil(totalRecords / searchParams.limit);
  const startRecord = searchParams.offset + 1;
  const endRecord = Math.min(searchParams.offset + searchParams.limit, totalRecords);

  console.log(data?.total_rows, 'total_rows');

  const onFilterChanged = () => {
    if (!gridRef.current) return;

    const filterModel = gridRef.current.api.getFilterModel();
    const newSearchFilters: Record<string, string> = {};

    Object.entries(filterModel).forEach(([field, model]) => {
      if ('filter' in model) {
        newSearchFilters[field] = model.filter as string;
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

  const columnDefs: ColDef[] = [
    {
      field: 'fiscalyear',
      headerName: 'Fiscal Year',
      sortable: true,
      editable: false,
      floatingFilter: true
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
      floatingFilter: true
    },
    {
      field: 'otherincome',
      headerName: 'Other Income',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'grossmargin',
      headerName: 'Gross Margin',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'operatingexpenses',
      headerName: 'Operating Expenses',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'operatingprofit',
      headerName: 'Operating Profit',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'financialresult',
      headerName: 'Financial Result',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'earningsbeforetax',
      headerName: 'Earnings Before Tax',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'nonrecurringresult',
      headerName: 'Non-Recurring Result',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'netprofit',
      headerName: 'Net Profit',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
  ];

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
      <h1 className="text-xl font-bold mb-4">Financial Data - Ag Table</h1>
      
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
                  className={`px-3 py-1 border rounded text-sm ${
                    isCurrentPage
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
    </div>
  );
};

export default DataGrid;