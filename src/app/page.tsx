'use client'
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    BarChart3,
    Database,
    FileText,
    TrendingUp,
    Code,
    ExternalLink,
    TestTube,
    Layers,
    Home,
    ArrowUpRight,
    LucideIcon
} from 'lucide-react';
import { MetaDataSection } from './(home)/MetaDataSection';
import { ApiDocumentation } from './(home)/ApiDocumentation';
import { DashboardTools } from './(home)/DashboardTools';
import Link from 'next/link';

// Types
type NavigationItemSchema = {
    id: string;
    label: string;
    icon: LucideIcon;
};

interface apiMethodsSchema {
    method: string;
    endpoint: string;
    description: string;
}

interface testCaseSchema {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    status: string;
    recordsCount: string;
    apiEndpoint: string;
    dashboardUrl: string;
    lastUpdated: string;
    tools: string[];
    features: string[];
    apiMethods: apiMethodsSchema[]
}

// Navigations
const NAVIGATIONITEMS: NavigationItemSchema[] = [
    { id: 'overview', label: 'Project Overview', icon: Home },
    { id: 'testcases', label: 'Test Cases', icon: TestTube },
    { id: 'tools', label: 'Dashboard Tools', icon: Layers },
    { id: 'apis', label: 'API Documentation', icon: Code },
    { id: 'metadata', label: 'Metadata', icon: Database }
];

const DashboardHomepage = () => {
    const [activeSection, setActiveSection] = useState('overview');


    // Test Case Data with detailed API information
    const testCases: testCaseSchema[] = [
        {
            id: 'test-case-1',
            name: 'Test Case 1 - Basic Financial Dashboard',
            subtitle: 'Single table financial data visualization with comprehensive KPIs',
            description: "Test Case 1 validates the Elphi system’s core architecture by integrating two decoupled services—an application backend and a data platform backend.",
            status: 'Complete',
            recordsCount: '1,000,000',
            apiEndpoint: '/api/v1/financial-data',
            dashboardUrl: '/dashboard/financial',
            lastUpdated: '2024-01-15',
            tools: ['AG Charts', 'Chart.js', 'React Plotly', "Nivo Charts", "VIctory CHarts", 'Echarts', 'Highcharts', 'Syncfusion Charts', 'AG Grid (Table)', "Tanstack Table", 'React Table'],
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
            description: "",
            status: 'In Progress',
            recordsCount: '1,000,000',
            apiEndpoint: '/api/v1/pl-analysis',
            dashboardUrl: '/dashboard/pl-analysis',
            lastUpdated: '2024-01-20',
            tools: ['AG Charts', 'Chart.js', 'React Plotly', "Nivo Charts", "VIctory CHarts", 'Echarts', 'Highcharts', 'Syncfusion Charts', 'AG Grid (Table)', "Tanstack Table", 'React Table'],
            features: ['P&L Statements', 'Account Categories', 'Multi-table Joins', 'Drill-down Analysis'],
            apiMethods: [
                { method: 'GET', endpoint: '/api/v1/pl-analysis', description: 'P&L analysis data' },
                { method: 'GET', endpoint: '/api/v1/accounts', description: 'Account categories' },
                { method: 'GET', endpoint: '/api/v1/categories', description: 'Financial categories' }
            ]
        }
    ];


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="text-white" size={24} />
                            </div>
                            <div className='hidden xl:block'>
                                <h1 className="text-xl font-bold text-gray-900">Dashboard Tools Testing</h1>
                                <p className="text-sm text-gray-600">Enterprise Chart Libraries Evaluation</p>
                            </div>
                        </div>
                        <nav className="hidden md:flex space-x-3 xl:space-x-8">
                            {NAVIGATIONITEMS.map((item) => (
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
                                    <div className="text-3xl font-bold">9</div>
                                    <div className="text-sm opacity-90">Total Chart Tools</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold">6</div>
                                    <div className="text-sm opacity-90">Open Source Tools</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                    <div className="text-3xl font-bold">3</div>
                                    <div className="text-sm opacity-90">Paid Tools</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 col-span-2 md:col-span-2">
                                    <div className="text-xl font-bold">Test Case 1</div>
                                    <div className="text-sm opacity-90">1,000,000 Records</div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 col-span-2 md:col-span-2">
                                    <div className="text-xl font-bold">Test Case 2</div>
                                    <div className="text-sm opacity-90">Records</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Access Links */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => setActiveSection('apis')}>
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
                                        <h3 className="font-semibold text-lg">Test Case 1 Api Documentation</h3>
                                        <p className="text-sm text-gray-600">Financial metrics dashboard</p>
                                    </div>
                                </div>
                                <Link href={'https://testcase.mohammedsifankp.online/docs'} target='_blank' className="flex items-center justify-between">
                                    <span className="text-green-600 font-medium">View Documentation</span>
                                    <ArrowUpRight size={16} className="text-green-600" />
                                </Link>
                            </Card>

                            <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                        <TrendingUp className="text-purple-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Test Case 2 Api Documentation</h3>
                                        <p className="text-sm text-gray-600">Financial metrics dashboard</p>
                                    </div>
                                </div>
                                <Link href={`https://testcase2.mohammedsifankp.online/docs`} target='_blank' className="flex items-center justify-between">
                                    <span className="text-purple-600 font-medium">View Dashboard</span>
                                    <ArrowUpRight size={16} className="text-purple-600" />
                                </Link>
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
                                <TestCaseCard testCase={testCase} key={testCase?.id} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Dashboard Tools Section */}
                {activeSection === 'tools' && (<DashboardTools />)}

                {/* API Documentation Section */}
                {activeSection === 'apis' && (<ApiDocumentation />)}
                {activeSection === 'metadata' && (<MetaDataSection />)}
            </main>
        </div>
    );
};

interface TestCaseCardProps {
    testCase: testCaseSchema;
}

const TestCaseCard: React.FC<TestCaseCardProps> = ({ testCase }) => {
    return (
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
            </div>

            {/* Tools Used */}
            <div className="">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{testCase?.id === 'test-case-1' ? 'Dashboard Tools Used' : "Dashboard Tools (In Progress)"}</h4>
                <div className="flex flex-wrap gap-2">
                    {testCase.tools.map((tool, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {tool}
                        </span>
                    ))}
                </div>
            </div>

            <p className="text-sm text-gray-600">{testCase.description}</p>
        </Card>
    )
}

export default DashboardHomepage;