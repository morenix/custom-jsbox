var jsbox = require('./jsbox');

jsbox.config({
  port: 8081, // Elastic Beanstalk’s HTTP container requires 8081
  apiEndpoint: 'https://api-development-jp.internal.kii.com/api'
});

jsbox.start( /** My custom code */
  function(endpoint, params, ctx, done) {
	console.log("Custom code invocation %s %s %s", endpoint, JSON.stringify(params), JSON.stringify(ctx));
  
  if (endpoint == 'createObj') {
    createObj(params, context, done);    
  }
  else if (endpoint == 'endpointWithSyntaxError') {
  	endpointWithSyntaxError(params, ctx);
  } 
  else if (endpoint == 'endpointWithRuntimeError') {
  	endpointWithRuntimeError(params, ctx);
  } 
	else if (endpoint == 'endpointWithTimeout') {
		endpointWithTimeout(params, ctx);
	} 

  function createObj(params, context, done) {
    var admin = ctx.getAppAdminContext();
        var bucket = admin.bucketWithName('CustomJSBox');

        var obj = bucket.createObject();
        obj.set('endpoint', endpoint);
        obj.set('params', params);
        obj.set('context.appID', ctx.getAppID());
        obj.set('context.appKey', ctx.getAppKey());
        obj.set('context.accessToken', ctx.getAccessToken());

        obj.save({
            success: function(obj) {
             done("Request registered at " + obj.objectURI());
            },
            failure: function(obj, error) {
             done(error);
            }
        });
  }

  // deploy code including timeout (>20sec?) error
  function endpointWithTimeout(params, context) {
    var sleepDuration = 30 * 1000; // 30 secs
    var now = new Date().getTime();
      while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
      console.log('Exec after waiting'); 
  }
	
  // deploy code including syntax error
  function endpointWithSyntaxError(params, context) {
    console.log("message with missing semicolon")
  }

  // deploy code including runtime error
  function endpointWithRuntimeError(params, context) {
    undefineFunc();
  }
		

    });

