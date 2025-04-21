"use client";

import React, { useMemo, useState } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { useSort } from "@table-library/react-table-library/sort";
import { TableNode } from "@table-library/react-table-library/types/table";
import { usePagination } from "@table-library/react-table-library/pagination";
import {
  useFinancialData,
  FinancialRow,
} from "../_providers/financial-data-provider";

// Import the correct types from the library
import { Action, State} from "@table-library/react-table-library/types/common";

export default function ReactTable() {
  const { financialData = [] } = useFinancialData();
  const [search, setSearch] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("All");

  const filterRollData = useMemo(() => {
    return Array.from(
      new Set(financialData.map((item) => item.catFinancialView))
    );
  }, [financialData]);

  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: 10% 20% 10% 30% 20%;
      `,
    },
  ]);

  const filteredData = useMemo(() => {
    const applySearch = (data: FinancialRow[]) => {
      if (!search) return data;
      return data.filter(
        (item) =>
          item.catFinancialView.toLowerCase().includes(search.toLowerCase()) ||
          item.revenue.toString().toLowerCase().includes(search.toLowerCase())
      );
    };

    const applyFilter = (data: FinancialRow[]) => {
      if (filterRole === "All") return data;
      return data.filter((item) => item.catFinancialView === filterRole);
    };

    const addIds = (data: FinancialRow[]) =>
      data.map((item, index) => ({
        ...item,
        id: `row-${index}`,
      }));

    const resultWithId = addIds(applyFilter(applySearch(financialData)));

    return { nodes: resultWithId };
  }, [search, filterRole, financialData]);

  const onSortChange = (
    action: Action,
    state: { sortKey?: string }
  ) => {
    console.log("Sort changed:", action, state);
  };

  const sort = useSort<TableNode>(
    filteredData,
    {
      onChange: onSortChange,
    },
    {
      sortFns: {
        "Category View": (array) =>
          array.sort((a, b) =>
            a.catFinancialView.localeCompare(b.catFinancialView)
          ),
        Period: (array) => array.sort((a, b) => a.period - b.period),
        Revenue: (array) => array.sort((a, b) => a.revenue - b.revenue),
        "Net Profit": (array) => array.sort((a, b) => a.netProfit - b.netProfit),
      },
    }
  );

  // Using the library's State type
  const onPaginationChange = (
    action: Action,
    state: State
  ) => {
    switch (action.type) {
      case "SET_PAGE":
        console.log("Setting page to:", action.payload);
        break;
      case "SET_SIZE":
        console.log("Setting page size to:", action.payload);
        break;
      default:
        break;
    }
    console.log("Pagination state:", state);
  };

  const pagination = usePagination<TableNode>(filteredData, {
    state: {
      page: 0,
      size: 10,
    },
    onChange: onPaginationChange,
  });

  const COLUMNS = [
    {
      label: "Fiscal Year",
      renderCell: (item: FinancialRow) => item.fiscalYear,
    },
    {
      label: "Category View",
      renderCell: (item: FinancialRow) => item.catFinancialView,
      sort: { sortKey: "Category View" },
    },
    {
      label: "Period",
      renderCell: (item: FinancialRow) => item.period,
      sort: { sortKey: "Period" },
    },
    {
      label: "Revenue",
      renderCell: (item: FinancialRow) => item.revenue,
      sort: { sortKey: "Revenue" },
    },
    {
      label: "Net Profit",
      renderCell: (item: FinancialRow) => item.netProfit,
      sort: { sortKey: "Net Profit" },
    },
  ];

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Financial Data Table
      </h1>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label htmlFor="role-filter" className="sr-only">
          Filter by role
        </label>
        <select
          id="role-filter"
          className="border px-3 py-2 rounded"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Categories</option>
          {filterRollData.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <CompactTable
        columns={COLUMNS}
        data={filteredData}
        theme={theme}
        sort={sort}
        pagination={pagination}
      />

      <div className="flex items-center justify-between mt-4">
        <button
          className="px-4 py-2 border rounded"
          disabled={pagination.state.page === 0}
          onClick={() => pagination.fns.onSetPage(pagination.state.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.state.page + 1} of{" "}
          {Math.ceil(filteredData.nodes.length / pagination.state.size)}
        </span>
        <button
          className="px-4 py-2 border rounded"
          disabled={
            filteredData.nodes.length === 0 ||
            (pagination.state.page + 1) * pagination.state.size >=
              filteredData.nodes.length
          }
          onClick={() => pagination.fns.onSetPage(pagination.state.page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}