import { WidgetConfig } from "@/types/widget";
import { LayoutTemplate, TrendingUp, Wallet } from "lucide-react";

export type DashboardTemplate = {
    id: string;
    name: string;
    description: string;
    icon: any;
    widgets: WidgetConfig[];
};

// Helper constants for API URLs
const APIs = {
    ALPHA_VANTAGE_DAILY: "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo", // Demo default for charts
    COINGECKO: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=100&page=1&sparkline=false",
    FINNHUB: "/api/finnhub/quote",
    INDIAN_STOCK: "/api/indian-stock",
};

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
    {
        id: "stock-trader",
        name: "Stock Trader",
        description: "Real-time Indian market data and US Tech watchlist",
        icon: TrendingUp,
        widgets: [
            {
                id: "st-1",
                title: "NSE Most Active",
                type: "table",
                api: { url: APIs.INDIAN_STOCK, refreshInterval: 60 },
                fields: ["price", "percent_change", "volume"],
                fieldFormats: {
                    "price": "currency",
                    "percent_change": "percent"
                }
            },
            {
                id: "st-2",
                title: "US Tech Watchlist",
                type: "card",
                api: { url: APIs.FINNHUB, refreshInterval: 60 },
                card: {
                    variant: "watchlist",
                    tickerField: "AAPL",
                    watchlistTickers: ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA"],
                    availableTickers: [
                        { ticker: "AAPL", company: "Apple Inc" },
                        { ticker: "MSFT", company: "Microsoft Corp" },
                        { ticker: "GOOGL", company: "Alphabet Inc" },
                        { ticker: "NVDA", company: "Nvidia Corp" },
                        { ticker: "TSLA", company: "Tesla Inc" },
                    ]
                },
            },
            {
                id: "st-3",
                title: "IBM Daily Chart (Demo)",
                type: "chart",
                api: { url: APIs.ALPHA_VANTAGE_DAILY, refreshInterval: 300 },
                chart: { interval: "daily", variant: "candle" },
            },
        ],
    },
    {
        id: "crypto-trader",
        name: "Crypto Tracker",
        description: "Monitor major cryptocurrencies and trends",
        icon: Wallet,
        widgets: [
            {
                id: "ct-1",
                title: "Crypto Watchlist",
                type: "card",
                api: { url: APIs.COINGECKO, refreshInterval: 60 },
                card: {
                    variant: "watchlist",
                    tickerField: "BTC", // Validation placeholder
                    watchlistTickers: ["BTC", "ETH", "SOL", "DOGE"], // Uppercase to match API normalization
                    availableTickers: [
                        { ticker: "BTC", company: "Bitcoin" },
                        { ticker: "ETH", company: "Ethereum" },
                        { ticker: "SOL", company: "Solana" },
                        { ticker: "DOGE", company: "Dogecoin" },
                    ]
                },
            },
            {
                id: "ct-2",
                title: "Top 24h Movers",
                type: "card",
                api: { url: APIs.COINGECKO, refreshInterval: 60 },
                card: { variant: "gainers" },
            },
            {
                id: "ct-3",
                title: "Bitcoin Live",
                type: "card",
                api: { url: APIs.COINGECKO, refreshInterval: 60 },
                card: {
                    variant: "performance",
                    primaryTicker: "BTC",
                    tickerField: "BTC",
                    availableTickers: [
                        { ticker: "BTC", company: "Bitcoin" },
                    ]
                },
            },
        ],
    },
    {
        id: "market-overview",
        name: "Market Overview",
        description: "Global view: Indian Stocks, US Tech, and Crypto",
        icon: LayoutTemplate,
        widgets: [
            {
                id: "mo-1",
                title: "Key Metrics (AAPL)",
                type: "card",
                api: { url: `${APIs.FINNHUB}?symbol=AAPL`, refreshInterval: 60 },
                fields: ["c", "d", "dp", "h", "l"],
                fieldFormats: {
                    "c": "currency",
                    "dp": "percent"
                },
                card: {
                    variant: "financial",
                    tickerField: "AAPL",
                    primaryTicker: "AAPL",
                    availableTickers: [
                        { ticker: "AAPL", company: "Apple Inc" },
                    ]
                },
            },
            {
                id: "mo-2",
                title: "NSE Active Stocks",
                type: "table",
                api: { url: APIs.INDIAN_STOCK, refreshInterval: 60 },
                fields: ["price", "percent_change"],
                fieldFormats: {
                    "price": "currency",
                    "percent_change": "percent"
                }
            },
            {
                id: "mo-3",
                title: "Crypto Watchlist",
                type: "card",
                api: { url: APIs.COINGECKO, refreshInterval: 60 },
                card: {
                    variant: "watchlist",
                    tickerField: "BTC",
                    watchlistTickers: ["BTC", "ETH", "SOL", "DOGE"],
                    availableTickers: [
                        { ticker: "BTC", company: "Bitcoin" },
                        { ticker: "ETH", company: "Ethereum" },
                        { ticker: "SOL", company: "Solana" },
                        { ticker: "DOGE", company: "Dogecoin" },
                    ]
                },
            },
        ],
    },
];
