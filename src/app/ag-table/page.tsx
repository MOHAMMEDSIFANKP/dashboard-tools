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
import { TabsContainer } from '@/components/ui/TabsContainer'
import DataGrid from './DataGrid'

function Page() {
  const [selectedTab, setSelectedTab] = React.useState<'charts' | 'table'>('charts')

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'charts' ? (
         <DataGrid/>
      ) : (
        <FinancialDashboard />
     
      )}
    </>
  )
}

export default Page

