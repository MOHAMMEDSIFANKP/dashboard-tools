'use client';
import React, { useCallback, useEffect, useState } from 'react';
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

import { useDuckDBContext } from '../_providers/DuckDBContext';
import { FinancialSchema } from '@/types/Schemas';

export default function TanstackTable() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [financialData, setFinancialData] = useState<FinancialSchema[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isDataLoaded) return;
    try {
      const result = await executeQuery('SELECT * FROM financial_data');
      if (result.success && result.data) {
        setFinancialData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [isDataLoaded, executeQuery]);

  useEffect(() => {
    if (isDataLoaded) {
      fetchData();
    }
  }, [isDataLoaded, fetchData]);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  const createEditableColumn = (
    accessorKey: keyof FinancialSchema,
    header: string,
    type: 'text' | 'number' = 'text'
  ): ColumnDef<FinancialSchema> => ({
    accessorKey,
    header,
    cell: ({ row, column, getValue }) => {
      const initialValue = getValue();
      const [value, setValue] = useState(initialValue);
      const [isEditing, setIsEditing] = useState(false);

      // Update the value state when the row data changes
      useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      const onBlur = () => {
        setIsEditing(false);
        // if (value !== initialValue) {
        //   handleCellUpdate(
        //     row.index,
        //     column.id,
        //     type === 'number' ? parseFloat(value as string) : value
        //   );
        // }
      };

      return isEditing ? (
        <input
          type={type}
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onBlur();
            }
          }}
          className="w-full p-1 border"
          autoFocus
        />
      ) : (
        <div
          className="w-full h-full cursor-pointer hover:bg-gray-100 p-1"
          onClick={() => setIsEditing(true)}
        >
          {value as string}
        </div>
      );
    },
  });

  const columns: ColumnDef<FinancialSchema>[] = [
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
    // { accessorKey: 'fiscalYear', header: 'Fiscal Year', },
    // { accessorKey: 'period', header: 'Period' },
    // { accessorKey: 'catAccountingView', header: 'Cat Accounting View' },
    // { accessorKey: 'catFinancialView', header: 'Cat Financial View' },
    // { accessorKey: 'revenue', header: 'Revenue' },
    // { accessorKey: 'otherIncome', header: 'Other Income' },
    // { accessorKey: 'grossMargin', header: 'Gross Margin' },
    // { accessorKey: 'operatingExpenses', header: 'Operating Expenses' },
    // { accessorKey: 'operatingProfit', header: 'Operating Profit' },
    // { accessorKey: 'FinancialResult', header: 'Financial Result' },
    // { accessorKey: 'EarningsBeforeTax', header: 'Earnings Before Tax' },
    // { accessorKey: 'nonRecurringResult', header: 'Non-Recurring Result' },
    // { accessorKey: 'netProfit', header: 'Net Profit' },
    { accessorKey: 'fiscalYear', header: 'Fiscal Year' },
    { accessorKey: 'period', header: 'Period' },
    createEditableColumn('catAccountingView', 'Cat Accounting View'),
    createEditableColumn('catFinancialView', 'Cat Financial View'),
    createEditableColumn('revenue', 'Revenue', 'number'),
    createEditableColumn('otherIncome', 'Other Income', 'number'),
    createEditableColumn('grossMargin', 'Gross Margin', 'number'),
    createEditableColumn('operatingExpenses', 'Operating Expenses', 'number'),
    createEditableColumn('operatingProfit', 'Operating Profit', 'number'),
    createEditableColumn('FinancialResult', 'Financial Result', 'number'),
    createEditableColumn('EarningsBeforeTax', 'Earnings Before Tax', 'number'),
    createEditableColumn('nonRecurringResult', 'Non-Recurring Result', 'number'),
    createEditableColumn('netProfit', 'Net Profit', 'number'),
  ];
  

  return (
    <section className="p-5 flex flex-col gap-4">
      <h1 className="text-2xl text-center font-bold">TanStack Table</h1>
      <DataTable data={financialData} columns={columns} />
    </section>
  );
}

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
};

function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]); // initial order will be set by table.getAllLeafColumns()
  const [pageSize, setPageSize] = useState(10);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnOrder,
      pagination: {
        pageIndex: 0,
        pageSize,
      },

    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  // Initialize column order after first render
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  return (
    <div className="p-4 border rounded shadow-sm">
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="p-2 border w-[80%]"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        
        {/* Page Size Selector */}
        <div className="flex items-center">
          <span className="mr-2">Show rows:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="p-2 border"
          >
            {[5, 10, 20, 30, 50, 100].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Selected Rows Count */}
      <div className="mt-2 text-sm text-gray-600">
        Selected Rows: {Object.keys(rowSelection).length}
      </div>
    </div>
  );
}
