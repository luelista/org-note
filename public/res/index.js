//index

var currentFile = "";
var loggedIn = false;
var authToken = "";

$.event.special.tap.emitTapOnTaphold = false;


function apiCall(method, callback, resultType) {
  // return $.get("/api/v1/" + method, callback, resultType);
  return $.get("backend.php?method=" + method + "&authorization=" + authToken,
               callback, resultType);
}

function onUrlPath(path) {
  console.log("onUrlPath: ", path);
  if (!loggedIn) return;
  var m;
  if (null != (m = path.match(/\?(.*\.org)$/))) {
    $("body").pagecontainer("change", "#contentpage", {allowSamePageTransition:true });
    $("#contenttitle").text(m[1]);
    currentFile = m[1];
    showFileOrg();
  } else {
    $("body").pagecontainer("change", "#mainpage", {allowSamePageTransition:true });
    fileList();
  }
}

function onAuth(token, login) {
  $.ajaxSetup({
      headers: { 'Authorization': 'Bearer '+token }
  });
  authToken = token;
  $("#logininvalid").hide();
  apiCall("check", function(res) {
    if (res == "ok") {
      loggedIn = true;
      if (login) {
        downloadAllFiles();
        window.localStorage.auth = token;
      } else {
        onUrlPath(location.pathname);
      }
      fileList();
    } else {
      $("#logininvalid").show();
    }
  }, "text").error(function() {
    $("#logininvalid").show();
  });
}

function logout() {
  window.localStorage.clear();
  location.reload();
}
function downloadAllFiles() {
  $("#content").html("Loading, please wait");
  apiCall("all_files", function(result) {
    for(var k in result) {
      window.localStorage['file:'+k] = result[k];
    }
    fileList();
  }, "json");
}

function getFileList() {
  var files = [];
  for(var k in window.localStorage)
    if ( k && (/^file:/.test(k)) )
      files.push(k.substr(5));
  return files;
}

function fileList() {
  console.log("fileList called");
  //$("#content").html("<ul id=filelist></ul>");
  //$("body").pagecontainer("change", "#mainpage", {  });
  $("#filelist").html("");
  var files = getFileList();
  for(var i = 0; i < files.length; i++) {
    var name = files[i];
    var meta = getMetadata(name);
    var style = "", icon = meta.SMALL_ICON;
    if (meta.KACHEL) {
      var m = meta.KACHEL.match(/(#[A-Fa-f0-9]+)?\s*(http.*)?/); console.log(meta.KACHEL,m)
      //if (m[1]) style+="background-color:"+m[1]+";";
      //if (m[2]) { style+="background-image: url(\"" + m[2] + "\");"; if(!icon) icon = m[2]; }
    }
    var imgtag = icon ? "<img src='"+meta.SMALL_ICON+"' class='small-icon ui-li-icon'>" : "";
    
    $("<li data-file='"+name+"' style='"+style+"'><a href='#'>" + imgtag + "  " + name + "</a></li>").appendTo("#filelist").click(fileListClick);
  }
  $("#filelist").listview("refresh");
}

function getMetadata(filename) {
  var cont = window.localStorage["file:" + filename];
  var re = /^#\+([A-Z_]+):\s*(.*)$/mg,
        match, params = {};
  
  while (match = re.exec(cont)) {
    params[match[1]] = match[2];
  }
  return params;
}

function fileListClick() {
  var name = this.getAttribute("data-file");
  onNavigate(name);
}

function onNavigate(file, line) {
  currentFile = file;
  $("body").pagecontainer("change", "#contentpage", {allowSamePageTransition:true });
  $("#contenttitle").text(file);
  showFileOrg();
  history.pushState({}, currentFile, '?' + currentFile);
  if (line) {
    line = parseInt(line, 10);
    var el;
    $("#text [data-linum]").each(function(idx) {
      if (parseInt(this.getAttribute("data-linum"), 10) <= line) el = this;
    });
    if (el) {
      $(el).addClass("selected expand").parents(".node").addClass("expand");
      var offset = $(el).offset();
      $('html, body').animate({
          scrollTop: offset.top,
          scrollLeft: offset.left
      });
    }
  }
}

function showFileText() {
  var cont = window.localStorage["file:" + currentFile];
  $("#content").html("<div id=plaintext></div>");
  $("#plaintext").text(cont);
}

function searchAllFiles(keyword) {
  keyword = keyword.toLowerCase();
  var files = getFileList();
  var $out = $("#searchresults").html("");
  for(var i = 0; i < files.length; i++) {
    var name = files[i];
    if (name.toLowerCase().indexOf(keyword)>-1) $out.append("<li data-nav='"+name+"' data-lin='1'><a><h2>"+name+"</h2></a></li>");
  }
  for(var i = 0; i < files.length; i++) {
    var name = files[i];
    var results = searchOrgFile(name, keyword);
    $out.append(results.join(''));
  }
  $out.click(function(e) {
    var $li = $(e.target).closest("li");
    onNavigate($li.attr("data-nav"), $li.attr("data-lin"));
  });
  $out.listview("refresh");
  $out.find("li:first-child").addClass("ui-btn-active"); searchUpdateActive();
}

function searchOrgFile(filename, keyword) {
  var org_content = window.localStorage["file:" + filename];
  var lines = org_content.split(/\n/);
  var m, headline = /^([*]+)\s*(.*)$/;
  var out = [], heads = [], indent = 0;
  var highlighter = new RegExp("("+keyword+")","gi");
  for(var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (null != (m = headline.exec(line))) {
      heads[m[1].length-1] = m[2]; heads.length = m[1].length;
    }
    if (line.toLowerCase().indexOf(keyword) > -1)
      out.push("<li data-nav='"+filename+"' data-lin='"+i+"'><a><h2>"+filename+":"+heads.join('/')+'</h2><p>'+line.replace(highlighter, "<em>$1</em>")+'</p></a></li>');
    
  }
  return out;
}

function simpleOrgParser(org_content) {
  var lines = org_content.split(/\n/);
  var m, headline = /^([*]+)/;
  var out = [];
  out.push({ indent: 1, title: "-> ", content: [] });
  for(var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (null != (m = headline.exec(line))) {
      out.push({ indent: m[1].length, title: line, content: [], linum: i });
    } else {
      out[out.length - 1].content.push(line);
    }
  }
  return out;
}

function showFileOrg() {
  var cont = window.localStorage["file:" + currentFile];
  $("#content").html("<ul id=text></ul>");
  var org = simpleOrgParser(cont);
  org[0].title += currentFile;
  var levels = [ $("#text") ];
  for( var i = 0; i < org.length; i++ ) {
    var item = org[i];
    var h = $("<li class='node level" + item.indent + "' data-linum='"+item.linum+"'><div class='head'>" + item.title + "</div><ul></ul></li>");
    if (item.indent > 0) {
      levels[item.indent-1].append(h);
      levels[item.indent] = $("ul", h);
    }
    if (item.content.length > 0) {
      levels[item.indent].append("<li class='textcontent'>" + item.content.join("\n") + "</li>");
    }
  }
  $("#content li.textcontent").each(function(index, el) {
    console.log(el, $(el).text(), $(el).siblings().length);
    if ($(el).siblings().length == 0) $(el).addClass("expand");
  });
  
  $("#content .textcontent").tap(function() { if(!$(this).hasClass("bigger")) $(this).toggleClass("expand"); });
  $("#content .textcontent").taphold(function() { $(this).toggleClass("bigger").addClass("expand"); });
  $("#content li.node div.head").click(function() { $(this).closest("li").toggleClass("expand"); });
}

function loginSubmit() {
  onAuth($("#username").val() + ':' + $("#password").val(), true);
}
/*
var dropdownOpen = false;
function toggleDropdown() {
  dropdownOpen = !dropdownOpen;
  $("#dropdown").toggle();
}
function bodyClick(e) {
  if(dropdownOpen && $(e.target).closest("#menu-btn").length==0) {
    $("#dropdown").hide()
    dropdownOpen = false;
  }
}
*/

function bodyKey(e) {
  if (e.ctrlKey ) {
    console.log(e.which);
    switch(e.which) {
    case 70: case 83: //C-f or C-s
      $("#searchbox").focus().select();
      break;
    case 82: //C-r
      downloadAllFiles();
      break;
    case 72: //C-h
      fileList();
      break;
    }
  }
}

var lastSearch = '';
function searchBoxKeydown(e) {
  if (e.which == 38||e.which==40) return false;
}
function searchBoxEnter(e) {
  if (e.which == 13) {
    if (this.value == '') { fileList(); return; }
    if (this.value == lastSearch) {
      $("#searchresults .ui-btn-active").click();
    } else {
      searchAllFiles(this.value);
      lastSearch = this.value;
    }
  }
  if (e.which == 38) {
    var sel = $("#searchresults .ui-btn-active"), prevEl=sel.prev();
    if (prevEl.length>0) { sel.removeClass("ui-btn-active"); prevEl.addClass("ui-btn-active"); }
    e.preventDefault=true; searchUpdateActive();
    return false;
  }
  if (e.which == 40) {
    var sel = $("#searchresults .ui-btn-active"), nextEl=sel.next();
    if (nextEl.length>0) { sel.removeClass("ui-btn-active"); nextEl.addClass("ui-btn-active"); }
    e.preventDefault=true; searchUpdateActive();
    return false;
  }
}
function searchUpdateActive()  {
  $("#searchresults a.ui-btn-active").removeClass("ui-btn-active"); $("#searchresults li.ui-btn-active a").addClass("ui-btn-active");
}


$( function() {
  $("#download-files").click(downloadAllFiles);
  $("#gohome").click(function() {
    history.pushState({}, '', '?list');
  });
  $("#viewmode-text").click(showFileText);
  $("#viewmode-org").click(showFileOrg);
  $("body")
    //.click(bodyClick)
    .keyup(bodyKey);
  //$("#menu-btn").click(toggleDropdown);
  $("#searchbox").keyup(searchBoxEnter).keydown(searchBoxKeydown).textinput();
  $("#do-logout").click(logout);
  $( "body>[data-role='panel']" ).panel();
  $("#searchresults").listview();
  if (navigator.onLine) {
    if (window.localStorage.auth) {
      onAuth(window.localStorage.auth);
    
    } else {
      $("#ok").click(loginSubmit);
    }
  } else {
    onUrlPath(location.pathname);
  }
});

window.onpopstate = function(e) {
  onUrlPath(location.pathname);
}



