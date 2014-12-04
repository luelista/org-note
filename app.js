var express = require('express'),
    fs = require('fs'),
    async = require('async'),
    config = require('./config')
    basicAuth = require('./basicauth');
var app = express();

// Authenticator
var auth = function(req, res, next) {
  if (req.headers.authorization) {
    var authHead = req.headers.authorization;
    if (authHead == 'Bearer '+config.username+':'+config.password) {
      next();
    } else {
      res.send(401, "Not authorized");
    }
  }
}


app.use(express.static('public/'));

app.get('/api/v1/files', auth, function(req, res) {
  fs.readdir(config.note_path, function(err, files) {
    if (err) {
      res.send(500, err);
    } else {    
      var filter = /\.org$/;
      res.send(files.filter(function(f) { return filter.test(f) }));
    }
  });
});
app.get('/api/v1/check', auth, function(req, res) {
      res.send(200, 'ok');
});
app.get('/api/v1/all_files', auth, function(req, res) {
  fs.readdir(config.note_path, function(err, files) {
    if (err) {
      res.send(500, err);
    } else {
      var filter = /\.org$/, filter2 = /^[.#]/;
      
      async.map(files.filter(function(f) { return filter.test(f) && !filter2.test(f) }), function(item, callback) {
        fs.readFile(config.note_path + '/' + item, function(err, cont) {
          callback(err, [item, cont]);
        });
      }, function(err, results) {
        if (err) {
          res.send(500, err);
        } else {
          var output = {};
          for(var i in results) {
            output[results[i][0]] = results[i][1].toString();
          }
          res.send(output);
        }
      });
    }
  });
});

app.get('/api/v1/file/*', auth, function(req, res) {
	var filename = req.params[0];
	fs.readFile(config.note_path + '/' + filename, function(err, content) {
    res.type('text/plain');
    if (err) {
      res.send(500, err);
    } else {    
      res.send(content);
    }
  });
});

app.use(function(req, res, next) {
  if (req.url.match(/^\/api\//)) {
    next();
  } else if (req.url.match(/\.org$/)) {
    res.sendfile("public/index.html");
  } else {
    next();
  }
});

var server = app.listen(3030, function() {
    console.log('Listening on port %d', server.address().port);
});

