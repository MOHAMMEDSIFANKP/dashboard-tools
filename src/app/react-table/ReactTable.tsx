"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CompactTable } from "@table-library/react-table-library/compact";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { useSort } from "@table-library/react-table-library/sort";
import { TableNode } from "@table-library/react-table-library/types/table";
import { Action, State } from "@table-library/react-table-library/types/common";
import { useRowSelect } from "@table-library/react-table-library/select";
import { useDuckDBContext } from "../_providers/DuckDBContext";
import { FinancialSchema } from "@/types/Schemas";

interface FinancialRow extends FinancialSchema {
  id: string;
}

interface EditableCell {
  id: string;
  field: keyof FinancialRow;
  value: any;
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
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, Partial<FinancialRow>>>(new Map());

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
    // Only allow editing for certain fields
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
    alert('Edited')
    setUnsavedChanges(new Map());
    // try {
    //   for (const [rowId, changes] of unsavedChanges.entries()) {
    //     // Get the original row data
    //     const originalRow = tableData.nodes.find(node => node.id === rowId);
    //     if (!originalRow) continue;

    //     // Build update query
    //     const updateFields = Object.entries(changes)
    //       .map(([field, value]) => `${field} = '${value}'`)
    //       .join(', ');
        
    //     const updateQuery = `
    //       UPDATE financial_data 
    //       SET ${updateFields}
    //       WHERE fiscalYear = ${originalRow.fiscalYear} 
    //       AND period = ${originalRow.period}
    //       AND catFinancialView = '${originalRow.catFinancialView}'
    //     `;
        
    //     const result = await executeQuery(updateQuery);
    //     if (!result.success) {
    //       throw new Error(`Failed to update row ${rowId}: ${result.error}`);
    //     }
    //   }
      
    //   // Clear unsaved changes and refresh data
    //   setUnsavedChanges(new Map());
    //   // Refresh the table data
    //   window.location.reload(); // Simple refresh, you might want to refetch data instead
    // } catch (err) {
    //   console.error("Error saving changes:", err);
    //   setError(err instanceof Error ? err.message : "Failed to save changes");
    // }
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

  const totalPages = Math.ceil(totalRows / pageSize);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">Financial Data Table - Full Featured</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          className="border px-3 py-2 rounded"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
        />

        <select
          className="border px-3 py-2 rounded"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(0);
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
          className="border px-3 py-2 rounded"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          <option value="5">5 rows</option>
          <option value="10">10 rows</option>
          <option value="20">20 rows</option>
          <option value="50">50 rows</option>
        </select>

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

      {/* Table */}
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