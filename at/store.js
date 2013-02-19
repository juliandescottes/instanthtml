store = (function (){
	var url = "https://api.mongolab.com/api/1/databases/at-snippets/collections/snippets";
	var key = "apiKey=eHom4izItOoREUUPRPKfBNwzQdDlO-62";
	var xhr = new aria.core.transport.BaseXHR();

	var getSnippet = function (snippet_id, callback) {
		xhr.request({
		    url: url + "?" + key + "&q={'_id': { '$oid' : '"+snippet_id+"'}}",
		    method: "GET"
		}, {
		    fn: function (a, b, res) {
		    	if (res.status == 200) {
		    		eval("var snippets = " + res.responseText);
		    		if (snippets && snippets.length == 1) {
		    			var snippet = snippets[0];
			    		callback.call(null, snippet);
		    		} else {
			    		callback.call(null, null, "No snippet found for id : " + snippet_id);
		    		}
		    	} else {
		    		callback.call(null, null, "Unexpected error while retrieving : " + snippet_id);
		    	}
		    	
		    },
		    scope: this
	    });
	};

	var storeSnippet = function (snippet, callback) {
		console.log(xhr.request+"")
		xhr.request({
		    url: url + "?" + key,
		    data : JSON.stringify(snippet),
		    headers : {
		    	"Content-Type":"application/json"
		    },
		    method: "POST"
		}, {
		    fn: function (a, b, res) {
		    	eval("var resObject = " + res.responseText);
		    	callback.call(null, resObject)
		    },
		    scope: this
	    });
	};

	return {
		load : getSnippet,
		save :storeSnippet
	}
})();