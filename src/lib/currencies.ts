export type Currency = {
  code: string;
  name: string;
};

// Pinned first per SPEC.md: SGD plus common Singaporean travel/work destinations.
export const PINNED_CURRENCIES: Currency[] = [
  { code: "SGD", name: "Singapore Dollar" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "THB", name: "Thai Baht" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KRW", name: "South Korean Won" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "US Dollar" },
];

// Additional currencies available in the full list, shown after the pinned ones.
export const OTHER_CURRENCIES: Currency[] = [
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "ZAR", name: "South African Rand" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "EGP", name: "Egyptian Pound" },
];

export const ALL_CURRENCIES: Currency[] = [
  ...PINNED_CURRENCIES,
  ...OTHER_CURRENCIES,
];

export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Rent",
  "Transport",
  "Utilities",
  "Entertainment",
  "Travel",
  "Shopping",
  "Other",
] as const;
