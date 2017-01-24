export declare function isTradingDay(d: String): Promise<boolean>;
export declare function getPreviousTradingDay(date: String): Promise<string>;
export declare function getNextTradingDay(date: String): Promise<string>;
export declare function isMarketOpen(): Promise<boolean>;
