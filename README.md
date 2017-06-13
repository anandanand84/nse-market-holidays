# nse-market-holidays
Get national stock exchange(india) market timing and holidays

## API

```
export declare function isTradingDay(d: String): Promise<boolean>;
export declare function getPreviousTradingDay(date: String): Promise<string>;
export declare function getNextTradingDay(date: String): Promise<string>;
export declare function isMarketOpen(): Promise<boolean>;
export declare function subscribeNotifyMarketOpen(callback: any): any;
export declare function subscribeNotifyMarketClose(callback: any): any;
export declare function unSubscribeNotifyMarketClose(subscriberId: any): any;
export declare function unSubscribeNotifyMarketOpen(subscriberId: any): any;
export declare function timeToOpen(): Promise<string>;
```
## Examples
```
var NSE = require("nse-market-holidays");

NSE.getNextTradingDay('2017-06-12').then(function(date) {
    console.log('Next trading day is '+date);
});

NSE.isTradingDay('2017-06-12').then(function(isTradingDay) {
    console.log('Is trading day : '+isTradingDay);
});

NSE.getPreviousTradingDay('2017-06-12').then(function(date) {
    console.log('Previous trading day is '+date);
});

NSE.timeToOpen().then(function(timetoopen) {
    console.log("Market " +timetoopen);
});
let subscriptionKeyClose = NSE.subscribeNotifyMarketClose(function() {
    //This will be called when market closes
});
let subscriptionKeyOpen = NSE.subscribeNotifyMarketOpen(function() {
    //This will be called when market opens
});

//For more details take a look at
//https://raw.githubusercontent.com/anandanand84//master/test/index-spec.ts
```
[Try it out](https://runkit.com/anandaravindan/nsemarketholidays)

