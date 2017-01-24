import { updateNotifierCheck } from 'tslint/lib/updateNotifier';
import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import * as moment from 'moment-timezone';
import { CronJob } from 'cron';

var pubsub:any = require('simple-pubsub');
  
const holidayList:moment.Moment[] = new Array<moment.Moment>();

interface MonthArray {
    [key: string]: string;
}
const monthArray:MonthArray = { "Jan" : "01", "Feb" : "02", "Mar" : "03", "Apr" : "04", "May" : "05", "Jun" : "06", "Jul" : "07", "Aug" : "08", "Sep" : "09", "Oct" : "10", "Nov" : "11", "Dec" : "12" };

var common_headers = {
    "method" : "GET",
    "headers" : {
        "Host":"nseindia.com",
        "User-Agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36",
        "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding":"deflate,sdch",
        "Cookie":"pointer=1; sym1=SHYAMCENT",
        "Accept-Language":"en-US,en;q=0.8,de;q=0.6,fr;q=0.4",
        "Referer":"https://www.nseindia.com/products/content/equities/indices/nifty_500.htm"
    }
}

let holidaysPromise  = (async function() {
    var hollidayResponse = await request(Object.assign({"url" : "https://www.nseindia.com/products/content/derivatives/irf/mrkt_timing_holidays.htm", "encoding" : null}, common_headers));
    var $ = cheerio.load(hollidayResponse);
    var hollidayTable:any = $('.holiday_list');

    hollidayTable[0].children.forEach(function(tr:any, index:Number) { 
        if(index < 4) return;
        let date = tr.children[1].children[0].data; 
        let jsdate = date.split('-');
        // let utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        // let date = new Date(utc + (3600000*5.5));
        let month = monthArray[jsdate[1]];
        holidayList.push(moment.tz(jsdate[2] + '-' +  month + '-' + jsdate[0], "Asia/Kolkata"));
    });
    return true;
})();

async function _isTradingDay(d:moment.Moment) {
    await holidaysPromise;
    let holiday = holidayList.filter(function (date) {
        return date.isSame(d)
    })
    var day = d.weekday();
    var weekEnd =  ((day == 6) || (day == 0));
    return holiday.length === 0 && !weekEnd;
}

export async function isTradingDay(d:String) {
    return await _isTradingDay(moment.tz(d, 'Asia/Kolkata'));
}


export async function getPreviousTradingDay(date: String) {
    var compareDate = moment.tz(date, "Asia/Kolkata");
    var lastTradingDay:moment.Moment;
    while(!lastTradingDay) {
        compareDate = compareDate.subtract(1 , 'days');
        await _isTradingDay(compareDate) ? (lastTradingDay = compareDate) : null;
    };
    return lastTradingDay.format("YYYY-MM-DD");;
}

export async function getNextTradingDay(date: String ) {
    var compareDate = moment.tz(date, "Asia/Kolkata");
    var lastTradingDay:moment.Moment;
    while(!lastTradingDay) {
        compareDate = compareDate.add(1, 'days');
        await _isTradingDay(compareDate) ? (lastTradingDay = compareDate) : null;
    };
    return lastTradingDay.format("YYYY-MM-DD");
}

function _isTimeWithinMarketTime (date:moment.Moment) {
    let hours = date.get('hours');
    let minutes = date.get('minutes');
    let second = date.get('second');
    if(hours >= 9 && hours < 15) {
        return true;
    } else if (hours === 15 && minutes < 30) {
        return true;
    }
    return false;
}

export async function isMarketOpen( ) {
    var compareDate = moment.tz("Asia/Kolkata");
    return (await _isTradingDay(compareDate)) && _isTimeWithinMarketTime(compareDate)
}

function _notifyMarketOpen () {
    pubsub.publish('MARKET_OPEN', true);
} 

function _notifyMarketClose () {
    pubsub.publish('MARKET_CLOSE', true);
} 

export function subscribeNotifyMarketOpen(callback:any) {
    return pubsub.subscribe('MARKET_OPEN', callback);
};

export function subscribeNotifyMarketClose(callback:any) {
    return pubsub.subscribe('MARKET_CLOSE', callback);
};

export function unSubscribeNotifyMarketClose(subscriberId:any) {
    return pubsub.unsubscribe(subscriberId);
};

export function unSubscribeNotifyMarketOpen(subscriberId:any) {
    return pubsub.unsubscribe(subscriberId);
}

export async function timeToOpen() {
    var tradingDay = await _isTradingDay(moment.tz('Asia/Kolkata'));
    if(tradingDay) {
        return 'OPEN';
    } else {
        var nextTradingDay = await getNextTradingDay(moment.tz('Asia/Kolkata').format('YYYY-MM-DD'));
        return 'OPENS' + moment(nextTradingDay+'T09:15:00.000+05:30').tz('Asia/Kolkata').fromNow();
    }
}

try{
    new CronJob('00 00 09 * * 1-5',  async function() {
        var tradingDay = await _isTradingDay(moment.tz('Asia/Kolkata'));
        if(tradingDay) {
            _notifyMarketOpen();
        }
    }, null, true, 'Asia/Kolkata');

    new CronJob('00 30 15 * * 1-5', async function() {
        var tradingDay = await _isTradingDay(moment.tz('Asia/Kolkata'));
        if(tradingDay) {
            _notifyMarketClose();
        }
    }, null, true, 'Asia/Kolkata');
}
catch (err){
    console.error('Invalid cron job', err);
}