'use client';
import { useEffect, useMemo, useState, useRef } from "react";
import { useDeleteGroupFilterMutation, useFetchDimensionsDataQuery, useFetchGroupFiltersQuery, useSaveGroupFilterMutation } from "@/lib/services/usersApi";
import { testCase2ProductId, useDeleteTestCase2GroupFilterMutation, useFetchTestCase2DimensionsQuery, useFetchTestCase2groupFiltersQuery, useTestCase2saveGroupFilterMutation } from "@/lib/services/testCase2Api";
import { transformTestCase2ToTestCase1 } from "@/lib/testCase2Transformer";


export interface GroupFilter {
  id: number;
  group_name: string;
  filtered_selections: DimensionSelection[];
  created_at: string;
  updated_at: string;
  created_by: string;
  total_dimensions: number;
  total_members: number;
}

interface Selection {
  dimension: string;
  members: (string | number)[];
}

type DimensionSelection = {
  dimension: string;
  members: (string | number)[];
};

type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

interface SavedGroupFilter {
  id: number;
  group_name: string;
  filtered_selections: DimensionSelection[];
  created_at: string;
  updated_at: string;
  created_by: string;
  total_dimensions: number;
  total_members: number;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (datas: Dimensions) => void;
  testCase?: string;
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const useUnifiedDimensionsData = (testCase: string) => {
  const testCase1Result = useFetchDimensionsDataQuery({}, { skip: testCase !== 'test-case-1' });
  const testCase2Result = useFetchTestCase2DimensionsQuery({ productId: testCase2ProductId }, { skip: testCase !== 'test-case-2' });

  if (testCase === 'test-case-1') {
    return {
      data: testCase1Result.data,
      error: testCase1Result.error,
      isLoading: testCase1Result.isLoading,
    };
  } else {
    return {
      data: testCase2Result.data ? transformTestCase2ToTestCase1(testCase2Result.data) : {},
      error: testCase2Result.error,
      isLoading: testCase2Result.isLoading,
    };
  }
};

export const useFetchUnifiedGroupFilters = (testCase: string) => {
  const testCase1Result = useFetchGroupFiltersQuery({}, { skip: testCase !== 'test-case-1' })
  const testCase2Result = useFetchTestCase2groupFiltersQuery({}, { skip: testCase !== 'test-case-2' });

  if (testCase === 'test-case-1') {
    return {
      data: testCase1Result.data,
      error: testCase1Result.error,
      isLoading: testCase1Result.isLoading,
      refetch: testCase1Result.refetch,
    };
  } else {
    return {
      data: testCase2Result.data,
      error: testCase2Result.error,
      isLoading: testCase2Result.isLoading,
      refetch: testCase2Result.refetch,
    };
  }
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onCreateGroup, testCase = 'test-case-1' }) => {
  const { data, error, isLoading } = useUnifiedDimensionsData(testCase);
  const { data: filterData, error: filterError, isLoading: filterIsLoading, refetch: refetchGroupFilters } = useFetchUnifiedGroupFilters(testCase);


  const [saveGroupFilter] = useSaveGroupFilterMutation();
  const [testCase2saveGroupFilter] = useTestCase2saveGroupFilterMutation();

  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [groupName, setGroupName] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [validationError, setValidationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allDimensions, setAllDimensions] = useState<{ dimension: string; values: (string | number)[] }[]>([]);
  // const [savedGroups, setSavedGroups] = useState<SavedGroupFilter[]>(mockSavedGroups);

  const processedDimensions = useMemo(() => {
    if (!data || !data.success || !data.dimensions) return [];

    const dims = [];

    if (data.dimensions.fiscalyear) {
      dims.push({
        dimension: "fiscalyear",
        values: data.dimensions.fiscalyear.map((year: any) => Number(year))
      });
    }

    if (data.dimensions.country) {
      dims.push({
        dimension: "country",
        values: data.dimensions.country
      });
    }

    if (data.dimensions.period) {
      dims.push({
        dimension: "period",
        values: data.dimensions.period
      });
    }

    if (data.dimensions.continent) {
      dims.push({
        dimension: "continent",
        values: data.dimensions.continent
      });
    }

    if (data.dimensions.cataccountingview) {
      dims.push({
        dimension: "cataccountingview",
        values: data.dimensions.cataccountingview
      });
    }

    if (data.dimensions.catfinancialview) {
      dims.push({
        dimension: "catfinancialview",
        values: data.dimensions.catfinancialview
      });
    }

    return dims;
  }, [data]);

  useEffect(() => {
    if (isLoading || !data) return;

    try {
      if (data.success && data.dimensions) {
        setAllDimensions(prev =>
          JSON.stringify(prev) !== JSON.stringify(processedDimensions)
            ? processedDimensions
            : prev
        );

        setSelections(prev =>
          prev.length === 0
            ? processedDimensions.map(d => ({
              dimension: d.dimension,
              members: [],
            }))
            : prev
        );
      }
    } catch (err) {
      console.error("Error processing dimensions data:", err);
      setSaveError("Failed to process dimensions data");
    }
  }, [data, isLoading, processedDimensions]);

  const toggleMember = (dimension: string, member: string | number) => {
    setSelections(prev =>
      prev.map(sel =>
        sel.dimension === dimension
          ? {
            ...sel,
            members: sel.members.includes(member)
              ? sel.members.filter(m => m !== member)
              : [...sel.members, member]
          }
          : sel
      )
    );
    setValidationError("");
    setSaveError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setValidationError("");

    const filteredSelections = selections.filter(s => s.members.length > 0);

    if (!groupName.trim()) {
      setValidationError("Please enter a group name");
      setIsSaving(false);
      return;
    }

    if (filteredSelections.length === 0) {
      setValidationError("Please select at least one item from any dimension");
      setIsSaving(false);
      return;
    }

    try {
      const result = testCase === 'test-case-1'
        ? await saveGroupFilter({
          groupName: groupName.trim(),
          filteredSelections
        }).unwrap()
        : await testCase2saveGroupFilter({
          groupName: groupName.trim(),
          filteredSelections
        }).unwrap();
      await refetchGroupFilters()
      if (result.success) {
        onCreateGroup({
          groupName: groupName.trim(),
          filteredSelections
        });

        setGroupName("");
        setSelections(prev => prev.map(sel => ({ ...sel, members: [] })));
        onClose();
      } else {
        setSaveError("Failed to save group filter");
      }
    } catch (err: any) {
      console.error("Error saving group filter:", err);
      setSaveError(err?.data?.detail || "Failed to save group filter to server");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSavedGroup = (savedGroup: SavedGroupFilter) => {
    onCreateGroup({
      groupName: savedGroup.group_name,
      filteredSelections: savedGroup.filtered_selections
    });
    onClose();
  };

  const handleClose = () => {
    if (!isSaving) {
      setGroupName("");
      setSelections(prev => prev.map(sel => ({ ...sel, members: [] })));
      setValidationError("");
      setSaveError("");
      setActiveTab('create');
      onClose();
    }
  };



  const getDimensionDisplayName = (dimension: string) => {
    return dimension.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Group Filter Manager</h2>
              <p className="text-sm text-gray-500 mt-1">Create new or select existing group filters</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-200"
              disabled={isSaving}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-200 ${activeTab === 'create'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              Create New Group
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-200 ${activeTab === 'saved'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
              Saved Groups ({filterData?.group_filters?.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'create' && (
            <div>
              {isLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-3"></div>
                    <p className="text-blue-700 text-sm">Loading dimensions...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm">Failed to load dimensions. Please try again.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter a descriptive group name"
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="space-y-4">
                  {allDimensions.map(dim => (
                    <div key={dim.dimension} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {getDimensionDisplayName(dim.dimension)}
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {selections.find(s => s.dimension === dim.dimension)?.members.length || 0} selected
                        </span>
                      </label>

                      <div className="bg-white border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                        {dim.values.length === 0 ? (
                          <p className="text-gray-500 text-sm">No options available</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {dim.values.map(value => {
                              const isSelected = selections
                                .find(s => s.dimension === dim.dimension)?.members
                                .includes(value);
                              return (
                                <label key={String(value)} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors duration-150">
                                  <input
                                    type="checkbox"
                                    checked={!!isSelected}
                                    onChange={() => toggleMember(dim.dimension, value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    disabled={isSaving}
                                  />
                                  <span className="text-sm text-gray-700">{String(value)}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {validationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{validationError}</p>
                  </div>
                )}

                {saveError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{saveError}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isSaving || isLoading || !!error}
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Create Group'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              {filterData?.group_filters?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-300 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No saved groups yet</h3>
                  <p className="text-gray-500 mb-6">Create your first group filter to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group Filter
                  </button>
                </div>
              ) : (
                <GroupListComponents
                  filterData={filterData?.group_filters}
                  handleSelectSavedGroup={handleSelectSavedGroup}
                  getDimensionDisplayName={getDimensionDisplayName}
                  refetchGroupFilters={refetchGroupFilters}
                  testCase={testCase}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface GroupListComponentsProps {
  filterData: GroupFilter[];
  handleSelectSavedGroup: (group: GroupFilter) => void;
  getDimensionDisplayName: (dimension: string) => string;
  refetchGroupFilters: () => void;
  testCase: string;
}

export const GroupListComponents: React.FC<GroupListComponentsProps> = ({
  filterData = [],
  handleSelectSavedGroup,
  getDimensionDisplayName,
  refetchGroupFilters,
  testCase,
}) => {
  const [deleteGroupTestCase1] = useDeleteGroupFilterMutation();
  const [deleteGroupTestCase2] = useDeleteTestCase2GroupFilterMutation();

  const handleDeleteGroup = async (groupName: string) => {
    try {
      if (testCase === 'test-case-1') {
        await deleteGroupTestCase1(groupName).unwrap();
      } else {
        await deleteGroupTestCase2(groupName).unwrap();
      }
     
      
      await refetchGroupFilters();
      alert("Group Deleted")
      console.log(`Deleted group: ${groupName}`);
    } catch (error) {
      console.error('Failed to delete group', error);
    }
  }
  return (
    <div className="space-y-4">
      {filterData?.map(group => (
        <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-medium text-gray-800">{group.group_name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Created by {group.created_by} • {formatDate(group.created_at)}
              </p>
            </div>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {group.total_dimensions} dimensions
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {group.total_members} members
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filtered Selections:</h4>
            <div className="space-y-2">
              {group.filtered_selections.map((selection, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {getDimensionDisplayName(selection.dimension)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {selection.members.length} items
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selection.members.slice(0, 4).map((member, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-gray-600 border border-gray-200">
                        {String(member)}
                      </span>
                    ))}
                    {selection.members.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        +{selection.members.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <button
              onClick={() => handleSelectSavedGroup(group)}
              className="cursor-pointer w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Use This Group
            </button>

            <button
              onClick={() => handleDeleteGroup(group.group_name)}
              className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
              aria-label="Delete Group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-4h2a1 1 0 011 1v1H8V4a1 1 0 011-1z"
                />
              </svg>
            </button>
          </div>

        </div>
      ))}
    </div>
  )
}
