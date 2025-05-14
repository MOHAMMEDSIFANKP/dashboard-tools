import { Dimensions } from "@/types/Schemas";

export const MONTHS: { [key: string]: string } = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12"
  };
export const buildWhereClause = (
    dimensions: Dimensions | null
): string => {
  

  if (!dimensions?.filteredSelections?.length) return "";

  const clauses = dimensions.filteredSelections.map((dim) => {
    if (dim.dimension.toLowerCase() === "period") {
      const selectedMonths = dim.members.map(month => MONTHS[month]);

      const yearSelection = dimensions?.filteredSelections?.find(
        d => d.dimension.toLowerCase() === "fiscalyear"
      );
      const selectedYears = yearSelection ? yearSelection.members : [];

      if (selectedYears.length === 0) {
        return `(${selectedMonths.map(month =>
          `SUBSTR(CAST(period AS TEXT), 5, 2) = '${month}'`
        ).join(" OR ")})`;
      }

      const fullPeriods = selectedYears.flatMap(year =>
        selectedMonths.map(month => `'${year}${month}'`)
      );

      return `period IN (${fullPeriods.join(", ")})`;
    } else {
      const members = dim.members.map((member: string) => `'${member}'`).join(", ");
      return `${dim.dimension.toLowerCase()} IN (${members})`;
    }
  });

  return `WHERE ${clauses.join(" AND ")}`;
};
