'use client'
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import { useFinancialData, FinancialRow } from "../_providers/financial-data-provider";

type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
};


export default function TanstackTable() {
  const { financialData } = useFinancialData();

  const columns: ColumnDef<FinancialRow>[] = [
    {
      accessorKey: "fiscalYear",
      header: "Fiscal Year",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "catFinancialView",
      header: "Cat Financial View",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "operatingExpenses",
      header: "Operating Expenses",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "netProfit",
      header: "Net Profit",
      cell: (info) => info.getValue(),
    },
  ];

  return (
    <section className="p-[20px] flex flex-col gap-4">
      <h1 className="text-2xl text-center font-bold">Tanstack Table</h1>
      <DataTable data={financialData} columns={columns} />
    </section>
  );
}

function DataTable<TData>({ data, columns }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting as any,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    
  });
  

  return (
    <div className="p-4">
      <input
        className="border p-2 mb-4 w-full"
        placeholder="Search..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
      <table className="min-w-full border border-gray-200">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-100 ">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-2 cursor-pointer select-none text-start"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
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

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
