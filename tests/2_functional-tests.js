/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var User = require('../models/user');
/*
var expect = require('chai').expect;
var MongoClient = require('mongodb');

const url = require('url'); 
const mongoose = require('mongoose');
const helmet = require('helmet');
const fetch = require('node-fetch');
var apiRoutes = require('../routes/api.js');*/

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){          
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, 'GOOG', 'Stock should be a GOOG');
          assert.property(res.body.stockData, 'price', 'Response should have a price');
          assert.property(res.body.stockData, 'likes', 'Response should have a like'); 
         
          done();
        });        
      });
      
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: 'aple',
            like: true
          })
          .end(function(err, res){          
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.stock, 'APLE', 'Stock should be a APLE');
            assert.property(res.body.stockData, 'price', 'Response should have a price');
            assert.equal(res.body.stockData.likes, 1, 'Like should be define as 1'); 

            done();
        });        
      });
      
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: 'ibm',
            like: true
          })
          .end(function(err, res){          
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.stock, 'IBM', 'Stock should be a IBM');
            assert.property(res.body.stockData, 'price', 'Response should have a price');
            assert.equal(res.body.stockData.likes, 1, 'Like should be define as 1'); 

            done();
        }); 
      });
      
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: ['orcl', 'tsla']
          })
          .end(function(err, res){          
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData, 'Response should be an array');
            assert.equal(res.body.stockData[0].stock, 'ORCL', 'Stock should be a ORCL');
            assert.equal(res.body.stockData[1].stock, 'TSLA', 'Stock should be a TSLA');
            assert.property(res.body.stockData[0], 'price', 'Response should have a price for first stock');
            assert.property(res.body.stockData[1], 'price', 'Response should have a price for second stock');            

            done();
        });        
      });
      
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({
            stock: ['msft', 'amd'],
            like: true
          })
          .end(function(err, res){          
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData, 'Response should be an array');
            assert.equal(res.body.stockData[0].stock, 'MSFT', 'Stock should be a MSFT');
            assert.equal(res.body.stockData[1].stock, 'AMD', 'Stock should be a AMD');
            assert.property(res.body.stockData[0], 'price', 'Response should have a price for first stock');
            assert.property(res.body.stockData[1], 'price', 'Response should have a price for second stock');
            assert.property(res.body.stockData[0], 'rel_likes', 'Response should should have a rel_likes for first stock'); 
            assert.property(res.body.stockData[1], 'rel_likes', 'Response should should have a rel_likes for second stock'); 

            done();
        });
        
      });
      
    });

})