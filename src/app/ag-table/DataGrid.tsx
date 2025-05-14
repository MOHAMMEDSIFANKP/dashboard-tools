// // import 'ag-grid-community/styles/ag-grid.css';
// // import 'ag-grid-community/styles/ag-theme-alpine.css';
// import { AgGridReact } from 'ag-grid-react';

// import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
// import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// ModuleRegistry.registerModules([AllCommunityModule]);

// import { FinancialSchema } from "@/types/Schemas";
// import { MONTHS } from '@/lib/services/buildWhereClause';
// import { useCallback } from 'react';


// interface DataGridProps {
//   financialData: FinancialSchema[];
//   totalCount:number;
// }

// const DataGrid: React.FC<DataGridProps> = ({ financialData,totalCount }) => {
//   // Column Definitions with editable cells and filters
  
//   const columnDefs: ColDef[] = [
//     {
//       field: 'fiscalyear',
//       headerName: 'Fiscal Year',
//       sortable: true,
//       editable: false,
//       // floatingFilter: true,
//       // valueFormatter: (params): string | any => {
//       //   const date = new Date(params.value);
//       //   return date.getFullYear();
//       // },
//     },
//     {
//       field: 'period',
//       headerName: 'Month',
//       filter: 'agSetColumnFilter',
//       sortable: true,
//       editable: false,
//       // floatingFilter: true,
//       // valueFormatter: (params): string | any => {
//       //   const date = new Date(params.value);
//       //   return Object.keys(MONTHS).find(key => MONTHS[key] === date.toLocaleString('default', { month: '2-digit' }));
//       // },
//     },
//     {
//       field: 'cataccountingview',
//       headerName: 'Cat Accounting View',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'catfinancialview',
//       headerName: 'Cat Financial View',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'revenue',
//       headerName: 'Revenue',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'otherincome',
//       headerName: 'Other Income',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'grossmargin',
//       headerName: 'Gross Margin',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'operatingexpenses',
//       headerName: 'Operating Expenses',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'operatingprofit',
//       headerName: 'Operating Profit',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'financialresult',
//       headerName: 'Financial Result',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'earningsbeforetax',
//       headerName: 'Earnings Before Tax',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'nonrecurringresult',
//       headerName: 'Non-Recurring Result',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'netprofit',
//       headerName: 'Net Profit',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//     {
//       field: 'country',
//       headerName: 'Country',
//       sortable: true,
//       editable: true,
//       floatingFilter: true
//     },
//   ];

//   // Default Column Definition
//   const defaultColDef = {
//     flex: 1,
//     minWidth: 100,
//     resizable: true,
//     filter: true,
//     sortable: true,
//     filterParams: {
//       buttons: ['reset', 'apply'],
//       closeOnApply: true
//     }
//   };

//   // Handle cell value changes
//   const onCellValueChanged = (params: CellValueChangedEvent) => {
//     console.log('Cell value changed:', params);
//     // Here you can implement logic to save changes to your backend
//   };

//    const onPaginationChanged = (params: any) => {
//     // if (params.newPageSize !== pagination.pageSize) {
//     //   // Page size changed
//     //   setPagination(prev => ({
//     //     ...prev,
//     //     pageSize: params.newPageSize,
//     //     currentPage: 1 // Reset to first page when page size changes
//     //   }));
//     // } else if (params.newPage !== pagination.currentPage) {
//     //   // Page number changed
//     //   setPagination(prev => ({
//     //     ...prev,
//     //     currentPage: params.newPage
//     //   }));
//     // }
//   };
  
//    const onGridReady = useCallback((params: GridReadyEvent) => {
//     params.api.setDatasource({
//       getRows: async (params) => {
//         const pageSize = params.endRow - params.startRow;
//         const offset = params.startRow;

//         try {
//           const response = await fetch(`https://15.237.225.138/api/duckdb/tables/test/data?limit=${pageSize}&offset=${offset}`);
//           const result = await response.json();
//           params.successCallback(result.data, result.total_rows);
//         } catch (error) {
//           console.error("Fetch error:", error);
//           params.failCallback();
//         }
//       }
//     });
//   }, []);
//   return (
//     <div className="w-full">
//       <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
//         <AgGridReact
//           rowData={financialData}
//           columnDefs={columnDefs}
//           defaultColDef={defaultColDef}
//           onCellValueChanged={onCellValueChanged}
//           pagination={true}
//           paginationPageSize={10}
//           paginationAutoPageSize={false}
//           rowSelection="multiple"
//           animateRows={true}
//           rowHeight={45}
//           headerHeight={50}
//           rowModelType="clientSide" 
//          onPaginationChanged={(params) => onPaginationChanged({
//           newPage: params.api.paginationGetCurrentPage() + 1,
//           newPageSize: params.api.paginationGetPageSize()
//         })}
//         onGridReady={onGridReady}

// // paginationNumberFormatter={(params) => {
// //     return `${params.value}  ${Math.ceil(totalCount / 10)}`;
// //   }}

//         //   enableCellChangeFlash={true}                
//         // domLayout="autoHeight" 
//         />
//       </div>
//     </div>
//   );
// };

// export default DataGrid;
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';

import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import { FinancialSchema } from "@/types/Schemas";
import { useCallback, useEffect, useState } from 'react';
import { useDuckDBContext } from '../_providers/DuckDBContext';


interface DataGridProps {
  // financialData: FinancialSchema[];
}

const DataGrid: React.FC<DataGridProps> = ({ }) => {
  const { executeQuery, isDataLoaded } = useDuckDBContext();
    const [financialData, setFinancialData] = useState<FinancialSchema[]>([]);
    const [error, setError] = useState<string | null>(null);
  
    const fetchData = useCallback(async () => {
      if (!isDataLoaded) return;
  
      try {
        const result = await executeQuery("SELECT * FROM financial_data");
        if (result.success && result.data) {
          setFinancialData(result.data);        
        } else {
          setError(result.error || "Failed to fetch data");
        }
      } catch (err:unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    }, [isDataLoaded, executeQuery]);
  
    useEffect(() => {
      if (isDataLoaded) {
        fetchData();
      }
    }, [isDataLoaded, fetchData]);
  // Column Definitions with editable cells and filters
  const columnDefs: ColDef[] = [
    {
      field: 'fiscalYear',
      headerName: 'Fiscal Year',
      sortable: true,
      editable: false,
      floatingFilter: true
    },
    {
      field: 'period',
      headerName: 'Period',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'catAccountingView',
      headerName: 'Cat Accounting View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'catFinancialView',
      headerName: 'Cat Financial View',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'otherIncome',
      headerName: 'Other Income',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'grossMargin',
      headerName: 'Gross Margin',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'operatingExpenses',
      headerName: 'Operating Expenses',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'operatingProfit',
      headerName: 'Operating Profit',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'FinancialResult',
      headerName: 'Financial Result',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'EarningsBeforeTax',
      headerName: 'Earnings Before Tax',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'nonRecurringResult',
      headerName: 'Non-Recurring Result',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    {
      field: 'netProfit',
      headerName: 'Net Profit',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
  ];

  // Default Column Definition
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    filter: true,
    sortable: true,
    filterParams: {
      buttons: ['reset', 'apply'],
      closeOnApply: true
    }
  };



  // Handle cell value changes
  const onCellValueChanged = (params: CellValueChangedEvent) => {
    console.log('Cell value changed:', params);
    // Here you can implement logic to save changes to your backend
  };

  return (
    <div className="w-full p-4">
       <h1 className="text-xl font-bold mb-4">Financial Data - Ag Table</h1>
      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          rowData={financialData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
          pagination={true}
          paginationPageSize={10}
          paginationAutoPageSize={false}
          rowSelection="multiple"
          animateRows={true}
        //   enableCellChangeFlash={true}
        //rowHeight={45}                      
        // headerHeight={55}                   
        // domLayout="autoHeight" 
        />
      </div>
    </div>
  );
};

export default DataGrid;