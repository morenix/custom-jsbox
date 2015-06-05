var kii_root = require("./KiiSDK-2.1");
require("jquery-xhr");

var _errors = {
  UNSUPPORTED_MEDIA_TYPE: "specified content-type is unsupported",
  EMPTY_SCRIPT_ENTRY_NAME: "scriptEntryName is empty",
  ILLEGAL_SCRIPT_ENTRY_NAME: "scriptEntryName is illegal",
  MISSING_SCRIPT_PARAMS: "scriptParams is missing",
  MISSING_SCRIPT_CONTEXT: "scriptContext is missing",
  MISSING_HEADERS: "scriptContext.headers is missing",
  EMPTY_X_KII_APPID: "X-Kii-AppID is empty",
  EMPTY_X_KII_APPKEY: "X-Kii-AppKey is empty",
  INVALID_API_ENDPOINT: "apiEndpoint is empty",
  EMPTY_APP_ADMIN_TOKEN: "appAdminAccessToken is empty"
}

var _cfg;

module.exports = {
  config: function(cfg) {
    _cfg = cfg;
  },
  run: handleRequest
}

function handleRequest(req, res, handler) {
  if (!(req.headers["content-type"] && req.headers["content-type"].match(/^application\/json$/))) {
    renderResponse(res, 415, {
      errorCode: _errors.UNSUPPORTED_MEDIA_TYPE,
      message: req.headers["content-type"]
    });
    return;
  }

  run(req.body, handler, function(err, result) {
    if (err) {
      console.log("handling error response: %s", JSON.stringify(err));
      renderResponse(res, 400, err);
      return;
    } else {
      console.log("handling success response: %s", result)
      renderResponse(res, 200, {
        returnedValue: result
      });
      return;
    }
  });
}

function renderResponse(res, staus, data) {
  res.status(staus);
  res.setHeader("content-type", "application/json");
  res.setHeader("content-length", Buffer.byteLength(JSON.stringify(data), 'utf8'));
  res.write(JSON.stringify(data));
  res.end();
}

function validate(req) {
  checkNotNull(req.scriptEntryName, _errors.EMPTY_SCRIPT_ENTRY_NAME,
    'scriptEntryName is empty in your request');

  var pattern = /^[a-zA-Z][_a-zA-Z0-9]*$/
  checkNotNull(req.scriptEntryName.match(pattern), _errors.ILLEGAL_SCRIPT_ENTRY_NAME,
    "scriptEntryName doesn't match " + pattern);

  checkNotNull(req.scriptParams, _errors.MISSING_SCRIPT_PARAMS,
    'scriptParams is missing in your request');

  checkNotNull(req.scriptContext, _errors.MISSING_SCRIPT_CONTEXT,
    'scriptContext is missing in your request');

  checkNotNull(req.scriptContext.headers, _errors.MISSING_HEADERS,
    'scriptContext.headers is missing in your request');

  checkNotNull(req.scriptContext.headers["X-Kii-AppID"], _errors.EMPTY_X_KII_APPID,
    'scriptContext.headers["X-Kii-AppID"] is empty in your request');

  checkNotNull(req.scriptContext.headers["X-Kii-AppID"], _errors.EMPTY_X_KII_APPKEY,
    'scriptContext.headers["X-Kii-AppKey"] is empty in your request');

  checkNotNull(req.appAdminAccessToken, _errors.EMPTY_APP_ADMIN_TOKEN,
    'appAdminAccessToken is empty in your request');
}

function checkNotNull(value, cod, msg) {
  if (!value) {
    throw {
      err: {
        errorCode: cod,
        message: msg
      }
    };
  }
}

function createContext(req) {
  var app_id = req.scriptContext.headers["X-Kii-AppID"];
  var app_key = req.scriptContext.headers["X-Kii-AppKey"];
  var adminToken = req.appAdminAccessToken;
  var authHeader = req.scriptContext.headers["Authorization"];
  var originHeader = req.scriptContext.headers["X-Kii-Origin"];

  var apiEndpoint = _cfg.apiEndpoint

  var sdk = kii_root.create();
  // X-Kii-Origin handling
  if (originHeader) {
    sdk.Kii.setAdditionalHeaders({
      "X-Kii-Origin": originHeader
    });
  }

  sdk.Kii.initializeWithSite(app_id, app_key, apiEndpoint);

  var context = {
    getAppID: function() {
      return app_id
    },
    getAppKey: function() {
      return app_key
    },
    getAccessToken: function() {
      if (!authHeader)
        return null;
      else
        return authHeader.split(" ")[1];
    },
    getAppAdminContext: function(token) {
      var t = token || adminToken;
      return sdk.Kii.authenticateAsAdminWithToken(t);
    },
    getSDK: function() {
      return sdk
    }
  }

  return context;
}

function run(req, handler, callback) {
  try {
    validate(req);
  } catch (e) {
    if (e.err) {
      return callback(e.err, null, null);
    }
    return callback(e, null, null);
  }

  var ctx = createContext(req)
  var params = req.scriptParams
  var endpoint = req.scriptEntryName

  try {
    handler(endpoint, params, ctx, function(result) {
      return callback(null, result);
    });
  } catch (e) {
    return callback({
      msg: e.toString()
    }, null);
  }
}