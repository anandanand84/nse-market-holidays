"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const request = require("request-promise");
const cheerio = require("cheerio");
const moment = require("moment-timezone");
const cron_1 = require("cron");
var PubSub = require('simple-pubsub');
var pubsub = new PubSub();
const holidayList = new Array();
const monthArray = { "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06", "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12" };
var common_headers = {
    "method": "GET",
    "headers": {
        "Host": "nseindia.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "deflate,sdch",
        "Cookie": "pointer=1; sym1=SHYAMCENT",
        "Accept-Language": "en-US,en;q=0.8,de;q=0.6,fr;q=0.4",
        "Referer": "https://www.nseindia.com/products/content/equities/indices/nifty_500.htm"
    }
};
let holidaysPromise = (function () {
    return __awaiter(this, void 0, void 0, function* () {
        var hollidayResponse = yield request(Object.assign({ "url": "https://www.nseindia.com/products/content/derivatives/irf/mrkt_timing_holidays.htm", "encoding": null }, common_headers));
        var $ = cheerio.load(hollidayResponse);
        var hollidayTable = $('.holiday_list');
        hollidayTable[0].children.forEach(function (tr, index) {
            if (index < 4)
                return;
            let date = tr.children[1].children[0].data;
            let jsdate = date.split('-');
            let month = monthArray[jsdate[1]];
            holidayList.push(moment.tz(jsdate[2] + '-' + month + '-' + jsdate[0], "Asia/Kolkata"));
        });
        return true;
    });
})();
function _isTradingDay(d) {
    return __awaiter(this, void 0, void 0, function* () {
        yield holidaysPromise;
        let holiday = holidayList.filter(function (date) {
            return date.isSame(d);
        });
        var day = d.weekday();
        var weekEnd = ((day == 6) || (day == 0));
        return holiday.length === 0 && !weekEnd;
    });
}
function isTradingDay(d = moment.tz('Asia/Kolkata').format()) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield _isTradingDay(moment.tz(d, 'Asia/Kolkata'));
    });
}
exports.isTradingDay = isTradingDay;
function getPreviousTradingDay(date = moment.tz('Asia/Kolkata').format()) {
    return __awaiter(this, void 0, void 0, function* () {
        var compareDate = moment.tz(date, "Asia/Kolkata");
        var lastTradingDay;
        while (!lastTradingDay) {
            compareDate = compareDate.subtract(1, 'days');
            (yield _isTradingDay(compareDate)) ? (lastTradingDay = compareDate) : null;
        }
        ;
        return lastTradingDay.format("YYYY-MM-DD");
        ;
    });
}
exports.getPreviousTradingDay = getPreviousTradingDay;
function getNextTradingDay(date = moment.tz('Asia/Kolkata').format()) {
    return __awaiter(this, void 0, void 0, function* () {
        var compareDate = moment.tz(date, "Asia/Kolkata");
        var lastTradingDay;
        while (!lastTradingDay) {
            compareDate = compareDate.add(1, 'days');
            (yield _isTradingDay(compareDate)) ? (lastTradingDay = compareDate) : null;
        }
        ;
        return lastTradingDay.format("YYYY-MM-DD");
    });
}
exports.getNextTradingDay = getNextTradingDay;
function _isTimeWithinMarketTime(date) {
    let hours = date.get('hours');
    let minutes = date.get('minutes');
    let second = date.get('second');
    if (hours >= 9 && hours < 15) {
        return true;
    }
    else if (hours === 15 && minutes < 30) {
        return true;
    }
    return false;
}
function isMarketOpen() {
    return __awaiter(this, void 0, void 0, function* () {
        var compareDate = moment.tz("Asia/Kolkata");
        return (yield _isTradingDay(compareDate)) && _isTimeWithinMarketTime(compareDate);
    });
}
exports.isMarketOpen = isMarketOpen;
function _notifyMarketOpen() {
    pubsub.publish('MARKET_OPEN', true);
}
function _notifyMarketClose() {
    pubsub.publish('MARKET_CLOSE', true);
}
function subscribeNotifyMarketOpen(callback) {
    return pubsub.subscribe('MARKET_OPEN', callback);
}
exports.subscribeNotifyMarketOpen = subscribeNotifyMarketOpen;
;
function subscribeNotifyMarketClose(callback) {
    return pubsub.subscribe('MARKET_CLOSE', callback);
}
exports.subscribeNotifyMarketClose = subscribeNotifyMarketClose;
;
function unSubscribeNotifyMarketClose(subscriberId) {
    return pubsub.unsubscribe(subscriberId);
}
exports.unSubscribeNotifyMarketClose = unSubscribeNotifyMarketClose;
;
function unSubscribeNotifyMarketOpen(subscriberId) {
    return pubsub.unsubscribe(subscriberId);
}
exports.unSubscribeNotifyMarketOpen = unSubscribeNotifyMarketOpen;
function timeToOpen() {
    return __awaiter(this, void 0, void 0, function* () {
        var trading = yield isMarketOpen();
        var tradingDay = yield isTradingDay();
        let mom = moment().tz('Asia/Kolkata');
        let hours = mom.get('hours');
        let date = mom.format("YYYY-MM-DD");
        let beforeMarketOpen;
        if (hours < 9) {
            beforeMarketOpen = true;
        }
        if (trading) {
            return 'OPEN';
        }
        if (tradingDay && beforeMarketOpen) {
            return 'Opens ' + moment(date + 'T09:15:00.000+05:30').tz('Asia/Kolkata').fromNow();
        }
        else {
            var nextTradingDay = yield getNextTradingDay(moment.tz('Asia/Kolkata').format('YYYY-MM-DD'));
            return 'Opens ' + moment(nextTradingDay + 'T09:15:00.000+05:30').tz('Asia/Kolkata').fromNow();
        }
    });
}
exports.timeToOpen = timeToOpen;
try {
    new cron_1.CronJob('00 00 09 * * 1-5', function () {
        return __awaiter(this, void 0, void 0, function* () {
            var tradingDay = yield _isTradingDay(moment.tz('Asia/Kolkata'));
            if (tradingDay) {
                _notifyMarketOpen();
            }
        });
    }, null, true, 'Asia/Kolkata');
    new cron_1.CronJob('00 30 15 * * 1-5', function () {
        return __awaiter(this, void 0, void 0, function* () {
            var tradingDay = yield _isTradingDay(moment.tz('Asia/Kolkata'));
            if (tradingDay) {
                _notifyMarketClose();
            }
        });
    }, null, true, 'Asia/Kolkata');
}
catch (err) {
    console.error('Invalid cron job', err);
}
timeToOpen().then(console.log);
