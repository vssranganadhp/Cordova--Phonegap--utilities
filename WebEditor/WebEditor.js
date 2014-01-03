var editor;
var untitled_count = 0;
var ProjectManager = []
var phpTags = "";
var shortcuts = {};
var topmenu = {};
var altToggle = true;
$(document).ready(function(){
    $.get('predefined_methods.php',function(data){
        phpTags = JSON.parse(data);
        phpTags.internal.sort()
    })
    $.get('shortcuts.json',function(data){
        if(typeof data === 'object'){
            shortcuts = data;
        } else {
            shortcuts = JSON.parse(data);
        }
        parseObject(shortcuts)
    })
    $.get('topmenu.json',function(data){
        if(typeof data === 'object'){
            topmenu = data;
        } else {
            topmenu = JSON.parse(data);
        }
        createMenu(topmenu)
    })
    CodeMirror.commands.autocomplete = function(cm) {
        if(editor.getTokenAt(editor.getCursor()).state.curState.localMode){
            CodeMirror.showHint(cm, CodeMirror.javascriptHint);
        } else {
            CodeMirror.showHint(cm, CodeMirror.htmlHint,{completeSingle : false});
        }
    }
    CodeMirror.defaults.onBlur = function(){
        saveFile();
    }
    CodeMirror.htmlHints['<'] = CodeMirror.htmlHints;

    var temp_pages = localStorage.getItem('WebEditor_pages_json');
    temp_pages = temp_pages == undefined ? [] : JSON.parse(temp_pages);
    if(temp_pages.length > 0){
        ProjectManager = temp_pages;
        var HTML = '';
        for(var i=0;i<ProjectManager.length;i++){
            HTML += '<li class="file"><a class="file-status-icon can-close"></a>'+ProjectManager[i]+'</li>'
        }
        $("#project_nav ul").html(HTML);
        $($(".file")[0]).addClass('selected')
        initEditor();
    } else {
    	var HTML = '<li class="file selected"><a class="file-status-icon can-close"></a>Untitled.html</li>'
        untitled_count++;
        $("#project_nav ul").html(HTML)
        initEditor();
    }
    $("#project_nav").css("width",$("#page_editor")[0].offsetLeft);
    $("#page_editor").css("width",window.innerWidth - $("#page_editor")[0].offsetLeft)
    $("#seperator").bind("mousedown",function(){
        $("*").bind("mousemove",function(e){
            var loc_pageX = e.pageX;
            if(loc_pageX < 400 && loc_pageX > 199){
                $("#project_nav").css("width",loc_pageX)
                $("#page_editor").css("left",loc_pageX)
                $("#page_editor").css("width",window.innerWidth - loc_pageX)
                $("#seperator").css("left",loc_pageX)
            }
        })
        $("*").bind("mouseup",function(){
            $("*").unbind("mousemove");
        })
    });
    $("#project_nav").bind("contextmenu",function(e){
        e.preventDefault();
        $("[data-item^='reName']").remove();
        $("#contextmenu").css({'top':e.pageY,'left':e.pageX})
        $("#menu_cont").show();
        $("*").click(function(eve){
            eve.stopPropagation();
            if($("#contextmenu").find($(eve.target)).length == 0){
                $("#menu_cont").hide();
            }
            $("*").unbind("click")
        })
    })
    $("#menu_cont").bind("contextmenu",function(eve){
        eve.preventDefault();
    });
    $(".file").live("contextmenu",function(){
        if($(this).find("input").length > 0){
            return false;
        }
        saveFile(this);
        $("#project_nav ul li").removeClass("selected");
        $(this).addClass("selected");
        FileHandle(ProjectManager[returnFileIndex($(this).text())],'read')
        HTML = '<div class="soft-context-menu-item" data-item="reName"><span>Rename</span><span>F2</span></div>';
        $("[data-item^=createNewFile]").after(HTML);
        reloadEvents();
    })
    $(".filename").live('blur keydown',function(e){
        e.stopImmediatePropagation();
        if( (e.keyCode == 13 || e.type == 'blur' || e.type == 'focusout') ){
            var fn = $(this).val();
            if(isValidFileName(fn)) {
                try{
                    $(this).parent().find('input').replaceWith(fn);
                    saveFile();
                } catch(err) {
                    Log("Error came when replacing text field!");
                }
                reloadEvents();
            }
        }
    });
    $(".fileRename").live('blur keydown',function(e){
        e.stopPropagation();
        e.stopImmediatePropagation();
        if( (e.keyCode == 13 || e.type == 'blur' || e.type == 'focusout') ){
            var fn = $(this).val();
            if(isValidFileName(fn,'rename')) {
                try{
                    ProjectManager[returnFileIndex($(".selected").find('input').attr("data-value"))] = fn;
                    renameFile($(this).parent().find('input').attr("data-value"), fn);
                    $(this).parent().find('input').unbind("blur keydown")
                    $(this).parent().html(fn);
                    reloadEvents();
                } catch(err) {
                    Log("File rename");
                }
            }
        }
    });
    reloadEvents();
    $(window).bind('beforeunload', function() {
        saveProjects();
//        return "Saved files...!"
    });
    $(window).resize(function(e){
        $("#page_editor").width(window.innerWidth - $("#project_nav").width())
        var cmHeight = window.innerHeight - 50
        $(".CodeMirror").css("height",cmHeight+"px");
    })
});
function selectTheme(theme) {
    editor.setOption("theme", theme);
}
function passAndHint(cm) {
    setTimeout(function() {cm.execCommand("autocomplete");}, 100);
    return CodeMirror.Pass;
}
var autoIndent = function(){
    CodeMirror.commands["selectAll"](editor);
    var range = getSelectedRange();
    editor.autoIndentRange(range.from, range.to);
}
var getSelectedRange = function(){
    return { from: editor.getCursor(true), to: editor.getCursor(false) };
}
function returnFileIndex(filename){
    var index = false;
    for(var i = 0; i < ProjectManager.length; i++){
        if(ProjectManager[i] == filename){
            index = i;
            i = ProjectManager.length;
        }
    }
    return index;
}

function saveFile(that){
    var filename = $(".selected").text();
    if(filename != ""){
        FileHandle(filename,'create',editor.getValue());
        var file_pos = returnFileIndex(filename);
        if(file_pos.toString() == "false"){
            ProjectManager.push(filename);
        }
    }
}
function saveProjects(){
    localStorage.setItem("WebEditor_pages_json",JSON.stringify(ProjectManager))
}

function initEditor(){
    var foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
    var foldFunc_html = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
    CodeMirror.commands.save = function (cm) {saveFile();}
    CodeMirror.commands.showHTMLHint = function (cm) {
        var selectedLineText = editor.getTokenAt(editor.getCursor()).string;
        if(selectedLineText.indexOf('#') >= 0){
            Log(selectedLineText.match(/#\w{3,6}/g))
        }
    }
    CodeMirror.commands.renameFile = function (cm) {alert("Checking for key F2")}
    CodeMirror.commands.helpSection = function (cm) {editor.display.input.blur();$(".help").show();}
    CodeMirror.commands.hideHelpSection = function (cm) {
        $(".help").hide();
//        var cursor = editor.getCursor();
//        editor.display.input.blur();
//        editor.setCursor(cursor);
//        editor.display.input.focus();
    }
    CodeMirror.commands.selectDefaultTheme = function (cm) {cm.setOption("theme","default")}
    
    CodeMirror.commands.FileMenu = function (cm) {
        if(altToggle){
            altToggle = false;
            $("#topMenu").css("top","0px")
        } else {
            altToggle = true;
            $("#topMenu > ul > div > ul").hide();
            $("#topMenu li").unbind("mouseover");
            $("#topMenu li").unbind("mouseout");
            $("#topMenu li").removeClass("selected");
            $("#topMenu").css("top","-18px");
        }
    }
    CodeMirror.commands.fullScreen = function (cm)
    {
        var fs_p = $(cm.getWrapperElement());
        
        if ( cm._ic3Fullscreen == null) {
            cm._ic3Fullscreen = false;
            cm._ic3container = fs_p.parent();
        }
        
        if (!cm._ic3Fullscreen)
        {
            fs_p = fs_p.detach();
            fs_p.addClass("CodeMirrorFullscreen");
            fs_p.appendTo("body");
            cm.focus();
            cm._ic3Fullscreen = true;
        }
        else
        {
            fs_p = fs_p.detach();
            fs_p.removeClass("CodeMirrorFullscreen");
            fs_p.appendTo(cm._ic3container);
            cm.focus();
            cm._ic3Fullscreen = false;
        }
        var cmHeight = ((window.outerHeight)/(window.outerHeight))*100
        $(".CodeMirror").css("height",cmHeight+"%");
    };
    CodeMirror.commands.commentSelection = function (cm) {
        if(editor.getTokenAt(editor.getCursor()).state.curMode.name == "htmlmixed"){
            if(editor.getTokenAt(editor.getCursor()).state.curState.localMode != null){
                if(editor.getTokenAt(editor.getCursor()).state.curState.localMode.name == 'javascript'){
                    Log("comment with //");
                } else {
                    Log("comment with <!--sample-->");
                }
            } else if(editor.getTokenAt(editor.getCursor()).state.curState.htmlState.type != null) {
                Log("comment with <!--sample-->");                
            } else {
                if(!editor.getTokenAt(editor.getCursor()).state.html.htmlState.startOfLine){
                    Log("Tag >> "+editor.getTokenAt(editor.getCursor()).state.html.htmlState.context.tagName)
                }
            }
        } else {
            Log("comment with #");
        }
//        console.log(editor.getRange(editor.getCursor(true),editor.getCursor(false)));
    }
    editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        mode: "application/x-httpd-php",
        autoCloseBrackets: true,
        autoCloseTags: true,
        lineWrapping:true,
        tabSize: 6,
        matchBrackets: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-I":"indentAuto",
            "Cmd-I":"indentAuto",
            "Cmd-E":"showHTMLHint",
            "F2":"renameFile",
            "F1":"helpSection",
            "Ctrl-Q": function(cm){foldFunc(cm, cm.getCursor().line);foldFunc_html(cm, cm.getCursor().line);},
            "Esc":"hideHelpSection",
            "Cmd-/":"commentSelection",
            "Cmd-F11":"fullScreen",
            "Alt-F":"FileMenu"
        }
    });
    editor.on("gutterClick", foldFunc);
    editor.on("gutterClick", foldFunc_html);
    editor.on("change",function(e){
        var cursor = editor.getCursor()
        var char = editor.getRange(CodeMirror.Pos(cursor.line, 0), cursor);
        if(char.trim() == '<' || (char.slice(-1) == ' ' && char.trim() != "")){
            CodeMirror.commands.autocomplete(editor)
        } else {
            return false;
        }
    })
    autoIndent();
    var cmHeight = ((window.outerHeight - 50)/(window.outerHeight))*100
    $(".CodeMirror").css("height",cmHeight+"%");
    var themeShifter = {
        "Cmd-`":function(cm){$("#select").val('default').trigger('change')},
        "Cmd-1":function(cm){$("#select").val('ambiance').trigger('change')},
        "Cmd-2":function(cm){$("#select").val('blackboard').trigger('change')},
        "Cmd-3":function(cm){$("#select").val('cobalt').trigger('change')},
        "Cmd-4":function(cm){$("#select").val('eclipse').trigger('change')},
        "Cmd-5":function(cm){$("#select").val('elegant').trigger('change')},
        "Cmd-6":function(cm){$("#select").val('erlang-dark').trigger('change')},
        "Cmd-7":function(cm){$("#select").val('lesser-dark').trigger('change')},
        "Cmd-8":function(cm){$("#select").val('monokai').trigger('change')},
        "Cmd-9":function(cm){$("#select").val('neat').trigger('change')},
        "Cmd-0":function(cm){$("#select").val('night').trigger('change')},
        "Cmd--":function(cm){$("#select").val('rubyblue').trigger('change')},
        "Cmd-=":function(cm){$("#select").val('vibrant-ink').trigger('change')},
        "Cmd-Backspace":function(cm){$("#select").val('xq-dark').trigger('change')}
    }
    editor.addKeyMap(themeShifter);
}

function reloadEvents(){
    $("#project_nav ul li").unbind('click');
    $("#project_nav ul li").click(function(){
        if($(this).hasClass("selected") || ($(this).find("input").length > 0)){
            return false;
        }
        saveFile(this);
        $("#project_nav ul li").removeClass("selected");
        $(this).addClass("selected");
        FileHandle(ProjectManager[returnFileIndex($(this).text())],'read')
    })
    $("#project_nav ul li").unbind("mouseover mouseout");
    $("#project_nav ul li").mouseover(function(){
        $(".can-close").hide()
        $(this).find(".can-close").show();
    }).mouseout(function(){
        $(".can-close").hide()
    })
    $(".can-close").unbind("click");
    $(".can-close").click(function(e){
        e.preventDefault();
        var index = $(this).parent().index();
        ProjectManager.remove(index);
        FileHandle(ProjectManager[index],'remove');
        reloadProjects(index);
    });
    $("[data-item]").unbind('click');
    $("[data-item]").click(function(e){
        e.stopPropagation();
        var item_clicked = $(this).attr('data-item');
        if($(this)[0].nodeName.toLowerCase() == 'span'){
            item_clicked = $(this).parent().attr('data-item');
        }
        switch(item_clicked){
            case 'createNewFile':
                var fm = new FileManager()
                fm.createNew();
                break;
            case 'reName':
                $("#menu_cont").hide();
                var oldName = $(".selected").text();
                var input = $('<input />',{class:'fileRename'}).attr({'value':oldName,'data-value':oldName})
                $(".selected").html(input);
                input.focus();
                break;
            default:
                Log("item type not found");
        }
    });
    $("#topMenu li").unbind("click");
    $("#topMenu li").click(function(e){
        console.log(e.target)
        e.preventDefault();
        $("#topMenu li").removeClass("selected");
        $(this).addClass("selected");
        $(this).parent().find("ul.sub").show()
        $("#topMenu > ul > div > li").unbind("mouseover mouseout")
        $("#topMenu > ul > div > li").mouseover(function(el){
            $("#topMenu > ul > div > ul").hide()
            $(el.target).parent().find($("div > ul")).show()
        }).mouseout(function(el){
            $("#topMenu > ul > div > ul").hide()
            $(el.target).parent().find($("div > ul")).show()
        })
//        $("#topMenu li").unbind("mouseover mouseout")
        $("#topMenu li").mouseover(function(el){
            $("#topMenu li").removeClass("selected")
            $(this).addClass("selected")
        }).mouseout(function(el){
            $("#topMenu li").removeClass("selected")
            $(this).addClass("selected")
        })
    })
}
function reloadProjects(index){
    $("#project_nav ul").html('');
    var HTML = '';
    for(var i=0;i<ProjectManager.length;i++){
        HTML += '<li class="file"><a class="file-status-icon can-close"></a>'+ProjectManager[i]+'</li>'
    }
    $("#project_nav ul").html(HTML);
    if(ProjectManager.length > Number(index+1)){
        index = ProjectManager.length - 1;
    } else if(index != 0) {
        index--;
    }
    $("#project_nav ul li").eq(index).addClass('selected');
    $("tt").text(ProjectManager[index]);
    reloadEvents();
    setTimeout(filesList,500);
}
function Log(str){
    console.log(" >>> "+str);
}
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
values = function(that){
    var result = [];
    for (var key in that)
        if(typeof that[key] != 'function')
            result.push(that[key]);
    return result;
};
String.prototype.escapeHTML = function(){
    var local_string = this.replace(/>/g,'&gt;');
    local_string = local_string.replace(/</g,'&lt;');
    return local_string;
};
function parseObject(data){
    var HTML = '';
    var data = JSON.parse(JSON.stringify(data).escapeHTML().replace(/ or /g,'<i> or </i>'))
    for(var i in data){
        var key = i;
        var val = data[i];
        if(typeof val == 'object'){
            HTML += '<details open><summary>'+key+'</summary>';
            for(var j in val){
                var l1key = j;
                var l1val = val[j];
                if(typeof l1val == 'object'){
                    HTML += '<details open><summary>'+l1key+'</summary>';
                    for(var k in l1val){
                        var l2key = k;
                        var l2val = l1val[k];
                        if(typeof l2val == 'object'){
                            HTML += '<details open><summary>'+l2key+'</summary>';
                            Log("Check this");
                        } else {
                            HTML += '<li><span>'+l2key+'</span>:<span>'+l2val+'</span></li>'
                        }
                    }
                    HTML += '</details>';
                } else {
                    HTML += '<li><span>'+l1key+'</span>:<span>'+l1val+'</span></li>'
                }
            }
            HTML += '</details>';
        } else {
            HTML += '<li><span>'+key+'</span>:<span>'+val+'</span></li>'
        }
    }
    $(".help hr").after(HTML)
}
function createMenu(data){
    var HTML = "";
    HTML += '<ul>';
    for(var i in data){
        var key = i;
        var val = data[i];
        if(typeof val == 'object'){
            HTML += '<div><li>'+key+'</li>';
            HTML += '<ul class="sub">';
            for(var j in val){
                var key1 = j;
                var val1 = val[j];
                if(val1 == "seperator"){
                    HTML += '<div class="horizontal"></div>';
                } else if(val1 == "gap") {
                    HTML += '<div class="gap"></div>';
                } else {
                    HTML += '<li><span>'+key1+'</span><span>'+val1+'</span></li>';
                }
            }
            HTML += '</ul></div>';
        }
    }
    HTML += '</ul>';
    $("#topMenu").html(HTML);
    reloadEvents();
}