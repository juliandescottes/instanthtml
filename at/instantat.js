(function () {
	var TYPES = ["template", "css", "script", "data"],
		currentType = "template",
		unplugged = false,
		editor = null, data_editor = null;


	var snippet = {
	    template : document.getElementById("content-template").innerHTML,
	    script : document.getElementById("content-script").innerHTML,
	    css : document.getElementById("content-css").innerHTML,
	    data : document.getElementById("content-data").innerHTML
	};

	/************* ERRORS *******************/

	var errors = {
		template : false,
		script : false,
		css : false,
		data : false
	};

	var setError = function (type, content) {
		errors[type] = content;
		refreshErrors();
	};

	var refreshErrors = function () {
		var error = errors[currentType];
		(error && displayError("main",error)) || removeError("main");
		error = errors.data;
		(error && displayError("data",error)) || removeError("data");
	};

	var displayError = function (container, message) {
		var containerEl = document.getElementById("error-container-" + container);
		containerEl.className = "error-displayed error-container";
		containerEl.innerHTML = message;
		
		var lineMatches = message.match(/line (\d+)/);
		if (lineMatches && lineMatches[1]) {
			editor.getSession().setAnnotations([{
			  row: lineMatches[1] - 1,
			  column: 1,
			  text: message,
			  type: "error" // also warning and information
			}]);
		}
		
		return true;
	};

	var removeError = function (container) {
		var containerEl = document.getElementById("error-container-" + container);
		containerEl.className = "error-container";
		if (container == "main") {
			editor.getSession().clearAnnotations();
		}
	};

	var updateEditorSilently = function (e, content) {
		unplugged = true;
		    e.getSession().setValue(content,0);
	    unplugged = false;
	}

	var selectEditor = function (evt) {
	    type = evt.target.innerHTML.toLowerCase(); 

	    updateEditorSilently(editor, snippet[type]);

	    if (type == "template") editor.getSession().setMode("ace/mode/html");
	    if (type == "script") editor.getSession().setMode("ace/mode/javascript");
	    if (type == "css") editor.getSession().setMode("ace/mode/css");

	    if (errors[currentType]) {
	   		document.getElementById("tab-" + currentType).className = "tab-item tab-error";
	    } else {
	    	document.getElementById("tab-" + currentType).className = "tab-item";
	    }

	    document.getElementById("tab-" + type).className = "tab-item tab-selected";

	    currentType = type;
	    refreshErrors();
	};

	var loadModel = function (model_content) {
	    try {
	        eval(model_content);  
			setError("data", false);  
	    } catch (e) {
			setError("data","[DATA MODEL ERROR] : " + e.message);
	        var data = {};
	    }

	    return data;
	};

	var loadTemplate = function (tpl_content, data) {
	    var tplString = "{Template {$classpath : 'Test', $hasScript:true, $css:['TestStyle']}}"+tpl_content+"{/Template}"
	    aria.templates.TplClassGenerator.parseTemplate(tplString, false,
	        {
	            fn : function (res, args) {
	                if (res.classDef) {
						setError("template", false);
	                    loadTemplateInPreview(res.classDef, data);
	                } 
	            }
	        },{"file_classpath" : "Test"}
	    );
	};

	var loadTemplateInPreview = function (classDef, data) {
	    Aria["eval"](classDef); 
	    Aria.loadTemplate({
	        classpath: "Test",
	        div: "preview",
	        data: data
	    });
	};

	var loadTemplateScript = function (script_content) {
	    try {
	        eval("Aria.tplScriptDefinition("+script_content+");");
			setError("script", false);  
	    } catch (e) {
			setError("script", "[SCRIPT ERROR] : " + e.message);
	    }
	};

	var loadTemplateStyle = function (css_content, data) {
	    var tplString = "{CSSTemplate {$classpath : 'TestStyle'}}"+css_content+"{/CSSTemplate}"
	    aria.templates.CSSClassGenerator.parseTemplate(tplString, false,
	        {
	            fn : function (res, args) {
	                if (res.classDef) {
						setError("css", false);  
	                    Aria["eval"](res.classDef); 
	                } else {
						setError("css", "[SCRIPT ERROR] : " + e.message);
	                }
	            }
	        },{"file_classpath" : "TestStyle"}
	    );
	};

	var onEditorChange = function(){
	    if(!unplugged) {
	    	// update snippet from editors
	        snippet[currentType] = editor.getValue();
	        snippet.data = data_editor.getValue();

	    	// editors are in sync, just refresh preview
	        refreshPreview();
	    }
	};

	// Refresh editors and preview from model
	var refresh = function () {
		refreshEditors();
		refreshPreview();
	};

	var refreshEditors = function () {
	    updateEditorSilently(editor, snippet[currentType]);
	    updateEditorSilently(data_editor, snippet.data);
	};

	var refreshPreview = function () {
		var data = loadModel(snippet.data);
	    loadTemplateScript(snippet.script);
	    loadTemplateStyle(snippet.css, data);  
	    loadTemplate(snippet.template, data);

	    aria.templates.TemplateManager.unloadTemplate("Test");
	    aria.templates.CSSMgr.unloadClassPathDependencies("Test", ["TestStyle"]);
	};

	var init = function () {
		editor = ace.edit("multi-editor");
		editor.setTheme("ace/theme/idle_fingers");
		editor.setFontSize("14px");
		editor.getSession().setMode("ace/mode/html");

		data_editor = ace.edit("data-editor");
		data_editor.setFontSize("14px");
		data_editor.getSession().setMode("ace/mode/javascript");

		editor.on("change", onEditorChange);
		data_editor.on("change", onEditorChange);

		refreshUnlessIdInHash();

		aria.utils.HashManager.addCallback({
			fn : refreshUnlessIdInHash,
			scope : null
		});
	};

	var refreshUnlessIdInHash = function () {
		var hash = aria.utils.HashManager.getHashObject();
		if (hash && hash.param0) {
			var snippet_id = hash.param0;
			displayMessage("Loading " + snippet_id + " ...");
			store.load(snippet_id, loadSnippetCb);
		} else {
			refresh();	
		}
	};

	var loadSnippetCb = function (loadedSnippet, errorMessage) {
		if (loadedSnippet) {
			displayMessage("<span class='success'>Snippet "+loadedSnippet._id.$oid+" loaded</span>");

			// filter out internal properties
			delete loadedSnippet._id;

			snippet = loadedSnippet;
			refresh();	
		} else {
			aria.utils.HashManager.setHash("");
			displayError(errorMessage);
		}
	};

	
	var messageEl = document.getElementById("general-message"), 
		messageTimeout;

	var displayMessage = function (text) {
		messageEl.innerHTML = text;
		window.clearTimeout(messageTimeout);
		messageTimeout = window.setTimeout(function () {messageEl.innerHTML=""}, 10000)
	};
	
	var save = function () {
		store.save(snippet, function (savedSnippet) {
			var id = savedSnippet._id.$oid;
			aria.utils.HashManager.setHash(id);
			window.setTimeout(function () {displayMessage("Snippet saved at <a href='#"+id+"'>#"+id+"</a>")}, 100);
		});
	};

	var listDisplayed = false;
	var toggleList = function () {
		if (!listDisplayed) {
			displayList();
		} else {
			hideList();
		}
		listDisplayed = !listDisplayed;
	}
	var displayList = function () {
		store.list(function (snippets) {
			var html = "<ul>";
			for (var i = 0 ; i <snippets.length ; i++) {
				var id = snippets[i]._id.$oid;
				html += "<li><a href='#"+id+"'>#"+id+"</a></li>";	
			}
			html += "</ul>";
			document.getElementById("tab-list-snippets").innerHTML = html;
		});
	};
	
	var hideList = function () {
		document.getElementById("tab-list-snippets").innerHTML = "";
	};

	(function () {
		var errorbkp = console.error;
		console.error = function (message, originalError) {
			console.log(arguments);
			if (/(Test|Parser|ClassGenerator)\]/.test(message))  {
				if (originalError && originalError.message) message = originalError.message;
				setError(currentType,message);
			}
			errorbkp.apply(this, arguments);
		}
	})();

	window.iat_selectEditor = selectEditor;
	window.iat_save = save;
	window.iat_list = toggleList;
	Aria.load({ 
		classes:["aria.utils.HashManager"], 
        oncomplete:{
    	    fn: function () {
    	    	// loading fake template to get necessary dependencies
				Aria.loadTemplate({classpath: "A",div: "preview",data:{}}, {fn : init, scope : null});
    	    }
 	    }
    });
})();