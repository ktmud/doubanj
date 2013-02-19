/*
* Douban API v2 SDK
*/
var util = require('util');

function OAuth2(clientId, clientSecret, customHeaders) {
  this._clientId= clientId;
  this._clientSecret= clientSecret;
  this._baseSite= 'https://www.douban.com';
  this._authorizeUrl= "/service/auth2/auth";
  this._accessTokenUrl= "/service/auth2/token";
  this._accessTokenName= "access_token";
  this._authMethod= "Bearer";
  this._customHeaders = {};
}
util.inherits(OAuth2, require('oauth').OAuth2);

OAuth2.prototype.clientFromToken = function(token) {
  return new Client(token);
};

/*
* get request client from token
*/
function Client(token) {
  this.init(token);
  this._accessTokenName = 'access_token';
  this._customHeaders = {};
}

Client.prototype.init = function(token) {
  this.grand_code = token.grand_code;
  this.access_token = token.access_token;
  this.user_id = token.douban_user_id;
  this.refresh_token = token.refresh_token;
  this.expire_date = token.expire_date;

  this._base_url = 'https://api.douban.com';
};

Client.prototype._request = OAuth2.prototype._request;

Client.prototype._auth_headers = function() {
  return {
    'Authorization': 'Bearer ' + this.access_token
  };
};

Client.prototype.isExpired = function() {
  return this.dead || this.expire_date < new Date();
};

Client.prototype.request = function(method, url, data, callback) {
  var self = this;
  // if has expired
  if (self.isExpired()) {
    return self.refresh(function(err, new_token) {
      if (err) self.dead = true;
    });
  }

  return self._request(method.toUpperCase(), self._base_url + url,
    self._auth_headers(), "", self.access_token, callback);
};

Client.prototype.refresh = function() {
};

['get', 'delete', 'head'].forEach(function(item) {
  Client.prototype[item] = function(url, callback) {
    this.request(item, url, "", callback);
  };
});
['post', 'put'].forEach(function(item) {
  Client.prototype[item] = function(url, data, callback) {
    this.request(item, url, data, callback);
  };
});

module.exports = {
  Client: Client,
  OAuth2: OAuth2
};
