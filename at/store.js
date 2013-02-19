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
		    	eval("var resObject = " + res.responseText);
		    	delete resObject[0]._id;
		    	callback.call(null, resObject[0]);
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