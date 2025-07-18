import Link from 'next/link';
import React from 'react';

interface ApiEndpoint {
    method: string;
    api: string;
    apiName: string;
    description?: string;
    testCase: string;
}

interface DashboardInfoCardProps {
    apiEndpoints: ApiEndpoint[];
    availableFeatures: { feature: string; supported: boolean, link?: string }[];
    dataRecords: { [testCase: string]: string };
    className?: string;
}

const DashboardInfoCard: React.FC<DashboardInfoCardProps> = ({
    apiEndpoints,
    availableFeatures,
    dataRecords,
    className = ""
}) => {
    const testCases = ["test-case-1", "test-case-2"];

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'bg-green-100 text-green-800';
            case 'POST':
                return 'bg-blue-100 text-blue-800';
            case 'PUT':
                return 'bg-yellow-100 text-yellow-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={`bg-white m-5 p-4 rounded-lg shadow-lg border border-gray-100  ${className}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Test Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Features Information */}
                    <div className="bg-green-50 p-3 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Available Features</h3>
                        <div className="space-y-1 text-sm">
                            {availableFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center">
                                    <span className={`${feature?.supported ? "text-green-500" : "text-red-500"} mr-2`}>{feature?.supported ? "✓" : "x"}</span>
                                    <span>{feature?.feature}</span>
                                    {feature?.link && <Link href={feature?.link} className='px-1 bg-blue-50 text-blue-800'>- {feature?.link}</Link>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Records Information */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2"></path>
                            </svg>
                            Data Records Overview
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {testCases.map((testCase) => (
                                <div
                                    key={testCase}
                                    className="flex items-center justify-between bg-white rounded-md px-4 py-3 shadow border border-purple-100"
                                >
                                    <span className="text-gray-700 font-medium">
                                        {testCase.replace("-", " ").toUpperCase()}
                                    </span>
                                    <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                                        {dataRecords[testCase]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* API Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded">
                    {testCases.map((testCase) => (
                        <div key={testCase} className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2">
                                API Endpoints {testCase.replace("-", " ").toUpperCase()}
                            </h3>
                            <div className="space-y-2 gap-1 text-sm">
                                {apiEndpoints
                                    .filter((endpoint) => endpoint.testCase === testCase)
                                    .map((endpoint, index) => (
                                        <Link href={endpoint.api} key={index}>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getMethodColor(
                                                    endpoint.method
                                                )}`}
                                            >
                                                {endpoint.method.toUpperCase()}
                                            </span>
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                                                {endpoint.apiName}
                                            </code>
                                            {endpoint.description && (
                                                <p className="text-gray-600 mt-1 ml-12 text-xs">
                                                    {endpoint.description}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default DashboardInfoCard;

// Usage example:
/*
const apiEndpoints = [
  { method: "GET", api: "/api/v1/financial-data", description: "Fetch financial records" },
  { method: "POST", api: "/api/v1/chart-data", description: "Get chart data with filters" }
];

const availableFeatures = [
  "Drill Down",
  "Cross-Chart Filtering", 
  "Interactive Charts",
  "Export Options (PNG, CSV)",
  "Real-time Data Support",
  "Custom Buttons"
];

<DashboardInfoCard 
  apiEndpoints={apiEndpoints}
  availableFeatures={availableFeatures}
  dataRecords="100K Data"
/>
*/