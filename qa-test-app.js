var jsbox = require('./jsbox');

jsbox.config({
  port: 8081, // Elastic Beanstalk’s HTTP container requires 8081
  apiEndpoint: 'https://api-development-jp.internal.kii.com/api'
});

jsbox.start( /** My custom code */
  function(endpoint, params, ctx, done) {
  
  	if (endpoint == 'endpointWithSyntaxError') {
  		endpointWithSyntaxError(params, ctx);
  	} 
  	else {
  		endpointWithRuntimeError(params, ctx);
  	}
    
    // deploy code including syntax error
	function endpointWithSyntaxError(params, context) {
		console.log("message with missing )");
	}
	
	// deploy code including runtime error
	function endpointWithRuntimeError(params, context) {
		undefineFunc();
	}
	
	// deploy code including timeout (>20sec?) error
	function endpointWithTimeout(params, context, done) {
		var sleepDuration = 30 * 1000; // 30 secs
		var now = new Date().getTime();
	    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
	    done('Exec after waiting'); 
	}
    
    });
