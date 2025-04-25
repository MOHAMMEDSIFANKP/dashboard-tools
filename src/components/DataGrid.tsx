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

const DataGrid: React.FC<DataGridProps> = ({ financialData })  => {
  // const [rowData, setRowData] = useState<Person[]>(financialData || []);
  // Column Definitions with editable cells and filters
  const columnDefs: ColDef[] = [
    { 
      field: 'fiscalYear', 
      headerName: 'Fiscal Year',
      // filter: 'agTextColumnFilter',
      sortable: true,
      editable: false,
      floatingFilter: true
    },
    { 
      field: 'catFinancialView', 
      headerName: 'Cat Financial View',
      // filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    { 
      field: 'period', 
      headerName: 'Period',
      // filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    { 
      field: 'revenue', 
      headerName: 'Revenue',
      // filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    { 
      field: 'operatingExpenses',
      headerName: 'Operating Expenses', 
      // filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    { 
      field: 'netProfit', 
      headerName: 'Net Profit',
      // filter: 'agNumberColumnFilter',
      sortable: true,
      editable: true,
      floatingFilter: true
    },
    // { 
    //   field: 'city', 
    //   filter: 'agTextColumnFilter',
    //   sortable: true,
    //   editable: true,
    //   floatingFilter: true
    // },
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
        />
      </div>
    </div>
  );
};

export default DataGrid;