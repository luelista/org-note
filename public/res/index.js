//index

var currentFile = "";

function onAuth(token, login) {
  $.ajaxSetup({
      headers: { 'Authorization': 'Bearer '+token }
  });
  $.get("/api/v1/check", function(res) {
    if (res == "ok") {
      if (login) {
        downloadAllFiles();
        window.localStorage.auth = token;
      } else {
        fileList();
      }
    } else {
      alert("invalid login");
    }
  }, "text").error(function() {
    alert("invalid login");
  });
}

function logout() {
  window.localStorage.clear();
  location.reload();
}
function downloadAllFiles() {
  $("#content").html("Loading, please wait");
  $.get("/api/v1/all_files", function(result) {
    for(var k in result) {
      window.localStorage['file:'+k] = result[k];
    }
    fileList();
  }, "json");
}

function fileList() {
  $("#content").html("<ul id=filelist></ul>");
  for(var k in window.localStorage) {
    if (k && /^file:/.test(k)) {
      var name = k.substr(5);
      $("<li data-file='"+name+"'>" + k + "</li>").appendTo("#filelist").click(fileListClick);
    }
  }
}

function fileListClick() {
  var name = this.getAttribute("data-file");
  currentFile = name;
  showFileText();
}

function showFileText() {
  var cont = window.localStorage["file:" + currentFile];
  $("#content").html("<div id=plaintext></ul>");
  $("#plaintext").text(cont);
}

function showFileOrg() {
  var cont = window.localStorage["file:" + currentFile];
  $("#content").html("<ul id=text></ul>");
          
          var nodes;
          try {
            nodes = parseBigString(cont);
          } catch(ex) {
            $("#content").html("<div style='background:#faa;padding:10px;'>"+ex+"</div>");
          }
              oq = new OrgQuery(nodes)
              render(oq, document.getElementById("content"))
          
          function render(oq, target) {
              console.log("rendering into", target, "...")
              // i absolutely hate css
              target.innerHTML =
                "<table width='100%' border='2'><tr><td width='50%' valign='top'>" +
                oq.toHTML() +
                "</td><td valign='top'><pre style='overflow: scroll; white-space: pre-wrap;'>"+
                oq.toOrgString() +
                "</pre></td></tr></table>"
          }
}

function loginSubmit() {
  onAuth($("#username").val() + ':' + $("#password").val());
}

$(function() {
  $("#download-files").click(downloadAllFiles);
  $("#goto-file-list").click(fileList);
  $("#viewmode-text").click(showFileText);
  $("#viewmode-org").click(showFileOrg);
  $("#do-logout").click(logout);
  if (window.localStorage.auth) {
    onAuth(window.localStorage.auth);
    
  } else {
    $("#ok").click(loginSubmit);
  }
  
});

/*
function downloadFiles() {
  $.get("/api/v1/files", function(files) {
    for(var i in files) {
      var filename = files[i];
      $.get("/api/v1/file/" + filename, 
    }
  }, "json");
}
*/

