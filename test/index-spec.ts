
import * as NSE from "../src/index";
import * as chai from "chai";

const expect = chai.expect;
// isTradingDay('2017-01-28').then(console.log);
// isTradingDay('2017-01-27').then(console.log);
// isTradingDay('2017-01-26').then(console.log);
describe("Trading day", () => {
  it("Is trading day for Weekend should output false", async () => {
    var result = await NSE.isTradingDay('2017-01-28')
    expect(result).to.be.false;
    
    var result = await NSE.isTradingDay('2017-01-29')
    expect(result).to.be.false;
    return;
  });
  
  it("Is trading day for Weekday should output true", async () => {
    var result = await NSE.isTradingDay('2017-01-27')
    expect(result).to.be.true;
    
    var result = await NSE.isTradingDay('2017-01-25')
    expect(result).to.be.true;
    return;
  });
  
  it("Is trading day for holiday should output false", async () => {
    var result = await NSE.isTradingDay('2017-01-26')
    expect(result).to.be.false;
    
    var result = await NSE.isTradingDay('2017-01-25')
    expect(result).to.be.true;
    return;
  });
  
  it("Previous trading day for holiday next day should output day before holiday", async () => {
    var result = await NSE.getPreviousTradingDay('2017-01-27')
    expect(result).to.be.equal('2017-01-25');;
    return;
  });
  
  it("Next trading day for day before holiday  should output day after holiday", async () => {
    var result = await NSE.getNextTradingDay('2017-01-25')
    expect(result).to.be.equal('2017-01-27');;
    return;
  });
  
  it("Should be able to get next and previous days without a date param", async () => {
    var result = await NSE.getNextTradingDay()
    expect(result).to.be.a('string');
    
    var result = await NSE.getPreviousTradingDay()
    expect(result).to.be.a('string');
    return;
  });
  
  it("Should be able to subscribe to market open", async () => {
    var result = NSE.subscribeNotifyMarketClose(function() {

    });
    expect(result).to.be.a('string');
    return;
  });
});
