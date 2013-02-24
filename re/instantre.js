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
		refresh();
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
			input.classList.remove("input-error");
			return re;
		} catch (e) {
			input.classList.add("input-error");
			console.error("invalid regular expression : " + reString);
		}
	};

	var refresh = function(){
		var userRe = parseRe(input.value);
		if (userRe) {
			var text = unescape(editor.getValue());
			// escape(text.match(userRe)+"")
			var matches, results = [], safe = 0, max = 100;
			while (matches = userRe.exec(text)) {
				if(safe++>max) break;
				results.push(escape(matches+""));
			}
			if (results.length > 0) {
				var resultTitle = (results.length >= max ? "More than " + max : results.length ) + " matches found"; 
				resultsEl.innerHTML = "<ul><li>" + results.join("</li><li>") + "</li></ul>";	
			} else {
				var resultTitle = "No matches";
				resultsEl.innerHTML = "";
			}
			document.getElementById("matches-header").innerHTML = resultTitle;
			
		}
		window.localStorage.instantReSnapshot = JSON.stringify({
			"re" : input.value,
			"text" : editor.getValue()
		});
	};

	if (window.localStorage.instantReSnapshot) {
		eval("var snippet = " + window.localStorage.instantReSnapshot);
		load(snippet.re, snippet.text);
	}

	window.addEventListener("keyup", refresh);
})();