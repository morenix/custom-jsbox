var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var runner = require('./runner');

var _cfg;

module.exports = {
  config: function(cfg) {
    _cfg = cfg;
  },
  start: function(handler) {
    if (!_cfg || !_cfg.port || !_cfg.apiEndpoint) {
      throw new Error(
        'Bad config found. Expected: {port: "port to listen", apiEndpoint: "ufe api endpoint"}'
      );
    }

    var app = express();

    app.use(logger('combined'));
    app.use(bodyParser.json());

    runner.config(_cfg);

    app.post('/run', function(req, res) {
      console.log("Running custom code...");
      runner.run(req, res, handler);
    })

    var server = app.listen(_cfg.port, function() {
      var host = server.address().address
      var port = server.address().port

      console.log('Custom JS-Box listening at http://%s:%s', host, port);
    })
  }
}