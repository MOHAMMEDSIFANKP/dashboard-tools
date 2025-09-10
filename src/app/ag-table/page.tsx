// // app/financial-data/page.tsx
// "use client";
// import DataGrid from "@/components/DataGrid";
// import { useFetchTestTableDataQuery } from "@/lib/services/usersApi";

// export default function FinancialDataPage() {
//   const { data, error, isLoading } = useFetchTestTableDataQuery({ limit: 10, offset: 0 });
//   if (error) {
//     return <div className="p-4 text-red-600">Error: {JSON.stringify(error)}</div>;
//   }

//   return (
//     <section className="p-4">
//       <h1 className="text-xl font-bold mb-4">Financial Data - Ag Table</h1>
//       <DataGrid financialData={data?.data || []} totalCount={data?.total_rows || 0} />
//     </section>
//   );
// }

// app/financial-data/page.tsx
'use client'
import React from 'react'
import FinancialDashboard from '../ag-charts/FinancialDashboard'
import { TabOption, TabsContainer } from '@/components/ui/TabsContainer'
import DataGrid from './DataGrid'
import DashboardInfoCard from '@/components/DashboardInfoCard'

function Page() {
    const [selectedTab, setSelectedTab] = React.useState<TabOption>('tool-test-info')

  const dashboardInfoDatas = {
    apiEndpoints: [
      { testCase: "test-case-1", method: "GET", apiName: "api/duckdb/tables/financial_data_1M/data", api: "https://testcase.mohammedsifankp.online/api/duckdb/tables/financial_data_1M/data?limit=10&offset=0", description: "Fetch all table data" },
      { testCase: "test-case-1", method: "GET", apiName: "api/duckdb/tables/financial_data_1M/data?column_filters=%7B%22otherincome%22%3A%22300%22%7D&limit=10&offset=0", api: "https://testcase.mohammedsifankp.online/api/duckdb/tables/financial_data_1M/data?column_filters=%7B%22otherincome%22%3A%22300%22%7D&limit=10&offset=0", description: "Fetch data by filter" },

      { testCase: "test-case-2", method: "GET", apiName: "api/data-products/data-products/sample_100k_product_v1/records?limit=10&offset=0&exclude_null_revenue=false&include_enrichment=true", api: "https://testcase2.mohammedsifankp.online/api/data-products/data-products/sample_100k_product_v1/records?limit=10&offset=0&exclude_null_revenue=false&include_enrichment=true", description: "Fetch all table data" },
      { testCase: "test-case-2", method: "GET", apiName: "/api/data-products/data-products/sample_100k_product_v1/records?limit=10&offset=0&exclude_null_revenue=false&include_enrichment=true&column_filters=%7B%22fiscal_year_number%22%3A%222022%22%7D", api: "https://testcase2.mohammedsifankp.online/api/data-products/data-products/sample_100k_product_v1/records?limit=10&offset=0&exclude_null_revenue=false&include_enrichment=true&column_filters=%7B%22fiscal_year_number%22%3A%222022%22%7D", description: "Fetch data by filter" },
    ],
    availableFeatures: [
      { feature: "Filter", supported: true },
      { feature: "Sorting", supported: true },
      { feature: "Pagination", supported: true },
      { feature: "Editable Cells", supported: true },
      { feature: "Row Selection", supported: true },
      { feature: "Column Reordering", supported: true },
      { feature: "Updatble ", supported: true },
      { feature: "Page Size Customization", supported: true },
      { feature: "UI Customization", supported: true },
      { feature: "Open Source", supported: true },
    ],
    dataRecords: {
      "test-case-1": "1,000,000 Records",
      "test-case-2": "10 M Records"
    }
  }

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'charts' && <DataGrid />}
      {selectedTab === 'table' && <FinancialDashboard />}
      {selectedTab !== 'charts' && selectedTab !== 'table' && (
        <DashboardInfoCard
          apiEndpoints={dashboardInfoDatas.apiEndpoints}
          availableFeatures={dashboardInfoDatas.availableFeatures}
          dataRecords={dashboardInfoDatas.dataRecords}
        />
      )}
    </>
  )
}

export default Page

