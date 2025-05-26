'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
  ColumnOrderState,
} from '@tanstack/react-table';

import { databaseName, useFetchSearchableDataQuery, useFetchSearchInfoQuery } from "@/lib/services/usersApi"; 
import { FinancialSchema } from '@/types/Schemas';

interface FinancialRow extends FinancialSchema {
  id: string;
}

interface EditableCell {
  id: string;
  field: keyof FinancialRow;
  value: any;
}

export default function TanstackTable() {
  // State for filters and pagination
  const [search, setSearch] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  
  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 1000,
  });
  
  // Selection and editing state
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, Partial<FinancialRow>>>(new Map());

  // Prepare search parameters
  const searchParams = useMemo(() => {
    const columnFilters: Record<string, string | number> = {};
    
    if (filterCategory !== "All") {
      columnFilters.catfinancialview = filterCategory; // Note: API uses lowercase
    }

    return {
      tableName: databaseName,
      search: search || undefined,
      column_filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
    };
  }, [search, filterCategory, pagination.pageIndex, pagination.pageSize]);

  // API queries
  const {
    data: searchData,
    error: searchError,
    isLoading: isSearchLoading,
    refetch: refetchData,
  } = useFetchSearchableDataQuery(searchParams);

  const {
    data: searchInfo,
    error: searchInfoError,
    isLoading: isSearchInfoLoading,
  } = useFetchSearchInfoQuery({ tableName: databaseName });

  // Transform API data for table
  const tableData = useMemo(() => {
    if (!searchData?.data) return [];

    const nodesWithIds = searchData.data.map((item: any, index: number) => ({
      ...item,
      id: `row-${index}-${pagination.pageIndex * pagination.pageSize}`,
      // Map API field names to component field names if needed
      fiscalYear: item.fiscalyear || item.fiscalYear,
      catFinancialView: item.catfinancialview || item.catFinancialView,
      catAccountingView: item.cataccountingview || item.catAccountingView,
      netProfit: item.netprofit || item.netProfit,
    }));

    return nodesWithIds;
  }, [searchData, pagination.pageIndex, pagination.pageSize]);

  // Get available categories from search info
  const categories = useMemo(() => {
    if (!searchInfo?.columns) return [];
    
    // You might need to make a separate API call to get unique values
    // For now, return some default categories based on your sample data
    return ["Non opérationnel", "Financier", "Exceptionnel"];
  }, [searchInfo]);

  // Cell editing handlers
  const handleCellClick = (item: FinancialRow, field: keyof FinancialRow) => {
    const editableFields = ['catFinancialView', 'catAccountingView', 'revenue', 'otherIncome', 'grossMargin', 'operatingExpenses', 'operatingProfit', 'FinancialResult', 'EarningsBeforeTax', 'nonRecurringResult', 'netProfit'];
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

  // Reset to first page when search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [search, filterCategory]);

  const createEditableColumn = (
    accessorKey: keyof FinancialSchema,
    header: string,
    type: 'text' | 'number' = 'text'
  ): ColumnDef<FinancialRow> => ({
    accessorKey,
    header,
    cell: ({ row }) => {
      const item = row.original;
      const isEditing = editingCell?.id === item.id && editingCell?.field === accessorKey;
      const isChanged = unsavedChanges.get(item.id)?.[accessorKey] !== undefined;
      const value = getCellValue(item, accessorKey);

      if (isEditing) {
        return (
          <input
            type={type}
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

      const displayValue = type === 'number' && typeof value === 'number' 
        ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : value;

      return (
        <div
          className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${isChanged ? 'bg-yellow-50 font-semibold' : ''}`}
          onClick={() => handleCellClick(item, accessorKey)}
        >
          <span className={type === 'number' && typeof value === 'number' && value < 0 ? 'text-red-600' : ''}>
            {displayValue}
          </span>
        </div>
      );
    },
  });

  const columns: ColumnDef<FinancialRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'fiscalYear',
      header: 'Fiscal Year',
      cell: ({ getValue }) => (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
          {getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ getValue }) => (
        <div className="cursor-pointer hover:bg-gray-50 p-1 rounded">
          {getValue() as string}
        </div>
      ),
    },
    createEditableColumn('catAccountingView', 'Cat Accounting View'),
    createEditableColumn('catFinancialView', 'Cat Financial View'),
    createEditableColumn('revenue', 'Revenue', 'number'),
    createEditableColumn('otherincome', 'Other Income', 'number'),
    createEditableColumn('grossmargin', 'Gross Margin', 'number'),
    createEditableColumn('operatingexpenses', 'Operating Expenses', 'number'),
    createEditableColumn('operatingprofit', 'Operating Profit', 'number'),
    createEditableColumn('financialresult', 'Financial Result', 'number'),
    createEditableColumn('earningsbeforetax', 'Earnings Before Tax', 'number'),
    createEditableColumn('nonrecurringresult', 'Non-Recurring Result', 'number'),
    createEditableColumn('netProfit', 'Net Profit', 'number'),
  ];

  // Calculate pagination info
  const totalPages = Math.ceil((searchData?.total_rows || 0) / pagination.pageSize);
  const totalRows = searchData?.total_rows || 0;
  const filteredRows = searchData?.filtered_rows || 0;

  // TanStack Table instance
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      rowSelection,
      columnOrder,
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true, // Server-side pagination
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  // Initialize column order after first render
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  // Handle loading and error states
  if (isSearchLoading || isSearchInfoLoading) {
    return <div className="p-4 text-center">Loading data...</div>;
  }

  if (searchError || searchInfoError) {
    return (
      <div className="p-4 text-red-600">
        Error: {
        // @ts-ignore
        searchError?.error?.toString() || searchInfoError?.error?.toString()}
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
      <h1 className="text-2xl font-bold mb-4">TanStack Table - API Integrated</h1>

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
          value={pagination.pageSize}
          onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
        >
          <option value="5">5 rows</option>
          <option value="10">10 rows</option>
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
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
        {searchData?.search_applied && (
          <span className="mr-4">
            🔍 Search: "{searchData.search_term}" 
          </span>
        )}
        <span>
          Showing {filteredRows} of {totalRows} records
        </span>
      </div>

      {/* Table */}
      {tableData.length === 0 ? (
        <div className="p-4 text-center">No data found matching your filters</div>
      ) : (
        <>
          <div className="border rounded shadow-sm overflow-auto max-h-[70vh]">
            <table className="min-w-full border border-gray-300">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-100">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-2 text-left cursor-move select-none border-r border-gray-200 bg-white"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('colId', header.column.id);
                          e.currentTarget.style.opacity = '0.4';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const draggedColId = e.dataTransfer.getData('colId');
                          const targetColId = header.column.id;
                      
                          const newOrder = [...table.getState().columnOrder];
                          const fromIndex = newOrder.indexOf(draggedColId);
                          const toIndex = newOrder.indexOf(targetColId);
                      
                          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                            newOrder.splice(fromIndex, 1);
                            newOrder.splice(toIndex, 0, draggedColId);
                            table.setColumnOrder(newOrder);
                          }
                        }}
                      >
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? ''}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2 border-t">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {totalPages || 1}
              </span>
              <span className="text-gray-500">
                ({filteredRows} filtered / {totalRows} total rows)
              </span>
            </div>
            <button
              className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Selected Rows Count */}
      <div className="mt-2 text-sm text-gray-600">
        Selected Rows: {Object.keys(rowSelection).length}
      </div>
    </section>
  );
}