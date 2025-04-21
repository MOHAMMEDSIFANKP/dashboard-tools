"use client";
import React, { useEffect, useState } from "react";
import DataGrid from "@/components/DataGrid";

import { useFinancialData } from '@/app/_providers/financial-data-provider';

export default function AgCarts() {
  const { financialData } = useFinancialData();
  return (
    <section>
      <DataGrid financialData={financialData} />
    </section>
  );
}
