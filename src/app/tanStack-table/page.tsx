'use client'
import React from 'react'
import FinancialDashboard from '../ag-charts/FinancialDashboard'
import { TabsContainer } from '@/components/ui/TabsContainer'
import TanstackTable from './TanstackTable'

function Page() {
  const [selectedTab, setSelectedTab] = React.useState<'charts' | 'table'>('charts')

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'charts' ? (
         <TanstackTable/>
      ) : (
        <FinancialDashboard />
     
      )}
    </>
  )
}

export default Page

