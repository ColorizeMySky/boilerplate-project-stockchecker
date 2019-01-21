/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');

const url = require('url'); 
const mongoose = require('mongoose');
const helmet = require('helmet');
const fetch = require('node-fetch');

const Users = require('../models/user.js');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const connect = mongoose.connect(CONNECTION_STRING);

connect.then((db) => {
  console.log("We managed to connect with database, wow!");
}, (err) => { console.log(err); });


module.exports = function (app) {
  
    app.route('/api/stock-prices')
      //I can GET /api/stock-prices with form data containing a Nasdaq stock ticker and recieve back an object stockData.
      //In stockData, I can see the stock(string, the ticker), price(decimal in string format), and likes(int).
      //I can also pass along field like as true(boolean) to have my like added to the stock(s). Only 1 like per ip should be accepted.
      //If I pass along 2 stocks, the return object will be an array with both stock's info but instead of likes, it will display rel_likes(the difference between the likes on both) on both.
      //A good way to receive current price is the following external API(replacing 'GOOG' with your stock): https://finance.google.com/finance/info?q=NASDAQ%3aGOOG
  
      //https://api.iextrading.com/1.0/stock/goog/quote Well... I managed to find some information...
      //What the shit is it? Stock, price, open/close... WTF! Why have tellurians thought up this rubbish?
  
      .get(function(req, res, next) {
        let urlParsed = url.parse(req.url, true);
        let origin = 'https://api.iextrading.com/1.0/stock/';
      
        //let ip = req.headers['x-forwarded-for'].split(',')[0]|| req.connection.remoteAddress;      
        //For chai-test should to use this define of ip
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        //console.log("We are visited by " + ip);
        //res.end('Hello, mortals!');    
      
        //Execute, when it are two stocks  
        if (Array.isArray(urlParsed.query.stock)) {  
          //a lot of shitcode this morning ^^
          
          let stock1 = urlParsed.query.stock[0];
          let stock2 = urlParsed.query.stock[1];
          let prices = [];
          
          let names = [stock1, stock2];
          let requests = names.map(name => fetch(origin + name + '/quote'));

          Promise.all(requests)
            .then(responses => {
              return responses;
            })
            // map array of responses into array of response.json() to read their content
            .then(responses => Promise.all(responses.map(res => res.json())))
            // all JSON answers are parsed: "info" is the array of them
            .then(info => info.forEach(info => prices.push(info.latestPrice)))
          
            .then( () => {
              Users.findOne({'ipAddress': ip})
                .then( (user) => {            
                  if(user == null) {                
                    Users.create({"ipAddress": ip, "stocks": [{"name": urlParsed.query.stock[0], like: 0},
                                                              {"name": urlParsed.query.stock[1], like: 0}]
                    })
                    .then( (user) => {                      
                      if(urlParsed.query.like) {
                        res.json({"stockData":[{"stock": stock1.toUpperCase(), "price": prices[0], "rel_likes": 0}, {"stock": stock2.toUpperCase(), "price": prices[1], "rel_likes": 0}] })
                      }
                      else {
                        res.json({"stockData":[{"stock": stock1.toUpperCase(), "price": prices[0]}, {"stock": stock2.toUpperCase(), "price": prices[1]}] })
                      }
                     })
                  }
                  else {
                    let stock1 = user.stocks.filter( (item) => item.name == urlParsed.query.stock[0]);
                    let stock2 = user.stocks.filter( (item) => item.name == urlParsed.query.stock[1]);

                    if(stock1.length == 0) user.stocks.push({"name": urlParsed.query.stock[0], like: 0});
                    if(stock2.length == 0) user.stocks.push({"name": urlParsed.query.stock[1], like: 0}); 

                    user.save()
                    .then( (user) => {
                      if(urlParsed.query.like) {
                        let stock1 = user.stocks.filter( (item) => item.name == urlParsed.query.stock[0]);
                        let stock2 = user.stocks.filter( (item) => item.name == urlParsed.query.stock[1]);
                        let like1 = stock1[0].like;
                        let like2 = stock2[0].like;                      
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json')
                        res.json({"stockData":[
                           {"stock": urlParsed.query.stock[0].toUpperCase(), "price": prices[0], "rel_likes": like1 - like2},
                           {"stock": urlParsed.query.stock[1].toUpperCase(), "price": prices[1], "rel_likes": like2 - like1}] 
                        })
                      }
                      else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json')
                        res.json({"stockData":[
                          {"stock": urlParsed.query.stock[0].toUpperCase(), "price": prices[0]},
                          {"stock": urlParsed.query.stock[1].toUpperCase(), "price": prices[1]}]
                        })
                      }
                      
                    })
                  }                  
                })
          
            })          
        }
      
      
      
        //Execute, when it is one stock  
        else {
          //a bit of shitcode this morning ^^          
          //console.log('Check it now');                  
          
          Promise.all([
            
            Users.findOne({'ipAddress': ip}),                        
            fetch(origin + urlParsed.query.stock + '/quote')
              .then(res => res.json())
              //.then(info => {})
          ])
          .then(results => {            
            let user = results[0];
            let info = results[1];  
            let like;
            
            (urlParsed.query.like) ? like = 1 : like = 0;    

              if(user == null) {    
                Users.create({"ipAddress": ip, stocks: [{"name": urlParsed.query.stock, like: like}]})               
                  .then((user) => {     
                    res.statusCode = 201;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({"stockData": 
                      {"stock": urlParsed.query.stock.toUpperCase(),
                       "price": info.latestPrice,
                       "likes": like
                    }});
                  }, (err) => {
                     err = new Error('Something is going wrong');
                     err.status = 400;
                  });
                }

              else {
                let stock = user.stocks.filter( (item) => item.name == urlParsed.query.stock);
                if(stock.length == 0) {
                  user.stocks.push({"name": urlParsed.query.stock, like: like});                  
                }
                else if(urlParsed.query.like) {
                   stock[0].like = 1; 
                }
                user.save()
                  .then( (user) => {
                    console.log("We've done it");
                    let stock = user.stocks.filter( (item) => item.name == urlParsed.query.stock);

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json')
                    res.json({"stockData": 
                      {"stock": urlParsed.query.stock.toUpperCase(),
                       "price": info.latestPrice,
                       "likes": stock[0].like
                    }})
                  }) 
                }
            
            
          });
        }

      
      })
 
}