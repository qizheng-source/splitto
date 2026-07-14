export type Currency = {
  code: string;
  name: string;
  flag: string;
};

// Pinned first per SPEC.md: SGD plus common Singaporean travel/work destinations.
export const PINNED_CURRENCIES: Currency[] = [
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "TWD", name: "Taiwan Dollar", flag: "🇹🇼" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
];

// Additional currencies available in the full list, shown after the pinned ones.
export const OTHER_CURRENCIES: Currency[] = [
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Zloty", flag: "🇵🇱" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "RUB", name: "Russian Ruble", flag: "🇷🇺" },
  { code: "ILS", name: "Israeli Shekel", flag: "🇮🇱" },
  { code: "EGP", name: "Egyptian Pound", flag: "🇪🇬" },
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
