'use client'
import React from 'react'
import FinancialDashboard from '../ag-charts/FinancialDashboard'
import { TabOption, TabsContainer } from '@/components/ui/TabsContainer'
import VictoryChartsPage from './VictoryChartsPage'
import DashboardInfoCard from '@/components/DashboardInfoCard'

function Page() {
    const [selectedTab, setSelectedTab] = React.useState<TabOption>('tool-test-info')

  const dashboardInfoDatas = {
      apiEndpoints: [
        { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/all-charts?table_name=sample_1m", api: "https://testcase.mohammedsifankp.online/api/dashboard/all-charts?table_name=sample_1m", description: "Fetch all chart data for the dashboard" },
        { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", api: "https://testcase.mohammedsifankp.online/api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", description: "Fetch Drill Down datas" },
        { testCase: "test-case-1", method: "GET", apiName: "api/dashboard/tables/sample_1m/dimensions", api: "https://testcase.mohammedsifankp.online/api/dashboard/tables/sample_1m/dimensions", description: "Fetch dimensions for the dashboard" },
  
        { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", description: "Fetch all chart data for the dashboard" },
        { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", description: "Fetch Drill Down datas" },
        { testCase: "test-case-2", method: "GET", apiName: "api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=true", api: "https://testcase2.mohammedsifankp.online/api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=false", description: "Fetch dimensions for the dashboard" },
      ],
      availableFeatures: [
        { feature: "Drill Down", supported: true },
        { feature: "Cross-Chart Filtering", supported: true },
        { feature: "Interactive Charts", supported: true },
        { feature: "Legend Toggle", supported: true },
        { feature: "Export Options (PNG, CSV)", supported: true },
        { feature: "Real-time Data Support (Need Manual setup)", supported: false },
        { feature: "Custom Options", supported: true },
        { feature: "TypeScript Support", supported: true },
        { feature: "Open Source", supported: true },
        { feature: "Drag and Drop. Click the link ->", supported: true, link:"dashboard/draggble-dashboard" },
      ],
       dataRecords: {
        "test-case-1": "1,000,000 Records",
        "test-case-2": "Records"
      }
    }

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
       {selectedTab === 'charts' && <VictoryChartsPage />}
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

