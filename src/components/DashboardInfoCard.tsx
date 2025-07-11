import Link from 'next/link';
import React from 'react';

interface ApiEndpoint {
    method: string;
    api: string;
    apiName: string;
    description?: string;
}

interface DashboardInfoCardProps {
    apiEndpoints: ApiEndpoint[];
  availableFeatures: { feature: string; supported: boolean }[];
    dataRecords: string;
    className?: string;
}

const DashboardInfoCard: React.FC<DashboardInfoCardProps> = ({
    apiEndpoints,
    availableFeatures,
    dataRecords,
    className = ""
}) => {
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
        <div className={`bg-white p-4 rounded-lg shadow-lg border border-gray-100 mb-4 ${className}`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Dashboard Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {/* API Information */}
                <div className="bg-blue-50 p-3 rounded">
                    <h3 className="font-medium text-blue-800 mb-2">API Endpoints</h3>
                    <div className="space-y-2 gap-1 text-sm">
                        {apiEndpoints.map((endpoint, index) => (
                            <Link href={endpoint?.api} key={index}>
                                <span className={`px-2 py-1 rounded text-xs font-medium mr-2 ${getMethodColor(endpoint.method)}`}>
                                    {endpoint.method.toUpperCase()}
                                </span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{endpoint.apiName}</code>
                                {endpoint.description && (
                                    <p className="text-gray-600 mt-1 ml-12 text-xs">{endpoint.description}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Features Information */}
                    <div className="bg-green-50 p-3 rounded">
                        <h3 className="font-medium text-green-800 mb-2">Available Features</h3>
                        <div className="space-y-1 text-sm">
                            {availableFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center">
                                   <span className={`${feature?.supported ? "text-green-500" : "text-red-500"} mr-2`}>{feature?.supported ? "✓" : "x"}</span>
                                    <span>{feature?.feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Records Information */}
                    <div className="bg-purple-50 p-3 rounded">
                        <h3 className="font-medium text-purple-800 mb-2">Data Records</h3>
                        <div className="flex justify-center items-center h-full">
                            <span className="text-2xl font-bold text-purple-800">{dataRecords}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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