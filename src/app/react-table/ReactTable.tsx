"use client";

import React, { useEffect, useState } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { useSort } from "@table-library/react-table-library/sort";
import { TableNode } from "@table-library/react-table-library/types/table";
import { usePagination } from "@table-library/react-table-library/pagination";
import { Action, State } from "@table-library/react-table-library/types/common";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { FinancialSchema } from "@/types/Schemas";

interface FinancialRow extends FinancialSchema {
  id: string;
}

export default function ReactTable() {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
  const [tableData, setTableData] = useState<{ nodes: FinancialRow[] }>({ nodes: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  // Fetch categories for filter dropdown
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchCategories = async () => {
      try {
        const result = await executeQuery(
          "SELECT DISTINCT catFinancialView FROM financial_data ORDER BY catFinancialView"
        );
        if (result.success && result.data) {
          setCategories(result.data.map((row: { catFinancialView: string }) => row.catFinancialView));
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, [isDataLoaded, executeQuery]);

  // Fetch data with filters applied directly in SQL
  useEffect(() => {
    if (!isDataLoaded) return;

    const fetchFilteredData = async () => {
      setIsLoading(true);
      
      try {
        // Build WHERE clause based on filter and search
        let whereClause = "";
        const conditions = [];
        
        if (filterCategory !== "All") {
          conditions.push(`catFinancialView = '${filterCategory}'`);
        }
        
        if (search) {
          conditions.push(
            `(LOWER(catFinancialView) LIKE '%${search.toLowerCase()}%' OR 
              CAST(revenue AS STRING) LIKE '%${search.toLowerCase()}%')`
          );
        }
        
        if (conditions.length > 0) {
          whereClause = `WHERE ${conditions.join(" AND ")}`;
        }
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM financial_data ${whereClause}`;
        const countResult = await executeQuery(countQuery);
        
        if (countResult.success && countResult.data && countResult.data.length > 0) {
          setTotalRows(Number(countResult.data[0].total));
        }
        
        // Get paginated data
        const offset = currentPage * pageSize;
        const dataQuery = `
          SELECT * FROM financial_data 
          ${whereClause} 
          ORDER BY fiscalYear, period 
          LIMIT ${pageSize} OFFSET ${offset}
        `;
        
        const dataResult = await executeQuery(dataQuery);
        
        if (dataResult.success && dataResult.data) {
          // Add id to each row for the table library
          const rowsWithIds = dataResult.data.map((item: FinancialSchema, index: number) => ({
            ...item,
            id: `row-${index}-${offset}`,
          }));
          
          setTableData({ nodes: rowsWithIds });
          setError(null);
        } else {
          setError(dataResult.error || "Failed to fetch data");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredData();
  }, [isDataLoaded, executeQuery, search, filterCategory, currentPage, pageSize]);

  // Apply theme
  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: 15% 20% 10% 20% 20%;
      `,
    },
  ]);

  // Handle sort changes - we're keeping client-side sorting for simplicity
  const onSortChange = (action: Action, state: { sortKey?: string }) => {
    console.log("Sort changed:", action, state);
  };

  const sort = useSort<TableNode>(
    tableData,
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

  // Custom pagination implementation that updates our page state
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  // Column definitions
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
      renderCell: (item: FinancialRow) => (
        <span className="font-medium">
          {typeof item.revenue === 'string' && !isNaN(Number(item.revenue)) 
            ? Number(item.revenue).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : item.revenue}
        </span>
      ),
      sort: { sortKey: "Revenue" },
    },
    {
      label: "Net Profit",
      renderCell: (item: FinancialRow) => (
        <span className={`font-medium ${Number(item.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {typeof item.netProfit === 'string' && !isNaN(Number(item.netProfit))
            ? Number(item.netProfit).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : item.netProfit}
        </span>
      ),
      sort: { sortKey: "Net Profit" },
    },
  ];

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalRows / pageSize);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">Financial Data Table - React Table</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-2 rounded"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0); // Reset to first page on new search
          }}
        />

        <label htmlFor="category-filter" className="sr-only">
          Filter by category
        </label>
        <select
          id="category-filter"
          className="border px-3 py-2 rounded"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(0); // Reset to first page on filter change
          }}
        >
          <option value="All">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          id="page-size"
          className="border px-3 py-2 rounded ml-auto"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          <option value="5">5 rows</option>
          <option value="10">10 rows</option>
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-4 text-center">Loading data...</div>
      ) : tableData.nodes.length === 0 ? (
        <div className="p-4 text-center">No data found matching your filters</div>
      ) : (
        <>
          <div className="border rounded overflow-auto max-h-[70vh]">
            <CompactTable
              columns={COLUMNS}
              data={tableData}
              theme={theme}
              sort={sort}
            />
          </div>

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
                ({totalRows} total rows)
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
    </section>
  );
}