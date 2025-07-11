'use client'
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    BarChart3,
    Database,
    Globe,
    FileText,
    TrendingUp,
    BookOpen,
    Code,
    ExternalLink,
    TestTube,
    Layers,
    CheckCircle,
    Home,
    Server,
    Eye,
    ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ApiEntry {
    method: "GET" | "POST";
    endpoint: string;
    description: string;
    testCase: string;
    records: string;
    used: boolean;
}


const DashboardHomepage = () => {
    const router = useRouter()
    const [activeSection, setActiveSection] = useState('overview');

    // Test Case Data with detailed API information
    const testCases = [
        {
            id: 'test-case-1',
            name: 'Test Case 1 - Basic Financial Dashboard',
            subtitle: 'Single table financial data visualization with comprehensive KPIs',
            description:"Test Case 1 validates the Elphi system’s core architecture by integrating two decoupled services—an application backend and a data platform backend.",
            status: 'Complete',
            recordsCount: '1 Million',
            apiEndpoint: '/api/v1/financial-data',
            dashboardUrl: '/dashboard/financial',
            lastUpdated: '2024-01-15',
            tools: ['AG Charts', 'Chart.js', 'React Plotly', "Nivo Charts", "VIctory CHarts", 'Echarts', 'AG Grid', "Tanstack Table", 'React Table'],
            features: ['KPI Cards', 'Revenue Trends', 'Performance Metrics', 'Data Grid'],
            apiMethods: [
                { method: 'GET', endpoint: '/api/v1/financial-data', description: 'Fetch financial records' },
                { method: 'POST', endpoint: '/api/v1/chart-data', description: 'Get chart data with filters' }
            ]
        },
        {
            id: 'test-case-2',
            name: 'Test Case 2 - P&L Dashboard',
            subtitle: 'Multi-table join structure for Profit & Loss analysis with account categories',
            description:"",
            status: 'In Progress',
            recordsCount: '',
            apiEndpoint: '/api/v1/pl-analysis',
            dashboardUrl: '/dashboard/pl-analysis',
            lastUpdated: '2024-01-20',
            tools: [],
            features: ['P&L Statements', 'Account Categories', 'Multi-table Joins', 'Drill-down Analysis'],
            apiMethods: [
                { method: 'GET', endpoint: '/api/v1/pl-analysis', description: 'P&L analysis data' },
                { method: 'GET', endpoint: '/api/v1/accounts', description: 'Account categories' },
                { method: 'GET', endpoint: '/api/v1/categories', description: 'Financial categories' }
            ]
        }
    ];

    // Dashboard Tools with detailed specifications
    const dashboardTools = [
        {
            name: 'AG Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Real-time Updates',
                'Multi-series Support',
                'Enterprise Grade',
                'Drill Down',
                'Legend Toggle',
                'Custom Buttons',
                'Export Options (PNG, SVG, CSV)',
                'Filtering Support',
                'Next.js Integration',
            ],
            documentation: 'https://charts.ag-grid.com/documentation/',
            status: 'Active'
        },
        {
            name: 'Chart.js',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Responsive',
                'Animated',
                'Canvas Based',
                'Lightweight',
                'Custom Buttons',
                'Legend Toggle',
                'Next.js Integration',
            ],
            documentation: 'https://www.chartjs.org/docs/',
            status: 'Active'
        },
        {
            name: 'React Plotly',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'High Quality Export (PNG, JPEG, SVG)',
                'Interactive Charts',
                'Custom Config Buttons',
                'Legend Toggle',
                'Next.js Integration',
            ],
            documentation: 'https://plotly.com/javascript/react/',
            status: 'Active'
        },
        {
            name: 'Nivo Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'SVG Based',
                'Theme Support',
                'Legend Toggle',
                'Drill Down (Custom)',
                'Next.js Integration',
            ],
            documentation: 'https://nivo.rocks/',
            status: 'Active'
        },
        {
            name: 'Victory Charts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Legend Toggle',
                'Custom UI Controls',
                'Next.js Integration',
            ],
            documentation: 'https://formidable.com/open-source/victory/',
            status: 'Active'
        },
        {
            name: 'ECharts',
            type: 'Open Source',
            category: 'Chart Library',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Interactive Charts',
                'Drill Down',
                'Custom Toolbox Configs',
                'Legend Toggle',
                'Export to Image',
                'Next.js Integration',
            ],
            documentation: 'https://echarts.apache.org/en/index.html',
            status: 'Active'
        },
        {
            name: 'AG Grid',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Virtual Scrolling',
                'Filtering',
                'Sorting',
                'Editable Cells',
                'Pagination',
                'Excel Export',
                'Column Reordering',
                'Next.js Integration'
            ],
            documentation: 'https://ag-grid.com/documentation/',
            status: 'Active'
        },
        {
            name: 'Tanstack Table',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'High',
            usedIn: ['Test Case 1'],
            features: [
                'Filtering',
                'Sorting',
                'Pagination',
                'Column Reordering',
                'Headless Customization',
                'Next.js Integration'
            ],
            documentation: 'https://tanstack.com/table/v8',
            status: 'Active'
        },
        {
            name: 'React Table',
            type: 'Open Source',
            category: 'Data Grid',
            performance: 'Medium',
            usedIn: ['Test Case 1'],
            features: [
                'Filtering',
                'Sorting',
                'Pagination',
                'Lightweight',
                'Next.js Integration'
            ],
            documentation: 'https://react-table.tanstack.com/',
            status: 'Active'
        }
    ];

    const apiData: ApiEntry[] = [
        // ✅ Test Case 1 - Frontend Used
        { method: "GET", endpoint: "/dashboard/financial-data", description: "Fetch financial records", testCase: "Test Case 1", records: "1 Million", used: true },
        { method: "POST", endpoint: "/dashboard/all-charts", description: "Get chart data with filters", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "POST", endpoint: "/dashboard/drill-down", description: "Drill-down data", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "POST", endpoint: "/dashboard/group-filter", description: "Save user group filters", testCase: "Test Case 1", records: "Variable", used: true },
        { method: "GET", endpoint: "/dashboard/available-years/{table}", description: "Available fiscal years", testCase: "Test Case 1", records: "Dynamic", used: true },
        { method: "GET", endpoint: "/dashboard/tables/{table}/dimensions", description: "Get dimension info", testCase: "Test Case 1", records: "Metadata", used: true },
        { method: "GET", endpoint: "/duckdb/tables/{table}/data", description: "Table data (filtered)", testCase: "Test Case 1", records: "Paginated", used: true },
        { method: "GET", endpoint: "/duckdb/tables/{table}/search-info", description: "Table column info", testCase: "Test Case 1", records: "Metadata", used: true },

        // 🚧 Test Case 2 - Backend Only
        // { method: "POST", endpoint: "/upload/", description: "File upload API", testCase: "Test Case 2", records: "Backend Only", used: false },
        // { method: "POST", endpoint: "/upload/trigger-analytics", description: "Kicks off backend processing", testCase: "Test Case 2", records: "Backend Only", used: false },
        // { method: "GET", endpoint: "/performance/history", description: "Returns performance history", testCase: "Test Case 2", records: "Backend Only", used: false },
    ];



    const navigationItems = [
        { id: 'overview', label: 'Project Overview', icon: Home },
        { id: 'testcases', label: 'Test Cases', icon: TestTube },
        { id: 'tools', label: 'Dashboard Tools', icon: Layers },
        { id: 'apis', label: 'API Documentation', icon: Code }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Dashboard Tools Testing</h1>
                                <p className="text-sm text-gray-600">Enterprise Chart Libraries Evaluation</p>
                            </div>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            {navigationItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === item.id
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon size={16} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="space-y-8">
                        {/* Hero Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl">
                            <h2 className="text-4xl font-bold mb-4">Dashboard Tools Testing Platform</h2>
                            <p className="text-xl mb-6">Comprehensive evaluation of charting libraries and dashboard tools for enterprise financial applications</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold">2</div>
                                    <div className="text-sm opacity-90">Test Cases</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold">6</div>
                                    <div className="text-sm opacity-90">Chart Tools</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold">1 Million</div>
                                    <div className="text-sm opacity-90">Total Records</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold"></div>
                                    <div className="text-sm opacity-90">API Endpoints</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Access Links */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={()=>setActiveSection('apis')}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <FileText className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">General API Documentation</h3>
                                        <p className="text-sm text-gray-600">Complete API reference guide</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-600 font-medium">View Documentation</span>
                                    <ExternalLink size={16} className="text-blue-600" />
                                </div>
                            </Card>

                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                        <BarChart3 className="text-green-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Test Case 1 Dashboard</h3>
                                        <p className="text-sm text-gray-600">Financial metrics dashboard</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-green-600 font-medium">View Dashboard</span>
                                    <ArrowUpRight size={16} className="text-green-600" />
                                </div>
                            </Card>

                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <TrendingUp className="text-purple-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Test Case 2 </h3>
                                        <p className="text-sm text-gray-600"></p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-purple-600 font-medium">View Dashboard</span>
                                    <ArrowUpRight size={16} className="text-purple-600" />
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Test Cases Section */}
                {activeSection === 'testcases' && (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Test Cases Overview</h2>
                            <p className="text-lg text-gray-600">Detailed information about each test case, including API endpoints and record counts</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {testCases.map((testCase) => (
                                <Card key={testCase.id} className="p-6 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${testCase.status === 'Complete' ? 'bg-green-100' : 'bg-yellow-100'
                                                }`}>
                                                <TestTube className={`${testCase.status === 'Complete' ? 'text-green-600' : 'text-yellow-600'
                                                    }`} size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">{testCase.name}</h3>
                                                <p className="text-sm text-gray-600">{testCase.subtitle}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${testCase.status === 'Complete'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {testCase.status}
                                        </span>
                                    </div>

                                    {/* Test Case Details */}
                                    <div className="grid grid-cols-1 gap-4 mb-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Database size={16} className="text-gray-600" />
                                                <span className="text-sm font-medium text-gray-600">Records Count</span>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{testCase.recordsCount}</div>
                                        </div>
                                        {/* <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Server size={16} className="text-gray-600" />
                                                <span className="text-sm font-medium text-gray-600">API Endpoint</span>
                                            </div>
                                            <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">{testCase.apiEndpoint}</code>
                                        </div> */}
                                    </div>

                                    {/* API Methods */}
                                    {/* <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">API Methods</h4>
                                        <div className="space-y-2">
                                            {testCase.apiMethods.map((api, index) => (
                                                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                                        api.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {api.method}
                                                    </span>
                                                    <code className="text-sm text-gray-700">{api.endpoint}</code>
                                                    <span className="text-xs text-gray-500 ml-auto">{api.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div> */}

                                    {/* Tools Used */}
                                    <div className="">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Dashboard Tools Used</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {testCase.tools.map((tool, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                     <p className="text-sm text-gray-600">{testCase.description}</p>

                                    {/* Action Button */}
                                    {/* <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2">
                                        <Eye size={16} />
                                        View Dashboard
                                    </button> */}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dashboard Tools Section */}
                {activeSection === 'tools' && (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Tools & Tables</h2>
                            <p className="text-lg text-gray-600">Comprehensive evaluation of charting libraries and visualization tools</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dashboardTools.map((tool, index) => (
                                <Card key={index} className="p-6 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tool.type === 'Commercial' ? 'bg-purple-100' : 'bg-green-100'
                                                }`}>
                                                <Layers className={`${tool.type === 'Commercial' ? 'text-purple-600' : 'text-green-600'
                                                    }`} size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                                                <p className="text-sm text-gray-600">{tool.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${tool.type === 'Commercial'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {tool.type}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${tool.status === 'Active'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Performance Indicator */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">Performance</span>
                                            <span className={`text-sm font-semibold ${tool.performance === 'High' ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                {tool.performance}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${tool.performance === 'High' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`}
                                                style={{ width: tool.performance === 'High' ? '90%' : '70%' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Used In */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Used In</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {tool.usedIn.map((testCase, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    {testCase}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h4>
                                        <div className="space-y-1">
                                            {tool.features.map((feature, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircle size={12} className="text-green-500" />
                                                    <span className="text-xs text-gray-600">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Documentation Link */}
                                    <Link href={tool?.documentation} target='_blank' className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                        <BookOpen size={16} />
                                        View Documentation
                                        <ExternalLink size={14} />
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* API Documentation Section */}
                {activeSection === 'apis' && (
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
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">General API Info</h3>
                                    <Link href="https://testcase.mohammedsifankp.online/docs" target='_blank' className="text-sm text-gray-600">Base URL: <code>https://testcase.mohammedsifankp.online/docs/</code></Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            </div>
                        </Card>

                        {/* Test Case 1 */}
                        <Card className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">🧪 Test Case 1 - Frontend Used APIs</h3>
                            <ApiTable apis={apiData.filter(api => api.testCase === "Test Case 1")} />
                        </Card>

                        {/* Test Case 2 */}
                        <Card className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">🛠 Test Case 2 - Backend Side APIs (Not yet used)</h3>
                            <ApiTable apis={apiData.filter(api => api.testCase === "Test Case 2")} />
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};

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
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  api.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {api.method}
                </span>
              </td>
              <td className="py-3 px-4">
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{api.endpoint}</code>
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


export default DashboardHomepage;