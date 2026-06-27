// Israeli Tax Calculator Logic
// Based on 2024 rates

const TAX_RATES = {
  VAT: 0.18,
  INCOME_TAX_ADVANCE: 0.06,
  BITUAH_LEUMI: {
    BRACKET_1_LIMIT: 7522,
    BRACKET_1_RATE: 0.0597,
    BRACKET_2_RATE: 0.1783
  }
};

export function calculateTaxLiability(income, expenses, expensesWithVat = expenses) {
  // VAT Calculation: Output VAT - Input VAT
  const outputVat = income * TAX_RATES.VAT;
  const inputVat = expensesWithVat * TAX_RATES.VAT;
  const vatToPay = outputVat - inputVat;

  // Taxable Income
  const taxableIncome = Math.max(0, income - expenses);

  // Income Tax Advances (Mikdamot) - 6%
  const incomeTaxToPay = taxableIncome * TAX_RATES.INCOME_TAX_ADVANCE;

  // Bituah Leumi - Tiered System
  let bituahLeumiToPay = 0;
  const { BRACKET_1_LIMIT, BRACKET_1_RATE, BRACKET_2_RATE } = TAX_RATES.BITUAH_LEUMI;
  
  if (taxableIncome <= BRACKET_1_LIMIT) {
    bituahLeumiToPay = taxableIncome * BRACKET_1_RATE;
  } else {
    bituahLeumiToPay = (BRACKET_1_LIMIT * BRACKET_1_RATE) + 
                       ((taxableIncome - BRACKET_1_LIMIT) * BRACKET_2_RATE);
  }

  // Total Tax Liability
  const totalTax = vatToPay + incomeTaxToPay + bituahLeumiToPay;

  // Net Profit after all taxes
  const netProfit = income - expenses - incomeTaxToPay - bituahLeumiToPay;

  return {
    vatToPay: Math.round(vatToPay),
    taxableIncome: Math.round(taxableIncome),
    incomeTaxToPay: Math.round(incomeTaxToPay),
    bituahLeumiToPay: Math.round(bituahLeumiToPay),
    totalTax: Math.round(totalTax),
    netProfit: Math.round(netProfit),
    outputVat: Math.round(outputVat),
    inputVat: Math.round(inputVat)
  };
}

export function calculateExpenseSavings(expenseAmount) {
  // Approximate savings from adding an expense:
  // VAT: 18% (if has VAT receipt)
  // Income Tax: 6% (advance rate)
  // Bituah Leumi: ~16% (average rate)
  // Total: ~40% of the expense comes back
  
  const vatSaving = expenseAmount * 0.18;
  const incomeTaxSaving = expenseAmount * 0.06;
  const bituahLeumiSaving = expenseAmount * 0.16; // Average estimate
  
  const totalSaving = vatSaving + incomeTaxSaving + bituahLeumiSaving;
  const savingPercentage = 0.40; // ~40%
  
  return {
    vatSaving: Math.round(vatSaving),
    incomeTaxSaving: Math.round(incomeTaxSaving),
    bituahLeumiSaving: Math.round(bituahLeumiSaving),
    totalSaving: Math.round(totalSaving),
    savingPercentage: Math.round(savingPercentage * 100)
  };
}

export { TAX_RATES };