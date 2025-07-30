"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { useSort } from "@table-library/react-table-library/sort";
import { TableNode } from "@table-library/react-table-library/types/table";
import { Action, State } from "@table-library/react-table-library/types/common";
import { useRowSelect } from "@table-library/react-table-library/select";
import { databaseName, useFetchSearchableDataQuery, useFetchSearchInfoQuery } from "@/lib/services/usersApi";
import { FinancialSchema } from "@/types/Schemas";
import { testCase2ProductId, useFetchTestCase2TableDataQuery } from "@/lib/services/testCase2Api";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";

import { useEmailShareDrawer } from "@/hooks/useEmailShareDrawer";
import { EmailShareDrawer } from "@/components/drawer/EmailShareDrawer";
import { ReactTableCaptureScreenshot } from "@/utils/utils";
import { Share } from 'lucide-react';

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
      search: search || undefined,
      column_filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    };
  }, [search, filterCategory, currentPage, pageSize]);

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
        --data-table-library_grid-template-columns: 15% 20% 10% 20% 20%;
      `,
      Row: `
        &:nth-of-type(odd) {
          background-color: #f8f9fa;
        }
        &.selected {
          background-color: #e3f2fd;
        }
      `,
      Cell: `
        &.editing {
          background-color: #fff3cd;
          border: 2px solid #ffc107;
        }
      `,
    },
  ]);

  // Row selection
  const select = useRowSelect<TableNode>(
    tableData,
    {
      // @ts-ignore
      onChange: (action: Action, state: State<FinancialRow>) => {
        const newSelectedRows = Object.keys(state.ids).filter(id => state.ids[id]);
        setSelectedRows(newSelectedRows);
      },
    },
    {
      // @ts-ignore
      rowSelect: {
        headerSelectable: true,
        rowSelectable: true,
      },
      // @ts-ignore
      buttonSelect: false,
    }
  );

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
    setEditingCell(null);
  };

  // Update functions
  const handleSaveChanges = async () => {
    alert('Changes saved! (You would implement actual update API here)');
    setUnsavedChanges(new Map());
    // TODO: Implement actual update API call
    // You'll need to create an update endpoint in your API
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
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [search, filterCategory]);

  // Column definitions
  const COLUMNS = [
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
              className="w-full p-1 border border-yellow-400 rounded"
              autoFocus
            />
          );
        }

        return (
          <div
            className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
            onClick={() => handleCellClick(item, 'catFinancialView')}
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
              className="w-full p-1 border border-yellow-400 rounded"
              autoFocus
            />
          );
        }

        const numValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
        const formatted = typeof numValue === 'number'
          ? numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          : value;

        return (
          <div
            className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
            onClick={() => handleCellClick(item, 'revenue')}
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
              className="w-full p-1 border border-yellow-400 rounded"
              autoFocus
            />
          );
        }

        const numValue = typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value;
        const formatted = typeof numValue === 'number'
          ? numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          : value;

        return (
          <div
            className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
            onClick={() => handleCellClick(item, 'netProfit')}
          >
            <span className={`font-medium ${Number(numValue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatted}
            </span>
          </div>
        );
      },
      sort: { sortKey: "netProfit" },
    },
  ];

  // @ts-ignore
  const totalPages = Math.ceil(isTestCase1 ? (searchData?.total_rows || 0) : (searchData?.pagination?.total_records || 0) / pageSize);
  // @ts-ignore
  const totalRows = isTestCase1 ? (searchData?.total_rows || 0) : (searchData?.pagination?.total_records || 0);
  // @ts-ignore
  const filteredRows = isTestCase1 ? (searchData?.filtered_rows || 0) : (searchData?.pagination?.filtered_records || 0);

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
    <section className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Financial Data Table - API Integrated</h1>
        <button
          onClick={handleShareTable}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-purple-200 transform hover:scale-105 transition-all duration-300 ease-out font-medium text-sm flex items-center gap-2"
        >
          <Share className="w-4 h-4" />
          Share Table
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search across all fields..."
          className="border px-3 py-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded"
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

        <select
          className="border px-3 py-2 rounded"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          <option value="5">5 rows</option>
          <option value="10">10 rows</option>
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
          <option value="100">100 rows</option>
        </select>

        <button
          onClick={() => refetchData()}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>

        {/* Save/Discard buttons */}
        <div className="ml-auto flex gap-2">
          {unsavedChanges.size > 0 && (
            <>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Changes ({unsavedChanges.size})
              </button>
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Discard
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data Info */}
      <div className="mb-4 text-sm text-gray-600">
        {
          // @ts-ignore
          searchData?.search_applied && (<span className="mr-4">🔍 Search: "{searchData.search_term}"</span>)}
        <span>
          Showing {filteredRows} of {totalRows} records
        </span>
      </div>

      {/* Table */}
      {tableData.nodes.length === 0 ? (
        <div className="p-4 text-center">No data found matching your filters</div>
      ) : (
        <>
          <div ref={tableRef} className="border rounded overflow-auto max-h-[70vh]">
            <CompactTable
              columns={COLUMNS}
              data={tableData}
              theme={theme}
              sort={sort}
              select={select}
            />
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span>
                Page {currentPage + 1} of {totalPages || 1}
              </span>
              <span className="text-gray-500">
                ({filteredRows} filtered / {totalRows} total rows)
              </span>
            </div>
            <button
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
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