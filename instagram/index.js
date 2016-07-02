var router        = require('express').Router();
var cookieParser  = require('cookie-parser');
var instagramApi  = require('instagram-node').instagram();
var fs            = require('fs');
var Bluebird      = require('bluebird');
var config        = require('./config');
var Lob           = require('lob')(config.lob_api_key);

Bluebird.promisifyAll(instagramApi);



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


router.get('/authorize-user', function (req, res) {
  instagramApi.use({
    client_id: config.instagram_client_id,
    client_secret: config.instagram_client_secret
  });
  res.redirect(instagramApi.get_authorization_url(config.instagram_redirect_uri));
});


router.get('/handleauth', function (req, res) {
  instagramApi.authorize_userAsync(req.query.code, config.instagram_redirect_uri)
  .then(function (result) {
    res.cookie('instaToken',result.access_token, { maxAge: 900000, httpOnly: true });
    res.redirect('/');
  })
  .catch(function (errors) {
    console.log(errors);
  });
});



router.post('/create-postcard', function (req, res) {

  var postcardTemplate = fs.readFileSync(__dirname + '/postcard.html').toString();

  return Lob.addresses.create({
    name: req.body.name,
    address_line1: req.body.address,
    address_city: req.body.city,
    address_state: req.body.state,
    address_zip: req.body.zip,
    address_country: 'US',
  })
  .then(function (address) {
    return Lob.postcards.create({
      description: 'Instagram Postcard Demo',
      to: address.id,
      front: postcardTemplate,
      message: req.body.message,
      data: {
        image1: req.body.image1,
        image2: req.body.image2,
        image3: req.body.image3
      }
    });
  })
  .then(function (postcard) {
    res.render('complete', { url: postcard.url });
  })
  .catch(function (errors){
    res.render('complete', { error: errors.message });
  });
});

module.exports = router;