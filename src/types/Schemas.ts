export interface Post {
    id: number;
    userId : number;
    title : string;
    body: string;
}

export interface FinancialSchema {
  fiscalYear: number;
  period: string;
  catAccountingView: string;
  catFinancialView: string;
  revenue: number;
  otherincome: number;
  grossmargin: number;
  operatingexpenses: number;
  operatingprofit: number;
  financialresult: number;
  earningsbeforetax: number;
  nonrecurringresult: number;
  netProfit: number;
  country?: string;
  continent?: string;
}

export interface FinancialData {
  fiscalYear: number
  period: string
  catAccountingView: string
  catFinancialView: string
  revenue: number
  otherIncome: number
  grossMargin: number
  operatingExpenses: number
  operatingProfit: number
  FinancialResult: number
  EarningsBeforeTax: number
  nonRecurringResult: number
  netProfit: number
  country: string
  continent: string
  
}

export interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
}

type DimensionSelection = {
  dimension: string;
  members: string[];
};

export type Dimensions = {
  groupName: string;
  filteredSelections: DimensionSelection[];
};

// Api Response
export interface FinancialDataResponse {
  table_name: string;
  total_rows: number;
  limit: number;
  offset: number;
  data: FinancialData[];
}