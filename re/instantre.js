(function () {
	var input = document.getElementById("regexp-input"),
		textEl = document.getElementById("text-editor"),
		resultsEl = document.getElementById("matches-list"),
		previewEl = document.getElementById("results-preview");

	var editor = null, store = null;

	editor = ace.edit("text-editor");
	editor.setTheme("ace/theme/idle_fingers");
        editor.getSession().setMode("ace/mode/text");
	editor.setFontSize("14px");
	//editor.renderer.setShowGutter(false);

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
		editor.moveCursorTo(0,0);
	};

	var escape = function (text) {
		if(typeof text != "string") text = "";
		return text.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	};

	var unescape = function (text) {
		if(typeof text != "string") text = "";
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
			previewEl.classList.remove("out-of-date");
			return re;
		} catch (e) {
			input.classList.add("input-error");
			previewEl.classList.add("out-of-date");
			console.error("invalid regular expression : " + reString);
		}
	};

	var indexToline = function (index, doc) {
		var lines = doc.$lines, endIndex = 0;
		console.log(doc.$lines);
		for (var i = 0 ; i < lines.length ; i++) {
			endIndex += lines[i].length;
			if (index < endIndex) {
				return i;
			}
		}
	}

	var createMarkupForMatch = function (match) {
		var html = "";
		var matchedString = escape(match[0]);
		if(match.length > 1) {
			var groups = match.splice(1);
			for (var i = 0 ; i < groups.length ; i++) {
				html += "<span class='matched-group'>" + escape(groups[i]) + "</span>";
			}
			html += "found in " + "<span class='matched-string'>" + matchedString + "</span>"; 
		} else {
			html += "<span class='matched-string'>" + matchedString + "</span>";
		}

        var line = indexToline(match.index-1, editor.getSession().getDocument());
		return "<li title='jump to line "+(line+1)+"' onclick='scrollToLine("+(line+1)+")'>" + html + " (line:" + (line+1) + ")</li>";
	};

	window.scrollToLine = function (line) {
		editor.setAnimatedScroll(true);
		editor.gotoLine(line, 0, true); //test
	}

	var refresh = function(){
		if(input.value.length = 0) return;
		var userRe = parseRe(input.value);
		if (userRe) {
			var text = unescape(editor.getValue());
			// escape(text.match(userRe)+"")
			var match, results = [], safe = 0, max = 100;
			while (match = userRe.exec(text)) {
				if(safe++>max) break;
				results.push(createMarkupForMatch(match));
			}
			var resultTitle;
			var l = results.length; 
			if (l > 0) {
				if (l >= max) {
					resultTitle =  "More than " + max + " matches found";
				} else {
					resultTitle =  l + (l>1 ? " matches found" : " match found");
				}
				resultsEl.innerHTML = "<ul>" + results.join("") + "</ul>";	
			} else {
				resultTitle = "No matches";
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
		input.focus();
	}

	window.addEventListener("keyup", refresh);
})();