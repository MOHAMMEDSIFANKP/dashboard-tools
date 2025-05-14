'use client'
import React from 'react'
import FinancialDashboard from '../ag-charts/FinancialDashboard'
import AgChartsPage from './AgChartsPage'
import { TabsContainer } from '@/components/ui/TabsContainer'

function Page() {
  const [selectedTab, setSelectedTab] = React.useState<'charts' | 'table'>('charts')

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'charts' ? (
         <AgChartsPage/>
      ) : (
        <FinancialDashboard />
     
      )}
    </>
  )
}

export default Page

