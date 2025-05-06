export interface Post {
    id: number;
    userId : number;
    title : string;
    body: string;
}

export interface Person {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    city: string;
    country: string;
  }

export type UserSchema = {
    id: number;
    name: string;
    email: string;
  };

export interface FinancialSchema {
  fiscalYear: string;
  period: string;
  revenue: string;
  operatingExpenses: string;
  netProfit: string;
  [key: string]: string; // Allow for additional fields
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
