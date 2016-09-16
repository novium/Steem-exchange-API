const chalk = require('chalk');
const fx = require('money');

const Client = require('node-rest-client').Client;
const client = new Client();

const express = require('express');
const app = express();

/*
  Set-up
*/

// Pin all rates to BTC=1
fx.base = "BTC";
fx.rates = {
  BTC: 1
}

// Disable x-powered-by=express header
app.use(function (req, res, next) {
  res.removeHeader("x-powered-by");
  next();
});

var d = new Date();

/*
    Get exchange data every 5 minutes
    Fixed to BTC
*/
console.log('%s Data aggregator started', chalk.green('-'));
function getData() {
  // Get STEEM / SBD / ETH / DOGE data (Poloniex)
  client.get('https://poloniex.com/public?command=returnTicker', function(data) {
    fx.rates.STEEM = 1 / data.BTC_STEEM.last;
    fx.rates.SBD = 1 / data.BTC_SBD.last;
    fx.rates.ETH = 1 / data.BTC_ETH.last;
    fx.rates.DOGE = 1 / data.BTC_DOGE.last;
  });

  // Get USD / EUR / LTC data (BTC-E)
  client.get('https://btc-e.com/api/3/ticker/btc_usd-btc_eur-ltc_btc', function(data) {
    data = JSON.parse(data.toString('utf8'));

    fx.rates.USD = data.btc_usd.avg;
    fx.rates.EUR = data.btc_eur.avg;
    fx.rates.LTC = 1 / data.ltc_btc.avg;
  });

  updated = d.getTime();

  console.log("%s Data updated", chalk.green("✓"))
}
getData();
setInterval(getData, 5 * 60 * 1000);

/*
  Routes
*/
// TODO Homepage
app.get('/', function(req, res) {
  res.send("Amazing homepage");
});

// Rates

// Return exchange rate between from and to
app.get('/api/v1/rates/:from-:to', function(req, res) {
  const from = req.params.from;
  const to = req.params.to;

  // Check that both from and to is present in the params and the list of currencies
  if(!from && !to) { next(); }
  if(!fx.rates[from] || !fx.rates[to]) {  return res.json({ error: "currency doesn't exist" }); }
  
  // Return exchange rate
  res.json({
    data: fx(1).from(from).to(to),
    updated: updated,
  });
});

// Return all exchange rates pinned to BTC=1
app.get('/api/v1/rates', function(req, res) {
  res.json({
    data: fx.rates,
    updated: updated
  });
});


/*
    Run express server
*/
app.listen(3000, function () {
  console.log('%s Server started', chalk.green('-'));
});