import { Dimensions } from "@/types/Schemas";
  // Build request body for API calls
  export const buildRequestBody = (dimensions: Dimensions | null, chartType: string) => {
    const body: any = {
      chartType,
      limit: 1000,
    };

    // if (groupBy) {
    //   body.groupBy = groupBy;
    // }

    if (dimensions) {
      body.dimensions = {
        groupName: dimensions.groupName,
        filteredSelections: dimensions.filteredSelections
      };
    }

    return body;
  };

export const months: { [key: string]: string } = {
  "01": "january",
  "02": "february",
  "03": "march",
  "04": "april",
  "05": "may",
  "06": "june",
  "07": "july",
  "08": "august",
  "09": "september",
  "10": "october",
  "11": "november",
  "12": "december",
};

export const filterMonthByNumber = (monthData: string): string | undefined => {
  return months[monthData];
};


export const handleCrossChartFilteringFunc = (data: string) => {
  // data format should be like "201501", where "2015" is the year and "01" is the month
  try {    
    // Extract year and month from the period string
    const year = parseInt(data.slice(0, 4));
    const monthNumber = data.slice(4, 6);
    const monthName = filterMonthByNumber(monthNumber);
      
    // Create the cross-filter dimensions object
    const CrossChartFilterData = {
      groupName: `CrossChartFilter_${year}_${monthName}`,
      filteredSelections: [
        {
          dimension: "fiscalyear",
          members: [year]
        },
        {
          dimension: "period", // This should match your API's expected dimension name
          members: [data] // Use the full period string like "201501"
        }
      ]
    };    
    // @ts-ignore
    return CrossChartFilterData;
  } catch (error: any) {
    console.error("Cross filter failed:", error);
    return null
    // setError(`Failed to apply cross-chart filter: ${error.message}`);
  }
};