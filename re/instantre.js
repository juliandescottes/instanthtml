(function () {
	var input = document.getElementById("regexp-input"),
		textEl = document.getElementById("text-editor"),
		resultsEl = document.getElementById("matches-list");

	var editor = null, store = null;

	editor = ace.edit("text-editor");
	editor.setTheme("ace/theme/idle_fingers");
	editor.setFontSize("14px");
	editor.getSession().setMode("ace/mode/html");
	editor.renderer.setShowGutter(false);

	var key = "apiKey=eHom4izItOoREUUPRPKfBNwzQdDlO-62";
	store = new MongoStore("instant-re", "snippets", key);

	var snippet = {
		re : "",
		text : ""
	};

	var load = function (re, text) {
		input.value = re;
		editor.setValue(text);
		ire_change();
	};

	var escape = function (text) {
		return text.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	};

	var unescape = function (text) {
		return text.replace(/\&gt;/g, ">").replace(/\&lt;/g, "<").replace(/\&amp;/g, "&");
	};

	var parseRe = function (reString) {
		// force re to be global
		if(/^\/.*\/(g|i)*\s*$/.test(reString)) {
			if(/\/i?\s*$/.test(reString)) {
				reString = reString + "g";
			}
		} else {
			reString = "/" + reString + "/g";
		}
		try {
			eval("var re = " + reString);	
			return re;
		} catch (e) {
			input.classList.add("input-error");
			console.error("invalid regular expression : " + reString);
		}
	};

	window.ire_change = function(){
		var userRe = parseRe(input.value);
		if (userRe) {
			var text = unescape(editor.getValue());
			var matches, results = [], safe = 0 ;
			while (matches = userRe.exec(text)) {
				results.push(escape(matches+""));
			}
			resultsEl.innerHTML = results.join("<br/>");
			window.localStorage.instantReSnapshot = JSON.stringify({
				"re" : input.value,
				"text" : editor.getValue()
			});
		}		
	};

	if (window.localStorage.instantReSnapshot) {
		eval("var snippet = " + window.localStorage.instantReSnapshot);
		load(snippet.re, snippet.text);
	}
})();