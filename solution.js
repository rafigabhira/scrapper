var request = require('request-promise');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var fs = require('fs');
//var jsonframe = require('jsonframe-cheerio');

const url = 'https://m.bnizona.com/index.php/category/index/promo';

function main() {

  var initializePromo = getAllPromo(url);

  initializePromo.then(function(result) {

    //Write JSON file
    fs.writeFile('solution.json', JSON.stringify(result, null, 3), function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("JSON saved to your folder");
      }
    });
  });
}

function getAllPromo(url) {
  return getCategory(url).then(function(category) {
    return Promise.map(category, getPromo);
  });
}

function getCategory(url) {
  return request(url).then(function(result) {
    var category = [];
    var $ = cheerio.load(result);

    $('.menu').find('li').each(function(idx, elem) {
      category.push({
        'link': $(elem).find('a').attr('href'),
        'title': $(elem).find('a').text()
      });
    });

    return category;
  });
}

function getPromo(category) {
  return request(category.link).then(function(result) {
    var promoList = [];
    var $ = cheerio.load(result);

    $('.list2').find('li').each(function(idx, elem) {
      var detail = $(elem).find('a');
      promoList.push({
        'link': $(detail).attr('href'),
        'thumbnail': $(detail).find('img').attr('src'),
        'merchantName': $(detail).children('.merchant-name').text(),
        'promoTitle': $(detail).children('.promo-title').text(),
        'validUntil': $(detail).children('.valid-until').text()
      });
    });

    return Promise.map(promoList, getDetail).then(function(result) {
      var categoryDetail = {};
      categoryDetail[category.title] = JSON.stringify(result);
      return categoryDetail;
    });
  });
}

function getDetail(promo) {
  return request(promo.link).then(function(result) {
    var detail = {}
    var $ = cheerio.load(result);

    detail.title = promo.promoTitle;
    detail.link = promo.link;
    detail.validUntil = promo.validUntil;
    detail.thumbnail = promo.thumbnail;
    detail.image = $('#banner').find('img').attr('src');
    detail.merchant = {
      'name': promo.merchantName,
      'logo': $('.merchant').find('img').attr('src'),
      'location': $('.merchant').find('p').text(),
      'phone': $('.merchant').find('p').next('p').text()
    },
    detail.detail = $('#merchant-detail').find('p').text();

    return detail;
  });
}

main();
