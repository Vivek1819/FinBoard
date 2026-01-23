
export const FORMAT_OPTIONS = [
    { value: "default", label: "Default" },
    { value: "currency-usd", label: "Currency (USD)" },
    { value: "currency-inr", label: "Currency (INR)" },
    { value: "percent", label: "Percentage" },
    { value: "compact", label: "Compact (1.2M)" },
    { value: "number", label: "Number (1,234.56)" },
];

export function formatValue(value: any, format?: string): string {
    if (value === undefined || value === null) return "—";

    // If value is not a number, return as is unless it's a string that looks like a number
    const num = Number(value);
    if (isNaN(num)) return String(value);

    switch (format) {
        case "currency-usd":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
            }).format(num);

        case "currency-inr":
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
            }).format(num);

        case "percent":
            // Assuming the value is a decimal (0.12 -> 12%)
            // If the value is already scaled (12 -> 1200%), we might need to adjust.
            // Standard convention usually implies raw ratio, but finance APIs sometimes give pre-scaled.
            // For now, standard percent behavior (multiply by 100).
            return new Intl.NumberFormat("en-US", {
                style: "percent",
                maximumFractionDigits: 2,
            }).format(num / 100);

        case "compact":
            return new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(num);

        case "number":
            return new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
            }).format(num);

        default:
            // Default formatting: if it's a large float, limit decimals; otherwise standard string
            if (Math.abs(num) > 0 && Math.abs(num) < 0.01) {
                return num.toExponential(2);
            }
            // Check if it's an integer
            if (Number.isInteger(num)) return String(num);
            return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
}
