import { Card } from '@/components/ui/card'
import { Globe } from 'lucide-react'
import Link from 'next/link';
import React from 'react'

interface ApiEntry {
    method: "GET" | "POST";
    endpoint: string;
    description: string;
    testCase: string;
    records: string;
    used: boolean;
}

 const apiData: ApiEntry[] = [
        // ✅ Test Case 1 - Frontend Used
        { method: "GET", endpoint: "/api/dashboard/financial-data", description: "Fetch financial records", testCase: "Test Case 1", records: "1,000,000", used: true },
        { method: "POST", endpoint: "/api/dashboard/all-charts", description: "Get chart data with filters", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "POST", endpoint: "/api/dashboard/drill-down", description: "Drill-down data", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "POST", endpoint: "/api/dashboard/group-filter", description: "Save user group filters", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "GET", endpoint: "/api/dashboard/available-years/{table}", description: "Available fiscal years", testCase: "Test Case 1", records: "Dynamic", used: true },
        { method: "GET", endpoint: "/api/dashboard/tables/{table}/dimensions", description: "Get dimension info", testCase: "Test Case 1", records: "Metadata", used: true },
        { method: "GET", endpoint: "/api/duckdb/tables/{table}/data", description: "Table data (filtered)", testCase: "Test Case 1", records: "1,000,000 - Paginated", used: true },
        // { method: "GET", endpoint: "/duckdb/tables/{table}/search-info", description: "Table column info", testCase: "Test Case 1", records: "Metadata", used: true },

        // 🚧 Test Case 2 - Backend Only
        { method: "POST", endpoint: "/api/dashboard/all-charts?product_id={Product id}", description: "Fetch all chart data for the dashboard", testCase: "Test Case 2", records: "100,000", used: false },
        { method: "POST", endpoint: "/api/dashboard/drill-down?product_id={Product id}", description: "Fetch Drill Down data", testCase: "Test Case 2", records: "Variable", used: false },
        { method: "GET", endpoint: "/api/dashboard/tables/{Product id}/dimensions", description: "Fetch dimension info with references", testCase: "Test Case 2", records: "Metadata", used: false },
        { method: "POST", endpoint: "/apidashboard/group-filter", description: "Save user group filters", testCase: "Test Case 2", records: "Variable", used: false },
        { method: "GET", endpoint: "/api/data-products/data-products/{Product id}/records", description: "Fetch all table data", testCase: "Test Case 2", records: "100,000 - Paginated", used: false },
        { method: "GET", endpoint: "/api/data-products/data-products/{Product id}/records", description: "Fetch filtered data by fiscal year", testCase: "Test Case 2", records: "Filtered", used: false }
    ];

export function ApiDocumentation() {
    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h2>
                <p className="text-lg text-gray-600">Complete reference of API endpoints by test case</p>
            </div>

            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="text-blue-600" size={24} />
                    </div>
                    <div className='flex flex-col'>
                        <h3 className="text-xl font-semibold text-gray-900">General API Info</h3>
                        <Link href="https://testcase.mohammedsifankp.online/docs" target='_blank' className="text-sm text-gray-600">Base URL (Test Case 1): <code>https://testcase.mohammedsifankp.online/docs/</code></Link>
                        <Link href="https://testcase2.mohammedsifankp.online/docs" target='_blank' className="text-sm text-gray-600">Base URL (Test Case 2): <code>https://testcase2.mohammedsifankp.online/docs/</code></Link>
                    </div>
                </div>
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{apiData.length}</div>
                                    <div className="text-sm text-gray-600">Total Endpoints</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">8</div>
                                    <div className="text-sm text-gray-600">Frontend Used APIs</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">2</div>
                                    <div className="text-sm text-gray-600">Test Cases</div>
                                </div>
                            </div> */}
            </Card>

            {/* Test Case 1 */}
            <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">🧪 Test Case 1 - Frontend Used APIs</h3>
                <ApiTable apis={apiData.filter(api => api?.testCase === "Test Case 1")} />
            </Card>

            {/* Test Case 2 */}
            <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">🛠 Test Case 2 - Frontend Used APIs</h3>
                <ApiTable apis={apiData.filter(api => api?.testCase === "Test Case 2")} />
            </Card>
        </div>
    )
}

function ApiTable({ apis }: { apis: ApiEntry[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left font-semibold text-gray-900">Method</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-900">Endpoint</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-900">Description</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-900">Records</th>
                    </tr>
                </thead>
                <tbody>
                    {apis.map((api, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${api.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {api.method}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 break-all">{api.endpoint}</code>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{api.description}</td>
                            <td className="py-3 px-4 text-gray-900 font-medium">{api.records}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}