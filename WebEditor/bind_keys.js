(function(){
 if(Mousetrap){
    Mousetrap.bind("command+k",function(e){
        var fm = new FileManager()
        fm.createNew();
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    });
    Mousetrap.bind("esc",function(e){
        Log("Clicked escape");
        $(".help").hide();
    })
    Mousetrap.bind(['command+s', 'ctrl+s'],function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        Log("clicked save")
    })
    Mousetrap.bind(['command+n', 'ctrl+n'],function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        Log("clicked N")
    })
    Mousetrap.bind(['command+f', 'ctrl+f'],function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        CodeMirror.commands.find(editor)
    })
    Mousetrap.bind(['alt+f'],function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
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
    })
    Mousetrap.bind(['f1', '?'],function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        $(".help").show();
    })
 }
})();
function FileManager(){
    
}
FileManager.prototype = {
    createNew : function(){
        $("#menu_cont").hide();
        saveFile();
        editor.setValue('');
        $(".filename").trigger('blur');
        untitled_count = untitled_count == 0 ? '' : untitled_count;
        Log("Creating new file");
        $("#project_nav li").removeClass('selected');
        var fname = $('<input />',{class:'filename'}).attr('value','Untitled'+untitled_count+'.html')
        $('<li />',{class:'file selected'}).appendTo($("#project_nav ul")).html('<a class="file-status-icon can-close"></a>'+''+fname[0].outerHTML);
        $(".selected input").select().focus()
        untitled_count++;
    }
}