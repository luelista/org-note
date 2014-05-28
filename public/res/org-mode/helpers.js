exports = this
        util = {
            debug: console.log
        }
        debug = console.log
        fs = {
          readFile: function(filepath, encoding, processor) {
              console.log("reading file", filepath, "...")
              var ajax = new XMLHttpRequest()
              ajax.onreadystatechange = function() {
                if(ajax.readyState == 4) {
                  var fdata = ajax.responseText;
                  processor(0, fdata)
                }
              }
              ajax.open("GET", filepath, true)
              ajax.send(null)
          }
        }
        function require(lib) {
            console.log("attempting to require", lib, "...")
            switch(lib) {
                case "underscore":
                    return _;
                default:
                    return this[lib]
            }
        }