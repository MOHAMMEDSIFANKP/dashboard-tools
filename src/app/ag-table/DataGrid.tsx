'use client';
import { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ChevronRight, Home, Globe, MapPin, Building2, Share, Loader2 } from 'lucide-react';
import { useLazyFetchTestCase2HierarchicalDataQuery } from "@/lib/services/testCase2Api";
import { databaseName, useLazyFetchHierarchicalDataDataQuery } from "@/lib/services/usersApi";
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { AGGridCaptureScreenshot } from "@/utils/utils";

ModuleRegistry.registerModules([AllCommunityModule]);

// Types
interface DrillDownState {
  level: 'continent' | 'country' | 'state' | 'detail';
  continent?: string;
  country?: string;
  state?: string;
}

interface SearchParams {
  limit: number;
  offset: number;
  column_filters: Record<string, string>;
}

const HierarchicalDataGrid = () => {
  const gridRef = useRef<AgGridReact>(null);
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);
  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();

  const [drillDownState, setDrillDownState] = useState<DrillDownState>({
    level: 'continent'
  });

  const [searchParams, setSearchParams] = useState<SearchParams>({
    limit: 20,
    offset: 0,
    column_filters: {}
  });

  // Conditional hooks based on test case
  const [fetchDataTestCase1, { data: queryResult1, isLoading: isLoading1, error: error1 }] = useLazyFetchHierarchicalDataDataQuery();
  const [fetchDataTestCase2, { data: queryResult2, isLoading: isLoading2, error: error2 }] = useLazyFetchTestCase2HierarchicalDataQuery();

  // Use the appropriate result based on test case
  const queryResult = testCase === 'test-case-1' ? queryResult1 : queryResult2;
  const isLoading = testCase === 'test-case-1' ? isLoading1 : isLoading2;
  const error = testCase === 'test-case-1' ? error1 : error2;
  const fetchData = testCase === 'test-case-1' ? fetchDataTestCase1 : fetchDataTestCase2;

  const data = queryResult?.data || [];
  const totalRecords = queryResult?.total_rows || 0;

  // Add useEffect to trigger the lazy query
  useEffect(() => {
    if (testCase === 'test-case-1') {
      fetchDataTestCase1({
        tableName: databaseName,
        continent: drillDownState.continent,
        country: drillDownState.country,
        state: drillDownState.state,
        column_filters: searchParams.column_filters,
        limit: searchParams.limit,
        offset: searchParams.offset,
      });
    } else if (testCase === 'test-case-2') {
      fetchDataTestCase2({
        continent: drillDownState.continent,
        country: drillDownState.country,
        state: drillDownState.state,
        column_filters: searchParams.column_filters,
        limit: searchParams.limit,
        offset: searchParams.offset,
      });
    }
  }, [drillDownState, searchParams, testCase, fetchDataTestCase1, fetchDataTestCase2]);

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

  // Pagination calculations
  const currentPage = Math.floor(searchParams.offset / searchParams.limit) + 1;
  const totalPages = Math.ceil(totalRecords / searchParams.limit);
  const startRecord = totalRecords > 0 ? searchParams.offset + 1 : 0;
  const endRecord = Math.min(searchParams.offset + searchParams.limit, totalRecords);

  // Handle drill-down click
  const handleDrillDown = (field: string, value: string) => {
    if (drillDownState.level === 'continent') {
      setDrillDownState({
        level: 'country',
        continent: value
      });
    } else if (drillDownState.level === 'country') {
      setDrillDownState({
        ...drillDownState,
        level: 'state',
        country: value
      });
    } else if (drillDownState.level === 'state') {
      setDrillDownState({
        ...drillDownState,
        level: 'detail',
        state: value
      });
    }

    // Reset pagination
    setSearchParams(prev => ({ ...prev, offset: 0 }));
  };

  // Breadcrumb navigation
  const handleBreadcrumbClick = (level: 'home' | 'continent' | 'country') => {
    if (level === 'home') {
      setDrillDownState({ level: 'continent' });
    } else if (level === 'continent') {
      setDrillDownState({
        level: 'country',
        continent: drillDownState.continent
      });
    } else if (level === 'country') {
      setDrillDownState({
        level: 'state',
        continent: drillDownState.continent,
        country: drillDownState.country
      });
    }
    setSearchParams(prev => ({ ...prev, offset: 0 }));
  };

  // Format currency
  const formatCurrency = (value: any) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Dynamic column definitions
  const getColumnDefs = (): ColDef[] => {
    let dimensionColumn: ColDef;

    if (drillDownState.level === 'continent') {
      dimensionColumn = {
        field: `${testCase === 'test-case-1' ? 'continent' : 'continent_name'}`,
        headerName: 'Continent',
        pinned: 'left',
        width: 200,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 font-medium">
            <Globe className="w-4 h-4" />
            <span>{params.value}</span>
          </div>
        ),
        onCellClicked: (params) => handleDrillDown('continent', params.value)
      };
    } else if (drillDownState.level === 'country') {
      dimensionColumn = {
        field: `${testCase === 'test-case-1' ? 'country' : 'country_name'}`,
        headerName: 'Country',
        pinned: 'left',
        width: 200,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 font-medium">
            <MapPin className="w-4 h-4" />
            <span>{params.value}</span>
          </div>
        ),
        onCellClicked: (params) => handleDrillDown('country', params.value)
      };
    } else if (drillDownState.level === 'state') {
      dimensionColumn = {
        field: `${testCase === 'test-case-1' ? 'state' : 'state_name'}`,
        headerName: 'State',
        pinned: 'left',
        width: 200,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 font-medium">
            <Building2 className="w-4 h-4" />
            <span>{params.value}</span>
          </div>
        ),
        // onCellClicked: (params) => handleDrillDown('state', params.value)
      };
    } else {
      dimensionColumn = {
        field: 'id',
        headerName: 'ID',
        pinned: 'left',
        width: 100
      };
    }

    const metricColumns: ColDef[] = [
      {
        field: `${testCase === 'test-case-1' ? 'revenue' : 'revenue_amount_usd'}`,
        headerName: 'Revenue',
        filter: false,
        width: 150,
        valueFormatter: (params) => formatCurrency(params.value),
        cellClass: 'font-semibold'
      },
      {
        field: `${testCase === 'test-case-1' ? 'otherincome' : 'other_income_amount_usd'}`,
        headerName: 'Other Income',
        filter: false,
        width: 150,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'grossmargin' : 'gross_margin_amount_usd'}`,
        headerName: 'Gross Margin',
        filter: false,
        width: 150,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'operatingexpenses' : 'operating_expense_amount_usd'}`,
        headerName: 'Operating Expenses',
        filter: false,
        width: 180,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'operatingprofit' : 'operating_profit_amount_usd'}`,
        headerName: 'Operating Profit',
        filter: false,
        width: 160,
        valueFormatter: (params) => formatCurrency(params.value),
        cellClass: 'font-semibold'
      },
      {
        field: `${testCase === 'test-case-1' ? 'financialresult' : 'financial_result_amount_usd'}`,
        headerName: 'Financial Result',
        filter: false,
        width: 160,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'earningsbeforetax' : 'earnings_before_tax_amount_usd'}`,
        headerName: 'Earnings Before Tax',
        filter: false,
        width: 180,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'nonrecurringresult' : 'non_recurring_result_amount_usd'}`,
        headerName: 'Non-Recurring',
        filter: false,
        width: 150,
        valueFormatter: (params) => formatCurrency(params.value)
      },
      {
        field: `${testCase === 'test-case-1' ? 'netprofit' : 'net_profit_amount_usd'}`,
        headerName: 'Net Profit',
        filter: false,
        width: 150,
        valueFormatter: (params) => formatCurrency(params.value),
        cellClass: 'font-bold text-green-600'
      }
    ];

    return [dimensionColumn, ...metricColumns];
  };

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true
  };

  // Filter change handler
  const onFilterChanged = () => {
    if (!gridRef.current) return;

    const filterModel = gridRef.current.api.getFilterModel();
    const newFilters: Record<string, string> = {};

    Object.entries(filterModel).forEach(([field, model]) => {
      if ('filter' in model && model.filter != null && model.filter !== '') {
        newFilters[field] = String(model.filter);
      }
    });

    setSearchParams(prev => ({
      ...prev,
      column_filters: newFilters,
      offset: 0
    }));
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * searchParams.limit;
    setSearchParams(prev => ({ ...prev, offset: newOffset }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams({ limit: newSize, offset: 0, column_filters: {} });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1600px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Financial Analytics Dashboard</h1>
            <button onClick={handleShareGrid} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all">
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleBreadcrumbClick('home')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">All Continents</span>
            </button>

            {drillDownState.continent && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick('continent')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">{drillDownState.continent}</span>
                </button>
              </>
            )}

            {drillDownState.country && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick('country')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{drillDownState.country}</span>
                </button>
              </>
            )}

            {drillDownState.state && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{drillDownState.state}</span>
                </div>
              </>
            )}
          </div>

          {/* Level Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Current View:</span>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-full">
              {drillDownState.level === 'continent' && '📊 Continental Overview'}
              {drillDownState.level === 'country' && '🌍 Country Analysis'}
              {drillDownState.level === 'state' && '📍 State Breakdown'}
              {drillDownState.level === 'detail' && '📋 Detailed Records'}
            </span>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startRecord}</span> to{' '}
              <span className="font-semibold text-gray-900">{endRecord}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalRecords.toLocaleString()}</span> records
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={searchParams.limit}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-medium">Loading data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="text-red-500 text-lg">⚠️ Error loading data</div>
              <p className="text-gray-600">{(error as any)?.data?.detail?.toString() || (error as any)?.error?.toString()}</p>
              <button
                onClick={() => setSearchParams(prev => ({ ...prev }))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="ag-theme-alpine rounded-lg overflow-hidden border border-gray-200" >
              <AgGridReact
                ref={gridRef}
                rowData={data}
                columnDefs={getColumnDefs()}
                defaultColDef={defaultColDef}
                animateRows={true}
                rowSelection="multiple"
                pagination={false}
                onFilterChanged={onFilterChanged}
                domLayout="autoHeight"
              />
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
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

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${pageNum === currentPage
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Last
              </button>
            </div>
          </div>
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

export default HierarchicalDataGrid;