'use client';
import { useEffect, useState } from "react";
import { useDuckDBContext } from "../app/_providers/DuckDBContext";

interface Selection {
  dimension: string;
  members: string[];
}

type DimensionSelection = {
  dimension: string;
  members: string[];
};

type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (datas:Dimensions) => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onCreateGroup }) => {
  const { executeQuery } = useDuckDBContext();
  const [groupName, setGroupName] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [validationError, setValidationError] = useState("");
  const [alldimensions, setAllDimensions] = useState<{ dimension: string; values: string[] }[]>([]);

  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        const [yearRes, countryRes, periodRes] = await Promise.all([
          executeQuery("SELECT DISTINCT fiscalYear FROM financial_data ORDER BY fiscalYear"),
          executeQuery("SELECT DISTINCT country FROM financial_data ORDER BY country"),
          executeQuery("SELECT DISTINCT substr(CAST(period AS VARCHAR), 5, 2) AS monthNum FROM financial_data")
        ]);

        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        const dims = [
          yearRes.success && {
            dimension: "fiscalYear",
            values: yearRes?.data?.map((r: { fiscalYear: string }) => r.fiscalYear)
          },
          countryRes.success && {
            dimension: "Country",
            values: countryRes?.data?.map((r: { country: string }) => r.country)
          },
          periodRes.success && {
            dimension: "period",
            values:monthNames
          }
        ].filter(Boolean) as { dimension: string; values: string[] }[];

        setAllDimensions(dims);
        setSelections(dims.map(d => ({ dimension: d.dimension, members: [] })));
      } catch (err) {
        console.error("Failed fetching dimension values:", err);
      }
    };

    fetchDimensions();
  }, []);

  const toggleMember = (dimension: string, member: string) => {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredSelections = selections.filter(s => s.members.length > 0);

    if (!groupName) {
      setValidationError("Please enter a group name");
      return;
    }

    if (filteredSelections.length === 0) {
      setValidationError("Please select at least one item from any dimension");
      return;
    }

    onCreateGroup({groupName:groupName, filteredSelections});
    onClose();
    setGroupName("")
    // setSelections([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter group name"
            />
          </div>

          {alldimensions.map(dim => (
            <div key={dim.dimension} className="mb-4">
              <label className="block text-sm font-medium mb-2">{dim.dimension}</label>
              <div className="border border-gray-300 rounded p-2 max-h-40 overflow-y-auto">
                {dim.values.map(value => {
                  const isSelected = selections.find(s => s.dimension === dim.dimension)?.members.includes(value);
                  return (
                    <div key={value} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => toggleMember(dim.dimension, value)}
                        className="mr-2"
                      />
                      <label>{value}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {validationError && <p className="text-red-500 text-sm">{validationError}</p>}

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
