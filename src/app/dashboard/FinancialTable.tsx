"use client"
import { useMemo } from "react"
import type { FinancialData } from "@/types/Schemas"

interface FinancialTableProps {
  monthData: FinancialData[]
  yearData: FinancialData[]
}

export default function FinancialTable({ monthData, yearData }: FinancialTableProps) {
  
  // Process data function to reduce duplication
  const processData = (data:FinancialData[]) => {
    if (!data || data.length === 0) {
      return {
        revenue: 0,
        otherIncome: 0,
        grossMargin: 0,
        operatingExpenses: 0,
        operatingProfit: 0,
        financialResult: 0,
        earningsBeforeTax: 0,
        nonRecurringResult: 0,
        netProfit: 0,
        costOfSales: 0,
      }
    }

    const record = data[0]
    
    // Calculate COS (Cost of Sales) as revenue - grossMargin
    const costOfSales = record.revenue - record.grossMargin
    
    return {
      revenue: record.revenue,
      otherIncome: record.otherIncome,
      grossMargin: record.grossMargin,
      operatingExpenses: record.operatingExpenses,
      operatingProfit: record.operatingProfit,
      financialResult: record.FinancialResult,
      earningsBeforeTax: record.EarningsBeforeTax,
      nonRecurringResult: record.nonRecurringResult,
      netProfit: record.netProfit,
      costOfSales: costOfSales,
    }
  }

  // Process the month and year data
  const processedMonthData = useMemo(() => processData(monthData), [monthData])
  const processedYearData = useMemo(() => processData(yearData), [yearData])

  // Calculate percentage helper function to reduce duplication
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? (value / total) * 100 : 0;
  };
  

  // Calculate derived values
  const monthMarginPercentage = useMemo(() => 
    calculatePercentage(processedMonthData.grossMargin, processedMonthData.revenue),
    [processedMonthData]
  )

  const yearMarginPercentage = useMemo(() => 
    calculatePercentage(processedYearData.grossMargin, processedYearData.revenue),
    [processedYearData]
  )

  const monthOpexPercentage = useMemo(() => 
    calculatePercentage(processedMonthData.operatingExpenses, processedMonthData.revenue),
    [processedMonthData]
  )

  const yearOpexPercentage = useMemo(() => 
    calculatePercentage(processedYearData.operatingExpenses, processedYearData.revenue),
    [processedYearData]
  )

  const monthNetProfitPercentage = useMemo(() => 
    calculatePercentage(processedMonthData.netProfit, processedMonthData.revenue),
    [processedMonthData]
  )

  const yearNetProfitPercentage = useMemo(() => 
    calculatePercentage(processedYearData.netProfit, processedYearData.revenue),
    [processedYearData]
  )

  // Helper function to render cell values
  const renderCell = (value:any) => {
    if (value === null || value === undefined) return "-"
    if (value === "#VALUE!") return "#VALEUR!"
    if (value === "#DIV/0!") return "#DIV/0!"

    // Format numbers
    if (typeof value === "number") {
      return new Intl.NumberFormat("fr-FR").format(value)
    }

    return value
  }

  // Helper function for row styling
  const getRowStyle = (category:string) => {
    switch (category) {
      case "REVENUE":
      case "MARGIN":
      case "OPEX":
      case "EBITDA":
      case "EBIT":
      case "NET PROFIT":
        return "bg-gray-800 text-white font-bold"
      case "COS":
        return "bg-gray-700 text-white font-bold"
      case "MG %":
      case "OPEX %":
      case "NET PROFIT %":
        return "bg-blue-100"
      default:
        return ""
    }
  }

  // Function to determine if a value is negative (for coloring)
  const getValueColor = (value:number) => {
    return typeof value === "number" && value < 0 ? "text-red-600" : ""
  }

  // Helper to create table row with data
  const createTableRow = (label:string, category:string, monthValue:number, yearValue:number, isPercentage:boolean = false, indented:boolean = false) => {
    const formattedMonthValue = isPercentage ? 
      renderCell(monthValue.toFixed(2) + " %") : 
      renderCell(monthValue)
      
    const formattedYearValue = isPercentage ? 
      renderCell(yearValue.toFixed(2) + " %") : 
      renderCell(yearValue)
      
    const monthColor = getValueColor(monthValue)
    const yearColor = getValueColor(yearValue)
    
    return (
      <tr className={getRowStyle(category)}>
        <td className={`border p-2 ${indented ? "pl-8" : ""}`}>{label}</td>
        <td className={`border p-2 text-center ${monthColor}`}>{formattedMonthValue}</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className={`border p-2 text-center ${yearColor}`}>{formattedYearValue}</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
        <td className="border p-2 text-center">-</td>
      </tr>
    )
  }

  // Helper for percentage rows with fewer columns
  const createPercentageRow = (label:string, category:string, monthValue:number, yearValue:number) => {
    return (
      <tr className={getRowStyle(category)}>
        <td className="border p-2">{label}</td>
        <td className="border p-2 text-center">{renderCell(monthValue.toFixed(2) + " %")}</td>
        <td className="border p-2 text-center" colSpan={6}></td>
        <td className="border p-2 text-center">{renderCell(yearValue.toFixed(2) + " %")}</td>
        <td className="border p-2 text-center" colSpan={6}></td>
      </tr>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-left w-[200px]">En €</th>
            <th className="border p-0 bg-blue-600 text-white text-center" colSpan={7}>
              <div className="p-2">Month</div>
            </th>
            <th className="border p-0 bg-blue-600 text-white text-center" colSpan={7}>
              <div className="p-2">YTD</div>
            </th>
          </tr>
          <tr>
            <th className="border p-2 text-left"></th>
            {/* Month columns */}
            <th className="border p-2 bg-blue-500 text-white text-center">Actual</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Budget</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Variance</th>
            <th className="border p-2 bg-blue-500 text-white text-center">% Ach.</th>
            <th className="border p-2 bg-blue-500 text-white text-center">M-1</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Variance</th>
            <th className="border p-2 bg-blue-500 text-white text-center">% Growth</th>

            {/* YTD columns */}
            <th className="border p-2 bg-blue-500 text-white text-center">Actual</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Budget</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Variance</th>
            <th className="border p-2 bg-blue-500 text-white text-center">% Ach.</th>
            <th className="border p-2 bg-blue-500 text-white text-center">M-1</th>
            <th className="border p-2 bg-blue-500 text-white text-center">Variance</th>
            <th className="border p-2 bg-blue-500 text-white text-center">% Growth</th>
          </tr>
        </thead>
        <tbody>
          {/* REVENUE Section */}
          {createTableRow("REVENUE", "REVENUE", processedMonthData.revenue, processedYearData.revenue)}

          {/* COS Section */}
          {createTableRow("COS (Cost of Sales)", "COS", -processedMonthData.costOfSales, -processedYearData.costOfSales)}
          {createTableRow("Sous-traitance", "", -processedMonthData.costOfSales, -processedYearData.costOfSales, false, true)}

          {/* MARGIN Section */}
          {createTableRow("MARGIN", "MARGIN", processedMonthData.grossMargin, processedYearData.grossMargin)}
          {createTableRow("MG %", "MG %", monthMarginPercentage, yearMarginPercentage, true, true)}

          {/* OPEX Section */}
          {createTableRow("OPEX", "OPEX", -processedMonthData.operatingExpenses, -processedYearData.operatingExpenses)}
          {createTableRow("OPEX %", "OPEX %", monthOpexPercentage, yearOpexPercentage, true, true)}
          {createTableRow("Finance & Accounting", "", processedMonthData.financialResult, processedYearData.financialResult, false, true)}

          {/* EBITDA Section */}
          {createTableRow("EBITDA", "EBITDA", processedMonthData.operatingProfit, processedYearData.operatingProfit)}
          {createTableRow("Résultat Exceptionnel", "", processedMonthData.nonRecurringResult, processedYearData.nonRecurringResult, false, true)}

          {/* Gross Margin */}
          {createTableRow("Gross Margin", "MARGIN", processedMonthData.grossMargin, processedYearData.grossMargin)}

          {/* Percentage rows with special format */}
          {createPercentageRow("Gross Margin %", "MG %", monthMarginPercentage, yearMarginPercentage)}
          {createTableRow("Operating Expenses", "OPEX", -processedMonthData.operatingExpenses, -processedYearData.operatingExpenses)}
          {createPercentageRow("Operating Expenses %", "OPEX %", monthOpexPercentage, yearOpexPercentage)}
          {createTableRow("Net Profit", "NET PROFIT", processedMonthData.netProfit, processedYearData.netProfit)}
          {createPercentageRow("Net Profit %", "NET PROFIT %", monthNetProfitPercentage, yearNetProfitPercentage)}
        </tbody>
      </table>
    </div>
  )
}