export declare function isTradingDay(d?: String): Promise<boolean>;
export declare function getPreviousTradingDay(date?: String): Promise<string>;
export declare function getNextTradingDay(date?: String): Promise<string>;
export declare function isMarketOpen(): Promise<boolean>;
export declare function subscribeNotifyMarketOpen(callback: any): any;
export declare function subscribeNotifyMarketClose(callback: any): any;
export declare function unSubscribeNotifyMarketClose(subscriberId: any): any;
export declare function unSubscribeNotifyMarketOpen(subscriberId: any): any;
export declare function timeToOpen(): Promise<string>;
