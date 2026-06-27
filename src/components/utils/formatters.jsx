export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M ₪`;
  }
  
  return `${amount.toLocaleString('he-IL')} ₪`;
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return num.toLocaleString('he-IL');
};