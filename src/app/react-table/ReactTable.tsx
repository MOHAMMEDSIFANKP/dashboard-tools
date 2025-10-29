"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { useSort } from "@table-library/react-table-library/sort";
import { TableNode } from "@table-library/react-table-library/types/table";
import { Action } from "@table-library/react-table-library/types/common";
import { databaseName, useFetchSearchableDataQuery, useFetchSearchInfoQuery } from "@/lib/services/usersApi";
import { FinancialSchema } from "@/types/Schemas";
import { testCase2ProductId, useFetchTestCase2TableDataQuery } from "@/lib/services/testCase2Api";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { ReactTableCaptureScreenshot } from "@/utils/utils";
import {
  Share,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search as SearchIcon,
  RefreshCw,
  Filter,
} from 'lucide-react';

// Pagination Component (same as TanStack)
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
    const showPages = 7;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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
      <button
        onClick={() => onPageChange(1)}
        disabled={disabled || currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="First Page"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Previous Page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

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

      <div className="sm:hidden px-4 py-2 border border-gray-300 rounded-lg bg-white">
        <span className="text-sm font-medium">
          {currentPage} / {totalPages}
        </span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Next Page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

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

interface FinancialRow extends FinancialSchema {
  id: string;
}

interface EditableCell {
  id: string;
  field: keyof FinancialRow;
  value: any;
}

export default function ReactTable() {
  // State for filters and pagination
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const tableRef = useRef<HTMLDivElement>(null);

  // Selection and editing state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, Partial<FinancialRow>>>(new Map());

  const { emailDrawer, handleOpenDrawer, handleCloseDrawer } = useEmailShareDrawer();
  const testCase = useSelector((state: RootState) => state.dashboard.selectedTestCase);
  const isTestCase1 = testCase === "test-case-1";
  const isTestCase2 = testCase === "test-case-2";

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
      limit: pageSize,
      offset: currentPage * pageSize,
    };
  }, [debouncedSearch, filterCategory, currentPage, pageSize]);

  // API queries
  const {
    data: data1,
    error: error1,
    isLoading: isLoading1,
    refetch: refetch1,
  } = useFetchSearchableDataQuery(searchParams, {
    skip: !isTestCase1,
  });

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
    // @ts-ignore
    column_filters: searchParams.column_filters,
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
    if (!searchData?.data) return { nodes: [] };

    const nodesWithIds = searchData.data.map((item: any, index: number) => ({
      ...item,
      id: `row-${index}-${currentPage * pageSize}`,
      // Map API field names to component field names if needed
      period: item.period || item.fiscal_period_code,
      fiscalYear: item.fiscalyear || item.fiscal_year_number,
      revenue: item.revenue || item.revenue_amount_usd,
      catFinancialView: item.catfinancialview || item.cat_financial_view,
      catAccountingView: item.cataccountingview || item.cat_accounting_view,
      netProfit: item.netprofit || item.net_profit_amount_usd,
    }));

    return { nodes: nodesWithIds };
  }, [searchData, currentPage, pageSize]);

  // Get available categories from search info
  const categories = useMemo(() => {
    return ["Non opérationnel", "Financier", "Exceptionnel"];
  }, []);

  // Apply theme
  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: 60px 15% 20% 10% 20% 20%;
        background-color: white;
        border-radius: 0;
      `,
      Header: `
        background: linear-gradient(to right, #f8fafc, #f1f5f9);
        border-bottom: 1px solid #e5e7eb;
        
        .th {
          padding: 16px 24px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-right: 1px solid #e5e7eb;
        }
      `,
      Row: `
        background-color: white;
        border-bottom: 1px solid #f3f4f6;
        transition: background-color 0.2s;
        
        &:nth-of-type(even) {
          background-color: #f9fafb;
        }
        
        &:hover {
          background-color: #dbeafe !important;
        }
        
        &.selected {
          background-color: #dbeafe !important;
        }
        
        .td {
          padding: 16px 24px;
          font-size: 14px;
          border-right: 1px solid #f3f4f6;
        }
      `,
      Cell: `
        &.editing {
          background-color: #fef3c7;
          border: 2px solid #fbbf24;
        }
      `,
    },
  ]);

  // Row selection is handled manually via checkboxes in the columns

  // Sorting
  const sort = useSort<TableNode>(
    tableData,
    {
      onChange: (action: Action, state: { sortKey?: string }) => {
        console.log("Sort changed:", action, state);
        // Note: For server-side sorting, you'd need to update your API call here
      },
    },
    {
      sortFns: {
        fiscalYear: (array) => array.sort((a, b) => a.fiscalYear - b.fiscalYear),
        catFinancialView: (array) =>
          array.sort((a, b) => a.catFinancialView.localeCompare(b.catFinancialView)),
        period: (array) => array.sort((a, b) => a.period - b.period),
        revenue: (array) => array.sort((a, b) => a.revenue - b.revenue),
        netProfit: (array) => array.sort((a, b) => a.netProfit - b.netProfit),
      },
    }
  );

  // Cell editing handlers
  const handleCellClick = (item: FinancialRow, field: keyof FinancialRow) => {
    const editableFields = ['catFinancialView', 'revenue', 'netProfit'];
    if (editableFields.includes(field as string)) {
      setEditingCell({ id: item.id, field, value: item[field] });
    }
  };

  const handleCellChange = (value: any) => {
    if (editingCell) {
      setUnsavedChanges(prev => {
        const newMap = new Map(prev);
        const currentChanges = newMap.get(editingCell.id) || {};
        newMap.set(editingCell.id, { ...currentChanges, [editingCell.field]: value });
        return newMap;
      });
      setEditingCell({ ...editingCell, value });
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      alert('✓ Cell edited successfully! (Demo only - no data saved)');
      setEditingCell(null);
    }
  };

  // Update functions
  const handleSaveChanges = async () => {
    alert('✓ All changes saved! (Demo only - no data saved to server)');
    setUnsavedChanges(new Map());
  };

  const handleDiscardChanges = () => {
    setUnsavedChanges(new Map());
    setEditingCell(null);
  };

  // Get current value for a cell (either edited or original)
  const getCellValue = (item: FinancialRow, field: keyof FinancialRow) => {
    const changes = unsavedChanges.get(item.id);
    return changes?.[field] !== undefined ? changes[field] : item[field];
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage - 1); // Convert to 0-based index
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(0);
    setSelectedRows([]); // Clear selection on filter change
  }, [debouncedSearch, filterCategory]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedRows([]);
  }, [currentPage]);

  // Select All handler
  const handleSelectAll = () => {
    if (selectedRows.length === tableData.nodes.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tableData.nodes.map((node: FinancialRow) => node.id));
    }
  };

  // Column definitions
  const COLUMNS = [
    {
      label: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={tableData.nodes.length > 0 && selectedRows.length === tableData.nodes.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      ),
      renderCell: (item: FinancialRow) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedRows.includes(item.id)}
            onChange={() => {
              setSelectedRows((prev) =>
                prev.includes(item.id)
                  ? prev.filter((id) => id !== item.id)
                  : [...prev, item.id]
              );
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      ),
      pinLeft: true,
    },
    {
      label: "Fiscal Year",
      renderCell: (item: FinancialRow) => (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
          {item.fiscalYear}
        </div>
      ),
      sort: { sortKey: "fiscalYear" },
    },
    {
      label: "Category View",
      renderCell: (item: FinancialRow) => {
        const isEditing = editingCell?.id === item.id && editingCell?.field === 'catFinancialView';
        const isChanged = unsavedChanges.get(item.id)?.catFinancialView !== undefined;
        const value = getCellValue(item, 'catFinancialView');

        if (isEditing) {
          return (
            <input
              type="text"
              value={editingCell.value}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellBlur();
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          );
        }

        return (
          <div
            className={`cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
            onClick={() => handleCellClick(item, 'catFinancialView')}
            title="Click to edit (demo only)"
          >
            {value}
          </div>
        );
      },
      sort: { sortKey: "catFinancialView" },
    },
    {
      label: "Period",
      renderCell: (item: FinancialRow) => (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
          {item.period}
        </div>
      ),
      sort: { sortKey: "period" },
    },
    {
      label: "Revenue",
      renderCell: (item: FinancialRow) => {
        const isEditing = editingCell?.id === item.id && editingCell?.field === 'revenue';
        const isChanged = unsavedChanges.get(item.id)?.revenue !== undefined;
        const value = getCellValue(item, 'revenue');

        if (isEditing) {
          return (
            <input
              type="number"
              value={editingCell.value}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellBlur();
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          );
        }

        const numValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
        const formatted = typeof numValue === 'number'
          ? numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
          : value;

        return (
          <div
            className={`cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors text-right ${isChanged ? 'bg-yellow-50 font-semibold' : ''} ${typeof numValue === 'number' && numValue < 0 ? 'text-red-600' : 'text-gray-900'}`}
            onClick={() => handleCellClick(item, 'revenue')}
            title="Click to edit (demo only)"
          >
            <span className="font-medium">{formatted}</span>
          </div>
        );
      },
      sort: { sortKey: "revenue" },
    },
    {
      label: "Net Profit",
      renderCell: (item: FinancialRow) => {
        const isEditing = editingCell?.id === item.id && editingCell?.field === 'netProfit';
        const isChanged = unsavedChanges.get(item.id)?.netProfit !== undefined;
        const value = getCellValue(item, 'netProfit');

        if (isEditing) {
          return (
            <input
              type="number"
              value={editingCell.value}
              onChange={(e) => handleCellChange(e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellBlur();
                if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          );
        }

        const numValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
        const formatted = typeof numValue === 'number'
          ? numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
          : value;

        return (
          <div
            className={`cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors text-right ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
            onClick={() => handleCellClick(item, 'netProfit')}
            title="Click to edit (demo only)"
          >
            <span className={`font-medium ${Number(numValue) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatted}
            </span>
          </div>
        );
      },
      sort: { sortKey: "netProfit" },
    },
  ];

  // Calculate pagination info - use filtered_rows for accurate pagination after filtering
  // @ts-ignore
  const filteredRows = isTestCase1 ? (searchData?.filtered_rows || 0) : (searchData?.pagination?.filtered_records || 0);
  // @ts-ignore
  const totalRows = isTestCase1 ? (searchData?.total_rows || 0) : (searchData?.pagination?.total_records || 0);
  // @ts-ignore
  const totalPages = Math.ceil(filteredRows / pageSize);

  const handleShareTable = async () => {
    try {
      const imageData = await ReactTableCaptureScreenshot(tableRef as React.RefObject<any>);
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
    <section className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">React Table Library</h1>
          <p className="text-sm text-gray-600">
            Server-Side Pagination with Modern Design •
            <span className="text-blue-600 font-medium"> Click cells to edit (Demo)</span>
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
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
              <SearchIcon className="w-4 h-4" />
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
          {selectedRows.length > 0 && (
            <div className="ml-auto px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
              {selectedRows.length} selected
            </div>
          )}
          {unsavedChanges.size > 0 && (
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium"
              >
                Save ({unsavedChanges.size})
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all font-medium"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Card */}
      {tableData.nodes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <SearchIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-[100%] overflow-x-auto">
            <div ref={tableRef} className="overflow-x-auto max-w-full">
              <CompactTable
                columns={COLUMNS}
                data={tableData}
                theme={theme}
                sort={sort}
              />
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {currentPage * pageSize + 1}
                  </span>
                  {' '}-{' '}
                  <span className="font-medium text-gray-900">
                    {Math.min((currentPage + 1) * pageSize, filteredRows)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium text-gray-900">{filteredRows.toLocaleString()}</span>
                  {' '}results
                </div>

                {/* Pagination Controls */}
                <div className="order-1 sm:order-2">
                  <PaginationControls
                    currentPage={currentPage + 1}
                    totalPages={totalPages || 1}
                    onPageChange={handlePageChange}
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