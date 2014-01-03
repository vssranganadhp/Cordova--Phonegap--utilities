var fileSystem;

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs, errorHandler);

function onInitFs(fs) {
    Log("Opened file system: " + fs.name);
    fileSystem = fs;
    if(ProjectManager.length > 0){
        FileHandle(ProjectManager[0],'read');
        filesList();
    } else {
    	filesList();
    }
}

function errorHandler(e) {
    var msg = '';
    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = e.name;
            break;
    };
    Log('Error: ' + msg);
}

function FileHandle(fileName,type,data){
    var toCreate = true
    if(type != 'create' && type != 'append'){
        toCreate = false
    }
    fileSystem.root.getFile(fileName, {create: toCreate}, function(fileEntry) {
        if(data){
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                    Log('Write completed.');
                    filesList();
                };

                fileWriter.onerror = function(e) {
                    Log('Write failed: ' + e.toString());
                };
                if(type == 'append'){
                    data = '\n'+data;
                    fileWriter.seek(fileWriter.length);                             //seek to EOF
                }
                fileWriter.onprogress = function(e) {
                    Log('File writing in progress');
                };
                var blob = new Blob([data], {type: 'text/html'});
                fileWriter.write(blob);
            }, errorHandler);
        } else {
            if(type == 'remove'){
                fileEntry.remove(function() {
                    Log('File removed.');
                }, errorHandler);
            } else {
                fileEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onloadend = function(e) {
                        editor.setValue(this.result);
                        $("tt").text(fileName);
                    };
                    reader.readAsText(file);
                }, errorHandler);
            }
        }
    }, errorHandler);
}

function filesList(){
    $("details li").unbind('click');
    $("details li").remove();
    var dirReader = fileSystem.root.createReader();
    console.log(dirReader)
    dirReader.readEntries(function(entries) {
        $("#project_nav div details").html('');
        var HTML = "";
        console.log(entries);
        ProjectManager = [];
        for(var i=0;i<entries.length;i++){
        	if(entries[i].isDirectory){
        		var parentHTML = 'asdsad';
        		HTML += '<details open>'+
        					'<summary>'+entries[i]['name']+'</summary>'+
        					parentHTML+
        				'</details>';
        		ProjectManager.push(entries[i]['name']);
        	}
            HTML += '<li class="file_from_dir"><a class="file-status-icon can-close"></a>'+entries[i]['name']+'</li>'
        }
        $("#project_nav div details").append(HTML);
        $("#project_nav div details").attr("open","open");
        $("li.file_from_dir").click(function(){
            var filename = $(this).text();
            var filesIndex = ProjectManager.indexOf(filename)
            if(filesIndex < 0){
                ProjectManager.push(filename);
                reloadProjects(1);
            } else {
                $("#project_nav ul li").removeClass('selected');
                $("#project_nav ul li").eq(filesIndex).addClass('selected');
                FileHandle(filename,'read');
            }
        })
    }, errorHandler);
}

function renameFile(filename, newFileName) {
    var cwd = fileSystem.root;
    if(isValidFileName(filename,'rename') && isValidFileName(newFileName,'rename') && (filename != newFileName)){
        cwd.getFile(filename, {}, function(fileEntry) {
            fileEntry.moveTo(cwd, newFileName);
            reloadProjects(0);
        }, errorHandler);
    }
}

function isValidFileName(filename, type){
    if(filename.indexOf('.') < 0){
        alert("Please enter valid filename!");
        return false;
    } else if(filename.split('.')[1].length == 0){
        alert("Please enter file's extension!");
        return false;
    } else if( (type != 'rename') && (ProjectManager.indexOf(filename) >= 0) ){
        alert("File name already exists!");
        return false;
    } else {
        return true;
    }
}

function removeAllFiles(){
    var dirReader = fileSystem.root.createReader();
    dirReader.readEntries(function(entries) {
        for (var i = 0, entry; entry = entries[i]; ++i) {
            if (entry.isDirectory) {
                entry.removeRecursively(function() {}, errorHandler);
            } else {
                entry.remove(function() {}, errorHandler);
            }
        }
        ProjectManager = [];
        filesList();
    }, errorHandler);
}