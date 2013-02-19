(function () {
	var snippet = {
	    template : document.getElementById("content-template").innerHTML,
	    script : document.getElementById("content-script").innerHTML,
	    css : document.getElementById("content-css").innerHTML,
	    data : document.getElementById("content-data").innerHTML
	};

	var TYPES = ["template", "css", "script", "data"],
		currentType = "template",
		unplugged = false,
		editor = null, data_editor = null;

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

	    document.getElementById("tab-" + currentType).className = "tab-item";
	    document.getElementById("tab-" + type).className = "tab-item tab-selected";

	    currentType = type;
	};

	var loadModel = function (model_content) {
	    try {
	        eval(model_content);    
	    } catch (e) {
	        console.error("[MODEL COMPILATION ERROR] : " + e.message);
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
	                    loadTemplateInPreview(res.classDef, data)
	                } else {
	                    console.error("Your template is not compiling")
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
	    } catch (e) {
	        console.error("[SCRIPT ERROR] : " + e.message);
	    }
	};

	var loadTemplateStyle = function (css_content, data) {
	    var tplString = "{CSSTemplate {$classpath : 'TestStyle'}}"+css_content+"{/CSSTemplate}"
	    aria.templates.CSSClassGenerator.parseTemplate(tplString, false,
	        {
	            fn : function (res, args) {
	                if (res.classDef) {
	                    Aria["eval"](res.classDef); 
	                } else {
	                    console.error("Your CSS template is not compiling")
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

		var __refresh = function () {
			var hash = aria.utils.HashManager.getHashObject();
			if (hash && hash.param0) {
				var snippet_id = hash.param0;
				store.load(snippet_id, function (loadedSnippet) {
					if (loadedSnippet) {
						snippet = loadedSnippet;
						refresh();
					}
				});
			} else {
				refresh();	
			}
		}
		
		__refresh();

		aria.utils.HashManager.addCallback({
			fn : __refresh,
			scope : null
		});
	};

	

	var save = function () {
		store.save(snippet, function (savedSnippet) {
			var id = savedSnippet._id.$oid, loc = window.location;
			var link = loc.origin + loc.pathname + "#" + id;
			console.log("Snippet id : ["+id+"]");
			console.log("link : " + loc.origin + loc.pathname + "#" + id);
			document.getElementById("general-message").innerHTML = "Snippet saved at <a href='#"+id+"'>#"+id+"</a>";
			aria.utils.HashManager.setHash(id);
		})
	}

	window.iat_selectEditor = selectEditor;
	window.iat_save = save;
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
