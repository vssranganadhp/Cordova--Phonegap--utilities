(function() {
    CodeMirror.htmlHints = htmlTags;
    CodeMirror.htmlHint = function(cm) {
        var cursor = cm.getCursor();
        if (cursor.ch >= 0) {
            var text = cm.getRange(CodeMirror.Pos(cursor.line, 0), cursor);
            var typed = '';
            var symbol = '';
            for(var i = text.length - 1; i >= 0; i--) {
                if(text[i] == ' ' || text[i] == '<' || text[i] == ';') {
                    symbol = text[i];
                    break;
                }
                else {
                    typed = text[i] + typed;
                }
            }
            text = text.slice(0, text.length - typed.length);
            var path;
            if(symbol == '<'){
                path = symbol;
            } else {
                path = getActiveElement(text).replace(/.*</g,'');
                if(symbol == ' '){
                    if(editor.getTokenAt(editor.getCursor()).state.curMode.name != 'clike'){
                        if(CodeMirror.htmlHints[path]){
                            var hints = [];
                            hints = CodeMirror.htmlHints[path].attributes;
//                            for(var k in HTMLAttributes){
//                                if(typeof HTMLAttributes[k] == 'object'){
//                                    hints.push(k)
//                                }
//                            }
//                            hints.sort(function(a,b){return a-b;})
                            return {
                                list: hints,
                                from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                                to: cursor
                            }
                        }
                    } else {
                        hints = ['']
                        return {
                            list: hints,
                            from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                            to: cursor
                        }
                    }
                }
            }
            var hints = CodeMirror.htmlHints[path];
            if(typeof hints === 'undefined')
                if(editor.getTokenAt(editor.getCursor()).state.html.htmlState.type && editor.getTokenAt(editor.getCursor()).state.html.htmlState.startOfLine){
                    hints = ['<'];
                } else {
                    hints = [''];
                }
            else {
                hints = Object.keys(hints);
                for (var i = hints.length - 1; i >= 0; i--) {
                    if(hints[i].indexOf(typed) != 0)
                        hints.splice(i, 1);
                }
                if(hints.length == 0){
                    if(path == '<' && typed == '?'){
                        hints = ['?php']
                    } else {
                        hints = ['']
                    }
                }
            }
            typed = typed.trim() == '' ? '' : typed;
            return {
                list: hints,
                from: CodeMirror.Pos(cursor.line, cursor.ch - typed.length),
                to: cursor
            };
        }
    };

    var getActiveElement = function(text) {
        var element = '';
        if(text.length >= 0) {
            var regex = new RegExp('<([^!?][^\\s/>]*).*?>', 'g');
            var matches = [];
            var match;
            while ((match = regex.exec(text)) != null) {
                matches.push({
                    tag: match[1],
                    selfclose: (match[0].slice(match[0].length - 2) === '/>')
                });
            }
            for (var i = matches.length - 1, skip = 0; i >= 0; i--) {
                var item = matches[i];
                if (item.tag[0] == '/'){
                    skip++;
                } else if (item.selfclose == false) {
                    if (skip > 0){
                        skip--;
                    } else {
                        element = '<' + item.tag + '>' + element;
                    }
                }
            }
            element += getOpenTag(text);
        }
        return element;
    };

    var getOpenTag = function(text) {
        var open = text.lastIndexOf('<');
        var close = text.lastIndexOf('>');
        if (close < open){
            text = text.slice(open);
            if(text != '<') {
                var space = text.indexOf(' ');
                if(space < 0)
                    space = text.indexOf('\t');
                if(space < 0)
                    space = text.indexOf('\n');
                if (space < 0)
                    space = text.length;
                return text.slice(0, space);
            }
        }
        return '';
    };
})();