import React from 'react'
import { Shield, Tag, Clock, User, AlertTriangle, Database, CheckCircle, LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';


const dummyMetadataResponse = {
    "success": true,
    "product_id": "data_1m_product_v1",
    "resolved_product_id": "data_1m",
    "actual_table_name": "data_1m",
    "metadata_summary": {
        "product_metadata": {
            "id": 1,
            "entity_id": "data_1m",
            "entity_type": "data_product",
            "sensitivity": "confidential",
            "classification": "financial",
            "compliance_level": "sox",
            "custom_metadata": {
                "department": "finance",
                "region": "EMEA",
                "upload_source": "financial_data_1M.csv",
                "upload_timestamp": "2025-07-18T06:43:26.368139",
                // "processing_pipeline": "enhanced_upload_api",
                // "auto_metadata_creation": true
            },
            "retention_period": 2555,
            "access_restrictions": [
                "finance_only",
                "management_approval"
            ],
            "data_owner": "finance_team",
            "steward": "john.doe@company.com",
            "created_at": "2025-07-18T06:43:26.369137",
            "updated_at": "2025-07-18T06:43:26.369137",
            "version": 1,
            "is_active": true,
            "labels": [
                {
                    "id": 1,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_category_revenue",
                    "label_type": "category",
                    "label_value": "revenue",
                    "description": "",
                    "created_at": "2025-07-18T06:43:26.377000",
                    "created_by": "upload_api",
                    "is_active": true
                },
                {
                    "id": 2,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_source_file_upload",
                    "label_type": "source",
                    "label_value": "file_upload",
                    "description": "Data uploaded from file: financial_data_1M.csv",
                    "created_at": "2025-07-18T06:43:26.381000",
                    "created_by": "upload_api",
                    "is_active": true
                },
                {
                    "id": 3,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_classification_financial",
                    "label_type": "classification",
                    "label_value": "financial",
                    "description": "Data classified as: financial",
                    "created_at": "2025-07-18T06:43:26.386000",
                    "created_by": "upload_api",
                    "is_active": true
                },
                {
                    "id": 4,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_sensitivity_confidential",
                    "label_type": "sensitivity",
                    "label_value": "confidential",
                    "description": "Data sensitivity level: confidential",
                    "created_at": "2025-07-18T06:43:26.390000",
                    "created_by": "upload_api",
                    "is_active": true
                },
                {
                    "id": 5,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_compliance_sox",
                    "label_type": "compliance",
                    "label_value": "sox",
                    "description": "Compliance requirement: SOX",
                    "created_at": "2025-07-18T06:43:26.394000",
                    "created_by": "upload_api",
                    "is_active": true
                },
                {
                    "id": 6,
                    "entity_id": "data_1m",
                    "entity_type": "data_product",
                    "label_id": "data_1m_data_product_business_domain_finance",
                    "label_type": "business_domain",
                    "label_value": "finance",
                    "description": "Business domain: finance",
                    "created_at": "2025-07-18T06:43:26.399000",
                    "created_by": "upload_api",
                    "is_active": true
                }
            ],
            "success": true,
            "is_legacy": false
        },
        "metadata_coverage": {
            "product_has_metadata": true,
            "table_has_metadata": false,
                "columns_with_metadata": 0,
            "total_columns_checked": 5
        }
    },
    "recommendations": [
        "Use metadata for data governance and compliance",
        "Review sensitivity classifications regularly",
        "Update data owner and steward information as needed",
        "Add custom labels for better data discovery"
    ]
};
export function MetaDataSection() {
    return (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Metadata</h2>
                    <p className="text-lg text-gray-600">Comprehensive metadata information for Test Case 2</p>
                </div>

                {/* Note about Test Case 1 */}
                {/* <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-yellow-600" size={24} />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Test Case 1 - No Metadata</h3>
                            <p className="text-sm text-gray-600">Test Case 1 does not include metadata features and focuses on basic dashboard functionality.</p>
                        </div>
                    </div>
                </Card> */}

                {/* Test Case 2 Metadata */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Database className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900">Test Case 2 - Metadata Overview</h3>
                            <p className="text-gray-600">Product ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{dummyMetadataResponse.product_id}</code></p>
                        </div>
                    </div>

                    {/* Core Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <MetadataCard
                            title="Sensitivity"
                            value={dummyMetadataResponse.metadata_summary.product_metadata.sensitivity}
                            icon={Shield}
                            color="red"
                        />
                        <MetadataCard
                            title="Classification"
                            value={dummyMetadataResponse.metadata_summary.product_metadata.classification}
                            icon={Tag}
                            color="blue"
                        />
                        <MetadataCard
                            title="Compliance Level"
                            value={dummyMetadataResponse.metadata_summary.product_metadata.compliance_level.toUpperCase()}
                            icon={CheckCircle}
                            color="green"
                        />
                        <MetadataCard
                            title="Data Owner"
                            value={dummyMetadataResponse.metadata_summary.product_metadata.data_owner}
                            icon={User}
                            color="purple"
                        />
                        <MetadataCard
                            title="Steward"
                            value={dummyMetadataResponse.metadata_summary.product_metadata.steward}
                            icon={User}
                            color="blue"
                        />
                        <MetadataCard
                            title="Retention Period"
                            value={`${dummyMetadataResponse.metadata_summary.product_metadata.retention_period} days`}
                            icon={Clock}
                            color="yellow"
                        />
                    </div>

                    {/* Access Restrictions */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Access Restrictions</h4>
                        <div className="flex flex-wrap gap-2">
                            {dummyMetadataResponse.metadata_summary.product_metadata.access_restrictions.map((restriction, index) => (
                                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                                    {restriction}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Custom Metadata */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Custom Metadata</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(dummyMetadataResponse.metadata_summary.product_metadata.custom_metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                        <span className="text-sm font-medium text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-sm text-gray-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Labels</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {dummyMetadataResponse.metadata_summary.product_metadata.labels.map((label, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                            {label.label_type}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{label.label_value}</span>
                                    </div>
                                    {label.description && (
                                        <p className="text-xs text-gray-600">{label.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata Coverage */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Metadata Coverage</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {dummyMetadataResponse.metadata_summary.metadata_coverage.product_has_metadata ? 'Yes' : 'No'}
                                </div>
                                <div className="text-sm text-gray-600">Product Has Metadata</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {dummyMetadataResponse.metadata_summary.metadata_coverage.columns_with_metadata}
                                </div>
                                <div className="text-sm text-gray-600">Columns With Metadata</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {dummyMetadataResponse.metadata_summary.metadata_coverage.total_columns_checked}
                                </div>
                                <div className="text-sm text-gray-600">Total Columns Checked</div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <ul className="space-y-2">
                                {dummyMetadataResponse.recommendations.map((recommendation, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                                        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        {recommendation}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
    )
}

type MetadataCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
};


function MetadataCard({ title, value, icon: Icon, color = "blue" }:MetadataCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        yellow: "bg-yellow-50 text-yellow-600",
        purple: "bg-purple-50 text-purple-600"
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-600">{title}</h4>
                    <p className="text-lg font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
