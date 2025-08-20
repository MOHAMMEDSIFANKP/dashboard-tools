'use client'
import React, { useEffect } from 'react'
import FinancialDashboard from '../ag-charts/FinancialDashboard'
import { TabOption, TabsContainer } from '@/components/ui/TabsContainer'
import DashboardInfoCard from '@/components/DashboardInfoCard'
import EnhancedDashboard from '../dashboard/draggble-dashboard/page'
import { ChartLibrary } from '@/types/Schemas'
import { useDispatch } from 'react-redux'
import { setSelectedLibrary } from '@/store/slices/dashboardSlice'
import HighCharts from './HighCharts'

const dashboardInfoDatas = {
  apiEndpoints: [
    { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/all-charts?table_name=sample_1m", api: "https://testcase.mohammedsifankp.online/api/dashboard/all-charts?table_name=sample_1m", description: "Fetch all chart data for the dashboard" },
    { testCase: "test-case-1", method: "POST", apiName: "api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", api: "https://testcase.mohammedsifankp.online/api/dashboard/drill-down?table_name=sample_1m&chart_type=bar&category=201907&data_type=revenue&value=4299212962.550013", description: "Fetch Drill Down datas" },
    { testCase: "test-case-1", method: "GET", apiName: "api/dashboard/tables/sample_1m/dimensions", api: "https://testcase.mohammedsifankp.online/api/dashboard/tables/sample_1m/dimensions", description: "Fetch dimensions for the dashboard" },
    { testCase: "test-case-1", method: "POST", apiName: "/api/dashboard/charts/compare?table_name={table}", api: "https://testcase.mohammedsifankp.online/api/dashboard/charts/compare?table_name=sample_100k&chart_type=line&year1=2015&year2=2016", description: "Fetch chart comparison data for the selected 2 years" },

    { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/all-charts?product_id=sample_100k_product_v1&exclude_null_revenue=false", description: "Fetch all chart data for the dashboard" },
    { testCase: "test-case-2", method: "POST", apiName: "api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", api: "https://testcase2.mohammedsifankp.online/api/dashboard/drill-down?product_id=sample_100k_product_v1&chart_type=line&category=202010&data_type=revenue&drill_down_level=detailed&include_reference_context=true&exclude_null_revenue=false", description: "Fetch Drill Down datas" },
    { testCase: "test-case-2", method: "GET", apiName: "api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=true", api: "https://testcase2.mohammedsifankp.online/api/dashboard/tables/sample_100k_product_v1/dimensions?include_reference_tables=false", description: "Fetch dimensions for the dashboard" },
      { testCase: "test-case-2", method: "POST", apiName: "/api/dashboard/charts/compare?product_id={Product id}", api: "https://testcase2.mohammedsifankp.online/api/dashboard/charts/compare?product_id=data_1m_product_v1&chart_type=line&year1=2015&year2=2016", description: "Fetch chart comparison data for the selected 2 years" },
  ],
  availableFeatures: [
    { feature: "Drill Down", supported: false },
    { feature: "Cross-Chart Filtering", supported: true },
    { feature: "Interactive Charts", supported: true },
    { feature: "Legend Toggle", supported: true },
    { feature: "Export Options (PNG, CSV)", supported: true },
    { feature: "Real-time Data Support", supported: true },
    { feature: "Custom Options", supported: true },
    { feature: "TypeScript Support", supported: true },
    { feature: "Paid Dashbaord Tools", supported: true },
    { feature: "Drag and Drop. ", supported: true, link: "dashboard/draggble-dashboard" },
  ],
  dataRecords: {
    "test-case-1": "1,000,000 Records",
    "test-case-2": "Records"
  }
}

function Page() {
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = React.useState<TabOption>('tool-test-info')

  const handleLibraryChange = (library: ChartLibrary) => {
    dispatch(setSelectedLibrary(library));
  };

  useEffect(() => {
    handleLibraryChange('highcharts');
  }, []);

  return (
    <>
      <TabsContainer selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'charts' && <HighCharts />}
      {selectedTab === 'table' && <FinancialDashboard />}
      {selectedTab === 'tool-test-info' && (
        <DashboardInfoCard
          apiEndpoints={dashboardInfoDatas.apiEndpoints}
          availableFeatures={dashboardInfoDatas.availableFeatures}
          dataRecords={dashboardInfoDatas.dataRecords}
        />
      )}
      {selectedTab === 'drag-and-drop' && (
        <EnhancedDashboard />
      )}
    </>
  )
}

export default Page

