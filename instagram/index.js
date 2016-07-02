var router        = require('express').Router();
var cookieParser  = require('cookie-parser');
var instagramApi  = require('instagram-node').instagram();
var fs            = require('fs');
var Bluebird      = require('bluebird');
var config        = require('./config');
var Lob           = require('lob')(config.lob_api_key);

Bluebird.promisifyAll(instagramApi);


/* Index Page
 * IF the instagram cookie is present, show the app
 * ELSE show an Instagram login button
 */
router.get('/', function (req, res) {

  if (req.cookies.instaToken) {
    instagramApi.use({ access_token: req.cookies.instaToken });
    return instagramApi.user_self_media_recentAsync(50)
    .spread(function (medias, pagination, remaining, limit) {
      return Bluebird.all([
        instagramApi.mediaAsync(medias[Math.floor(Math.random() * medias.length -1) + 1].id),
        instagramApi.mediaAsync(medias[Math.floor(Math.random() * medias.length -1) + 1].id),
        instagramApi.mediaAsync(medias[Math.floor(Math.random() * medias.length -1) + 1].id)
      ]);
    })
    .spread(function (image1, image2, image3) {
      res.render('index', {
        image1: image1[0].images.standard_resolution.url,
        image2: image2[0].images.standard_resolution.url,
        image3: image3[0].images.standard_resolution.url,
        access_token: req.cookies.instaToken
      });
    })
    .catch(function (errors) {
      console.log(errors);
    });
  } else {
    res.render('index', {
      showLogin: true
    });
  }
});
