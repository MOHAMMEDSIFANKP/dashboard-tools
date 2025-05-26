import { Dimensions } from "@/types/Schemas";
  // Build request body for API calls
  export const buildRequestBody = (dimensions: Dimensions | null, chartType: string, groupBy?: string) => {
    const body: any = {
      chartType,
      limit: 1000,
    };

    if (groupBy) {
      body.groupBy = groupBy;
    }

    if (dimensions) {
      body.dimensions = {
        groupName: dimensions.groupName,
        filteredSelections: dimensions.filteredSelections
      };
    }

    return body;
  };
