'use client';
import { useEffect, useState } from "react";
import { useFetchDimensionsDataQuery, useSaveGroupFilterMutation } from "@/lib/services/usersApi";

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

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (datas: Dimensions) => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const { data, error, isLoading } = useFetchDimensionsDataQuery({});
  const [saveGroupFilter] = useSaveGroupFilterMutation();
  
  const [groupName, setGroupName] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [validationError, setValidationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [allDimensions, setAllDimensions] = useState<{ dimension: string; values: (string | number)[] }[]>([]);

  useEffect(() => {
    if (isLoading || !data) return;
    
    try {
      if (data.success && data.dimensions) {
        const dims = [];
        
        // Map API response to our dimension structure
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
        
        setAllDimensions(dims);
        
        // Initialize selections
        const initialSelections: Selection[] = dims.map(d => ({
          dimension: d.dimension,
          members: [],
        }));
        
        setSelections(initialSelections);
      }
    } catch (err) {
      console.error("Error processing dimensions data:", err);
      setValidationError("Failed to load dimension data");
    }

    if (error) {
      console.error("Error fetching dimensions:", error);
      setValidationError("Failed to fetch dimensions from server");
    }
  }, [data, isLoading, error]);

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
      // Save to API first
      const result = await saveGroupFilter({
        groupName: groupName.trim(),
        filteredSelections
      }).unwrap();
      
      if (result.success) {
        // If API save successful, notify parent component
        onCreateGroup({ 
          groupName: groupName.trim(), 
          filteredSelections 
        });
        
        // Reset form and close modal
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

  const handleClose = () => {
    if (!isSaving) {
      setGroupName("");
      setSelections(prev => prev.map(sel => ({ ...sel, members: [] })));
      setValidationError("");
      setSaveError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Group Filter</h2>
        
        {isLoading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p>Loading dimensions...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Failed to load dimensions. Please try again.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Group Name *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
              disabled={isSaving}
              required
            />
          </div>

          {allDimensions.map(dim => (
            <div key={dim.dimension} className="mb-4">
              <label className="block text-sm font-medium mb-2 capitalize">
                {dim.dimension.replace(/([A-Z])/g, ' $1').trim()}
                <span className="text-gray-500 text-xs ml-1">
                  ({selections.find(s => s.dimension === dim.dimension)?.members.length || 0} selected)
                </span>
              </label>
              <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto bg-gray-50">
                {dim.values.length === 0 ? (
                  <p className="text-gray-500 text-sm">No options available</p>
                ) : (
                  dim.values.map(value => {
                    const isSelected = selections
                      .find(s => s.dimension === dim.dimension)?.members
                      .includes(value);
                    return (
                      <div key={String(value)} className="flex items-center mb-1">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleMember(dim.dimension, value)}
                          className="mr-2"
                          disabled={isSaving}
                        />
                        <label className="text-sm cursor-pointer">
                          {String(value)}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}

          {validationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{validationError}</p>
            </div>
          )}
          
          {saveError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{saveError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving || isLoading || !!error}
            >
              {isSaving ? "Saving..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};