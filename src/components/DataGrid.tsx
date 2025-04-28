// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';

import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

import { FinancialSchema } from "@/types/Schemas";


interface DataGridProps {
  financialData: FinancialSchema[];
}

const DataGrid: React.FC<DataGridProps> = ({ financialData }) => {
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
    <div className="w-full">
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