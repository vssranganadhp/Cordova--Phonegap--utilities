CodeMirror.showHint = function(cm, getHints, options) {
  if (!options) options = {};
  var startCh = cm.getCursor().ch, continued = false;
  var closeOn = options.closeCharacters || /[\s()\[\]{};:]/;

  function startHinting() {
    // We want a single cursor position.
    if (cm.somethingSelected()) return;

    if (options.async)
      getHints(cm, showHints, options);
    else
      return showHints(getHints(cm, options));
  }

  function showHints(data) {
    if (!data || !data.list.length) return;
    if(editor.getTokenAt(editor.getCursor()).state.curState.localMode){
        if(editor.getTokenAt(editor.getCursor()).state.curState.localMode.name == "javascript"){
            var matches = editor.getValue().match(/<script>(?:[\s].*?)+<\/script>/g)
            var el = [];
            matches.forEach(function(a){
                var x = a.match(/function.*?\)/g)
                if(x)
                    el.push(x)
            })
            for(var fn in el){
                if(el[fn]){
                    for(var loc_fn in el[fn]){
                        if(typeof el[fn][loc_fn] == 'string')
                            data.list.push(el[fn][loc_fn].replace(/function /g,'').replace(/\(.*?\)/g,''))
                    }
                }
            }
        }
    } else if(editor.getTokenAt(editor.getCursor()).state.html.localMode == null && editor.getTokenAt(editor.getCursor()).state.php.localMode == undefined && (editor.getTokenAt(editor.getCursor()).string != '<' && editor.getTokenAt(editor.getCursor()).string != '')) {
        var typed = cm.getRange(data.from, data.to).trim()
        if((editor.getTokenAt(editor.getCursor()).state.html.htmlState.tagName != null || editor.getTokenAt(editor.getCursor()).state.html.htmlState.context) && (editor.getTokenAt(editor.getCursor()).state.php.indented != 4)){
            var bk_list = [];
            for(var el=0;el<data.list.length;el++){
                if(data.list[el].indexOf(typed) == 0){
                    bk_list.push(data.list[el]);
                }
            }
            data.list = [];
            data.list = bk_list;
        } else if(editor.getTokenAt(editor.getCursor()).state.curMode.name != "htmlmixed"){
            if(data.list.length == 1 && data.list[0] == '?php'){
                console.log(data.list)
            } else {
                data.list = [];

                var php_methods = values(phpTags).toString().split(',')
                for(var char in php_methods){
                    var meth = php_methods[char];
                    if(typeof meth == "string" && (meth.indexOf(typed) == 0)){
                        data.list.push(meth)
                    }
                }
            }
            var el = {}
            var matches = editor.getValue().match(/(\<\?php|\<\?)(?:.*[\s])+?\?>/g)							//php
            for(i in matches){
                if(typeof matches[i] === 'string'){
                    var loc_match = matches[i].match(/[\s|\t](.*?\()/g)
                    if(loc_match){
                        el[loc_match[0].replace(/function|[\W]/g,'')] = '';
                    }
                }
            }
            if(data.list.length == 1){
                if(data.list[0] == ""){
                    data.list = [];
                }
            }
            var match_arr = Object.keys(el);
            for(var q=0;q<match_arr.length;q++){
                if(match_arr[q].indexOf(typed) == 0)
                    data.list.push(match_arr[q])
            }

        }
    }
    if(data.list.length < 2 && data.list[0] == ''){
        data.list = [];
//        data.list.push('<')
    }
    var completions = data.list;
    // When there is only one completion, use it directly.
    if (!continued && options.completeSingle !== false && completions.length == 1) {
      cm.replaceRange(completions[0], data.from, data.to);
      return true;
    }

    // Build the select widget
    var hints = document.createElement("ul"), selectedHint = 0;
    hints.className = "CodeMirror-hints";
    for (var i = 0; i < completions.length; ++i) {
      var elt = hints.appendChild(document.createElement("li"));
      elt.className = "CodeMirror-hint" + (i ? "" : " CodeMirror-hint-active");
      elt.appendChild(document.createTextNode(completions[i]));
      elt.hintId = i;
    }
    var pos = cm.cursorCoords(options.alignWithWord !== false ? data.from : null);
    var left = pos.left, top = pos.bottom, below = true;
    hints.style.left = left + "px";
    hints.style.top = top + "px";
    document.body.appendChild(hints);

    if(hints.childElementCount == 0){
        $(hints).hide()
    }
    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
    var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
    var box = hints.getBoundingClientRect();
    var overlapX = box.right - winW, overlapY = box.bottom - winH;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = (winW - 5) + "px";
        overlapX -= (box.right - box.left) - winW;
      }
      hints.style.left = (left = pos.left - overlapX) + "px";
    }
    if (overlapY > 0) {
      var height = box.bottom - box.top;
      if (box.top - (pos.bottom - pos.top) - height > 0) {
        overlapY = height + (pos.bottom - pos.top);
        below = false;
      } else if (height > winH) {
        hints.style.height = (winH - 5) + "px";
        overlapY -= height - winH;
      }
      hints.style.top = (top = pos.bottom - overlapY) + "px";
    }

    function changeActive(i) {
      i = Math.max(0, Math.min(i, completions.length - 1));
      if (selectedHint == i) return;
      hints.childNodes[selectedHint].className = "CodeMirror-hint";
      var node = hints.childNodes[selectedHint = i];
      node.className = "CodeMirror-hint CodeMirror-hint-active";
      if (node.offsetTop < hints.scrollTop)
        hints.scrollTop = node.offsetTop - 3;
      else if (node.offsetTop + node.offsetHeight > hints.scrollTop + hints.clientHeight)
        hints.scrollTop = node.offsetTop + node.offsetHeight - hints.clientHeight + 3;
    }

    function screenAmount() {
      return Math.floor(hints.clientHeight / hints.firstChild.offsetHeight) || 1;
    }

    var ourMap = {
      Up: function() {changeActive(selectedHint - 1);},
      Down: function() {changeActive(selectedHint + 1);},
      PageUp: function() {changeActive(selectedHint - screenAmount());},
      PageDown: function() {changeActive(selectedHint + screenAmount());},
      Home: function() {changeActive(0);},
      End: function() {changeActive(completions.length - 1);},
      Enter: pick,
      Tab: pick,
      Esc: close,
      Left: close,
      Right: close
    };
    if (options.customKeys) for (var key in options.customKeys) if (options.customKeys.hasOwnProperty(key)) {
      var val = options.customKeys[key];
      if (/^(Up|Down|Enter|Esc)$/.test(key)) val = ourMap[val];
      ourMap[key] = val;
    }

    cm.addKeyMap(ourMap);
    cm.on("cursorActivity", cursorActivity);
    var closingOnBlur;
    function onBlur(){ closingOnBlur = setTimeout(close, 100); };
    function onFocus(){ clearTimeout(closingOnBlur); };
    cm.on("blur", onBlur);
    cm.on("focus", onFocus);
    var startScroll = cm.getScrollInfo();
    function onScroll() {
      var curScroll = cm.getScrollInfo(), editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top, point = newTop;
      if (!below) point += hints.offsetHeight;
      if (point <= editor.top || point >= editor.bottom) return close();
      hints.style.top = newTop + "px";
      hints.style.left = (left + startScroll.left - curScroll.left) + "px";
    }
    cm.on("scroll", onScroll);
    CodeMirror.on(hints, "dblclick", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) {selectedHint = t.hintId; pick();}
    });
    CodeMirror.on(hints, "click", function(e) {
      var t = e.target || e.srcElement;
      if (t.hintId != null) changeActive(t.hintId);
    });
    CodeMirror.on(hints, "mousedown", function() {
      setTimeout(function(){cm.focus();}, 20);
    });

    var done = false, once;
    function close() {
      if (done) return;
      done = true;
      clearTimeout(once);
      hints.parentNode.removeChild(hints);
      cm.removeKeyMap(ourMap);
      cm.off("cursorActivity", cursorActivity);
      cm.off("blur", onBlur);
      cm.off("focus", onFocus);
      cm.off("scroll", onScroll);
    }
    function pick() {
      cm.replaceRange(completions[selectedHint], data.from, data.to);
      close();
    }
    var once, lastPos = cm.getCursor(), lastLen = cm.getLine(lastPos.line).length;
    function cursorActivity(e) {
      clearTimeout(once);

      var pos = cm.getCursor(), line = cm.getLine(pos.line);
      if (  (pos.line != lastPos.line ||
            line.length - pos.ch != lastLen - lastPos.ch ||
            pos.ch < startCh || 
            cm.somethingSelected() ||
            (pos.ch && closeOn.test( line.charAt(pos.ch - 1) ))) &&
            false
          )
        close();
      else
        once = setTimeout(function(){close(); continued = true; startHinting();}, 40);
    }
    return true;
  }

  return startHinting();
};