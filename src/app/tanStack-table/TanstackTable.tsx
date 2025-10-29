'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';

import { databaseName, useFetchSearchableDataQuery } from "@/lib/services/usersApi";
import { FinancialSchema } from '@/types/Schemas';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { testCase2ProductId, useFetchTestCase2TableDataQuery } from '@/lib/services/testCase2Api';

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { TanStackTableCaptureScreenshot } from "@/utils/utils";
import {
  Share,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  RefreshCw,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface FinancialRow extends FinancialSchema {
  id: string;
  // Test Case 2 specific fields
  countryName?: string | null;
  continentName?: string | null;
  accountTypeCode?: string | null;
  accountCategoryCode?: string | null;
  normalBalanceType?: string | null;
  level1DivisionName?: string | null;
  level2DepartmentName?: string | null;
  level3CategoryName?: string | null;
}

// Pagination Component
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 7; // Total number of page buttons to show

    if (totalPages <= showPages) {
      // Show all pages if total is less than showPages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-1">
      {/* First Page */}
      <button
        onClick={() => onPageChange(1)}
        disabled={disabled || currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="First Page"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Previous Page */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              disabled={disabled}
              className={`min-w-[40px] px-3 py-2 rounded-lg border transition-all ${currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40'
                }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Mobile: Current Page Display */}
      <div className="sm:hidden px-4 py-2 border border-gray-300 rounded-lg bg-white">
        <span className="text-sm font-medium">
          {currentPage} / {totalPages}
        </span>
      </div>

      {/* Next Page */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Last Page */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={disabled || currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Last Page"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function TanstackTable() {
  const tableRef = useRef<HTMLDivElement>(null);

  // State for filters and pagination
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);

  const isTestCase1 = testCase === "test-case-1";
  const isTestCase2 = testCase === "test-case-2";

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Editable cell state (demo only - no API)
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string; value: any } | null>(null);

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Prepare search parameters
  const searchParams = useMemo(() => {
    const columnFilters: Record<string, string | number> = {};

    if (filterCategory !== "All") {
      if (isTestCase1) {
        columnFilters.catfinancialview = filterCategory;
      } else {
        columnFilters.cat_financial_view = filterCategory;
      }
    }

    return {
      tableName: databaseName,
      search: debouncedSearch || undefined,
      column_filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    };
  }, [debouncedSearch, filterCategory, pagination.pageIndex, pagination.pageSize, isTestCase1]);


  // API queries
  const {
    data: data1,
    error: error1,
    isLoading: isLoading1,
    refetch: refetch1,
  } = useFetchSearchableDataQuery(searchParams);

  const {
    data: data2,
    error: error2,
    isLoading: isLoading2,
    refetch: refetch2,
  } = useFetchTestCase2TableDataQuery({
    productId: testCase2ProductId,
    limit: searchParams.limit,
    offset: searchParams.offset,
    search: searchParams.search || '',
    // @ts-ignore
    column_filters: searchParams.column_filters || {},
    excludeNullRevenue: false,
    includeEnrichment: true,
  }, {
    skip: !isTestCase2,
  });

  const searchData = isTestCase1 ? data1 : data2;
  const searchError = isTestCase1 ? error1 : error2;
  const isSearchLoading = isTestCase1 ? isLoading1 : isLoading2;
  const refetchData = isTestCase1 ? refetch1 : refetch2;

  // Transform API data for table
  const tableData = useMemo(() => {
    if (!searchData?.data) return [];

    const nodesWithIds = searchData.data.map((item: any, index: number) => ({
      id: `row-${index}-${pagination.pageIndex * pagination.pageSize}`,
      // Common fields with fallbacks for both test cases
      period: item.period || item.fiscal_period_code,
      fiscalYear: item.fiscalyear || item.fiscal_year_number,
      catFinancialView: item.catfinancialview || item.cat_financial_view,
      catAccountingView: item.cataccountingview || item.cat_accounting_view,
      netProfit: item.netprofit || item.net_profit_amount_usd,
      revenue: item.revenue || item.revenue_amount_usd,
      grossmargin: item.grossmargin || item.gross_margin_amount_usd,
      operatingexpenses: item.operatingexpenses || item.operating_expenses_amount_usd,
      operatingprofit: item.operatingprofit || item.operating_profit_amount_usd,
      earningsbeforetax: item.earningsbeforetax || item.earnings_before_tax_amount_usd,
      nonrecurringresult: item.nonrecurringresult || item.non_recurring_result_amount_usd,
      otherincome: item.otherincome || null,
      financialresult: item.financialresult || null,
      // Test Case 2 specific fields
      countryName: item.country_name || null,
      continentName: item.continent_name || null,
      accountTypeCode: item.account_type_code || null,
      accountCategoryCode: item.account_category_code || null,
      normalBalanceType: item.normal_balance_type || null,
      level1DivisionName: item.level_1_division_name || null,
      level2DepartmentName: item.level_2_department_name || null,
      level3CategoryName: item.level_3_category_name || null,
    }));

    return nodesWithIds;
  }, [searchData, pagination.pageIndex, pagination.pageSize]);


  // Get available categories from search info
  const categories = useMemo(() => {
    return ["Non opérationnel", "Financier", "Exceptionnel"];
  }, []);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, filterCategory]);

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Editable cell handlers (demo only - no API)
  const handleCellEdit = (rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId, value: currentValue });
  };

  const handleCellBlur = () => {
    if (editingCell) {
      // Show alert that cell was "edited" (demo only)
      alert('✓ Cell edited successfully! (Demo only - no data saved)');
      setEditingCell(null);
    }
  };

  const handleCellChange = (value: any) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value });
    }
  };

  // Helper to create editable number columns
  const createEditableNumberColumn = (
    accessorKey: keyof FinancialRow,
    header: string
  ): ColumnDef<FinancialRow> => ({
    accessorKey,
    header,
    cell: ({ row, getValue }) => {
      const value = getValue() as number;
      const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === accessorKey;

      if (isEditing) {
        return (
          <input
            type="number"
            value={editingCell.value || ''}
            onChange={(e) => handleCellChange(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellBlur();
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }

      return (
        <div
          onClick={() => handleCellEdit(row.original.id, accessorKey as string, value)}
          className={`font-medium text-right cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors ${value < 0 ? 'text-red-600' : 'text-gray-900'
            }`}
          title="Click to edit (demo only)"
        >
          {formatCurrency(value)}
        </div>
      );
    },
    size: 130,
  });

  // Helper to create editable text columns
  const createEditableTextColumn = (
    accessorKey: keyof FinancialRow,
    header: string
  ): ColumnDef<FinancialRow> => ({
    accessorKey,
    header,
    cell: ({ row, getValue }) => {
      const value = getValue() as string;
      const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === accessorKey;

      if (isEditing) {
        return (
          <input
            type="text"
            value={editingCell.value || ''}
            onChange={(e) => handleCellChange(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellBlur();
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }

      return (
        <div
          onClick={() => handleCellEdit(row.original.id, accessorKey as string, value)}
          className="text-gray-700 cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors"
          title="Click to edit (demo only)"
        >
          {value || '-'}
        </div>
      );
    },
    size: 150,
  });

  const columns: ColumnDef<FinancialRow>[] = useMemo(() => {
    const baseColumns: ColumnDef<FinancialRow>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ),
        size: 50,
      },
      {
        accessorKey: 'fiscalYear',
        header: 'Fiscal Year',
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
            {getValue() as string}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'period',
        header: 'Period',
        cell: ({ getValue }) => (
          <div className="text-gray-700">
            {getValue() as string}
          </div>
        ),
        size: 100,
      },
      createEditableTextColumn('catAccountingView', 'Accounting View'),
      createEditableTextColumn('catFinancialView', 'Financial View'),
      createEditableNumberColumn('revenue', 'Revenue'),
      createEditableNumberColumn('grossmargin', 'Gross Margin'),
      createEditableNumberColumn('operatingexpenses', 'Op. Expenses'),
      createEditableNumberColumn('operatingprofit', 'Op. Profit'),
      createEditableNumberColumn('earningsbeforetax', 'Earnings Before Tax'),
      createEditableNumberColumn('nonrecurringresult', 'Non-Recurring'),
      createEditableNumberColumn('netProfit', 'Net Profit'),
    ];

    // Add Test Case 1 specific columns
    if (isTestCase1) {
      baseColumns.splice(-1, 0,
        createEditableNumberColumn('otherincome', 'Other Income'),
        createEditableNumberColumn('financialresult', 'Financial Result')
      );
    }

    // Add Test Case 2 specific columns
    if (isTestCase2) {
      baseColumns.push(
        createEditableTextColumn('countryName', 'Country'),
        createEditableTextColumn('continentName', 'Continent')
      );
    }

    return baseColumns;
  }, [isTestCase1, isTestCase2, editingCell]);


  // Calculate pagination info - use filtered_rows for accurate pagination after filtering
  // @ts-ignore
  const filteredRows = isTestCase1 ? (searchData?.filtered_rows || 0) : (searchData?.pagination?.filtered_records || 0);
  // @ts-ignore
  const totalRows = isTestCase1 ? (searchData?.total_rows || 0) : (searchData?.pagination?.total_records || 0);
  // @ts-ignore
  const totalPages = Math.ceil(filteredRows / pagination.pageSize);


  // TanStack Table instance
  const table = useReactTable({
    data: tableData,
    // @ts-ignore
    columns,
    state: {
      sorting,
      rowSelection,
      columnOrder,
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true, // Server-side pagination
    manualSorting: false, // Client-side sorting for current page
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  // Initialize column order on first render
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  const handleShareTable = async () => {
    try {
      const imageData = await TanStackTableCaptureScreenshot(tableRef as React.RefObject<any>);
      handleOpenDrawer("Financial Data Table", imageData);
    } catch (error) {
      console.error('Failed to capture table:', error);
      alert('Failed to capture table screenshot. Please try again.');
    }
  };


  // Handle loading and error states
  if (isSearchLoading) {
    return <div className="p-4 text-center">Loading data...</div>;
  }

  if (searchError) {
    return (
      <div className="p-4 text-red-600">
        Error: {
          // @ts-ignore
          searchError?.error?.toString()}
        <button
          onClick={() => refetchData()}
          className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="tanstack-table w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Financial Data Table</h1>
          <p className="text-sm text-gray-600">
            TanStack Table with Server-Side Pagination •
            <span className="text-blue-600 font-medium"> Click cells to edit</span> •
            <span className="text-purple-600 font-medium"> Drag headers to reorder</span>
          </p>
        </div>
        <button
          onClick={handleShareTable}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium text-sm flex items-center gap-2"
        >
          <Share className="w-4 h-4" />
          Share Table
        </button>
      </div>

      {/* Controls Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search across all fields..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="min-w-[140px]">
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer"
              value={pagination.pageSize}
              onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchData()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 justify-center font-medium"
            disabled={isSearchLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isSearchLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Data Info Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm">
          {/* @ts-ignore */}
          {searchData?.search_applied && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Search className="w-4 h-4" />
              {/* @ts-ignore */}
              <span>Search: &quot;{searchData.search_term}&quot;</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium text-gray-900">{filteredRows.toLocaleString()}</span>
            <span>of</span>
            <span className="font-medium text-gray-900">{totalRows.toLocaleString()}</span>
            <span>records</span>
          </div>
          {Object.keys(rowSelection).length > 0 && (
            <div className="ml-auto px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
              {Object.keys(rowSelection).length} selected
            </div>
          )}
        </div>
      </div>

      {/* Table Card */}
      {tableData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-[100%] overflow-x-auto">
            <div ref={tableRef} className="overflow-x-auto max-w-full">
              <table className="w-auto ">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0 cursor-move"
                          draggable={!table.getState().columnSizingInfo.isResizingColumn}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('colId', header.column.id);
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.backgroundColor = '#e0f2fe';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.backgroundColor = '';
                            const draggedColId = e.dataTransfer.getData('colId');
                            const targetColId = header.column.id;

                            const newOrder = [...table.getState().columnOrder];
                            const fromIndex = newOrder.indexOf(draggedColId);
                            const toIndex = newOrder.indexOf(targetColId);

                            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                              newOrder.splice(fromIndex, 1);
                              newOrder.splice(toIndex, 0, draggedColId);
                              setColumnOrder(newOrder);
                            }
                          }}
                        >
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-2 cursor-pointer select-none hover:text-gray-900 transition-colors"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && <ArrowUp className="w-4 h-4" />}
                            {header.column.getIsSorted() === 'desc' && <ArrowDown className="w-4 h-4" />}
                            {!header.column.getIsSorted() && header.id !== 'select' && (
                              <ArrowUpDown className="w-4 h-4 opacity-30" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 ">
                  {table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50 transition-colors ${row.getIsSelected() ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100 last:border-r-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {pagination.pageIndex * pagination.pageSize + 1}
                  </span>
                  {' '}-{' '}
                  <span className="font-medium text-gray-900">
                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredRows)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-gray-900">{filteredRows.toLocaleString()}</span>
                  {' '}results
                </div>

                {/* Pagination Controls */}
                <div className="order-1 sm:order-2">
                  <PaginationControls
                    currentPage={pagination.pageIndex + 1}
                    totalPages={totalPages || 1}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
                    disabled={isSearchLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <EmailShareDrawer
        isOpen={emailDrawer.isOpen}
        onClose={handleCloseDrawer}
        chartTitle={emailDrawer.chartTitle}
        chartImage={emailDrawer.chartImage}
      />
    </section>
  );
}