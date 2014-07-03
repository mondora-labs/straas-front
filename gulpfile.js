//////////////////
// Dependencies //
//////////////////

var crypto		= require("crypto");
var fs			= require("fs");
var gulp		= require("gulp");
var plugins		= require("gulp-load-plugins")();
var http		= require("http");
var _			= require("lodash");
var mkdirp		= require("mkdirp");
var pp			= require("preprocess");
var Q			= require("q");
var spawn		= require("child_process").spawn;
var static		= require("node-static");
var util		= require("util");
var WebSocket	= require("faye-websocket");


//////////////////////////////////
// App files building functions //
//////////////////////////////////

var buildAppStyles = function (dest, minify) {
    var deferred = Q.defer();
    var step = gulp.src("app/**/*.scss")
        .pipe(plugins.sass())
        .pipe(plugins.concat("app.css"))
        .pipe(plugins.autoprefixer("last 3 version"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.minifyCss())
            .pipe(plugins.rename("app.min.css"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildAppScripts = function (dest, minify) {
    var deferred = Q.defer();
    var step = gulp.src("app/**/*.js")
        .pipe(plugins.concat("app.js"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.uglify())
            .pipe(plugins.rename("app.min.js"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildAppTemplates = function (dest, minify) {
    var deferred = Q.defer();
    var step = gulp.src(["app/**/*.html", "!app/main.html"])
        .pipe(plugins.ngHtml2js({
            moduleName: "loyall.templates"
        }))
        .pipe(plugins.concat("app.templates.js"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.uglify())
            .pipe(plugins.rename("app.templates.min.js"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildAppFavicon = function (dest) {
    var deferred = Q.defer();
    var step = gulp.src("app/favicon.ico").pipe(gulp.dest(dest));
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildAppImages = function (dest) {
    var deferred = Q.defer();
    var step = gulp.src("app/images/**/*").pipe(gulp.dest(dest));
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

/////////////////////////////////////
// Vendor files building functions //
/////////////////////////////////////

var buildVendorScripts = function (dest,minify) {
    var deferred = Q.defer();
	var sources = [
		"bower_components/lodash/dist/lodash.js",
		"bower_components/angular/angular.js",
		"bower_components/angular-ui-router/release/angular-ui-router.js",
		"bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
		"bower_components/angular-sanitize/angular-sanitize.js",
		"bower_components/mnd.multi-transclude/multi-transclude.js",
		"bower_components/mnd-dashboard/dist/dashboard-tpls.js",
		"bower_components/bower-sockjs-client/sockjs.js",
		"bower_components/q/q.js",
		"bower_components/ddp.js/ddp.js",
		"bower_components/asteroid/dist/asteroid.js"
	];
    var step = gulp.src(sources)
        .pipe(plugins.concat("vendor.js"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.uglify())
            .pipe(plugins.rename("vendor.min.js"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildVendorStyles = function (dest, minify) {
    var deferred = Q.defer();
    var sources = [
        "bower_components/fontawesome/css/font-awesome.css",
        "bower_components/bootstrap/dist/css/bootstrap.css",
        "bower_components/medium-editor/dist/css/medium-editor.css",
        "bower_components/medium-editor/dist/css/themes/default.css",
        "bower_components/angular-ui-tree/source/angular-ui-tree.css",
        "bower_components/angular-datepicker/dist/index.css"
    ];
    var step = gulp.src(sources)
        .pipe(plugins.concat("vendor.css"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.minifyCss())
            .pipe(plugins.rename("vendor.min.css"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildVendorFontsCss = function (dest, minify) {
    var deferred = Q.defer();
    // Building fonts' css sources
    var fontsCssSources = [
        "google_fonts/css/*"
    ];
    var step = gulp.src(fontsCssSources)
        .pipe(plugins.concat("google_fonts.css"))
        .pipe(gulp.dest(dest));
    if (minify) {
        step = step
            .pipe(plugins.minifyCss())
            .pipe(plugins.rename("google_fonts.min.css"))
            .pipe(gulp.dest(dest));
    }
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};

var buildVendorFontsGlyphs = function (dest) {
    var deferred = Q.defer();
    // Copying fonts in the right place
    var fontSources = [
        "bower_components/fontawesome/fonts/*",
        "google_fonts/fonts/*"
    ];
    var step = gulp.src(fontSources)
        .pipe(gulp.dest(dest));
    step.on("end", function () {
        deferred.resolve();
    });
    return deferred.promise;
};



///////////////////
// Build for web //
///////////////////

gulp.task("buildWeb", function () {

    mkdirp.sync("builds/web/dist/js");
    mkdirp.sync("builds/web/dist/css");

    // index.html
    var html = fs.readFileSync("app/main.html", "utf8");
    var webHtml = pp.preprocess(html, {TARGET: "web.prod"});
    fs.writeFileSync("builds/web/index.html", webHtml);

    return Q.all([
        // Fonts
        buildVendorFontsGlyphs("builds/web/dist/fonts"),
        buildVendorFontsCss("builds/web/dist/css", true),
        // Scripts
        buildAppScripts("builds/web/dist/js", true),
        buildAppTemplates("builds/web/dist/js", true),
        buildVendorScripts("builds/web/dist/js", true),
        // Styles
        buildAppStyles("builds/web/dist/css", true),
        buildVendorStyles("builds/web/dist/css", true),
        // Favicon
        buildAppFavicon("builds/web"),
    ]);

});

////////////////////////
// Build for web.test //
////////////////////////

gulp.task("buildWebTest", function () {

    mkdirp.sync("builds/web/dist/js");
    mkdirp.sync("builds/web/dist/css");

    // index.html
    var html = fs.readFileSync("app/main.html", "utf8");
    var webHtml = pp.preprocess(html, {TARGET: "web.test"});
    fs.writeFileSync("builds/web/index.html", webHtml);

    return Q.all([
        // Fonts
        buildVendorFontsGlyphs("builds/web/dist/fonts"),
        buildVendorFontsCss("builds/web/dist/css", true),
        // Scripts
        buildAppScripts("builds/web/dist/js", true),
        buildAppTemplates("builds/web/dist/js", true),
        buildVendorScripts("builds/web/dist/js", true),
        // Styles
        buildAppStyles("builds/web/dist/css", true),
        buildVendorStyles("builds/web/dist/css", true),
        // Favicon
        buildAppFavicon("builds/web"),
    ]);

});



///////////////////////////
// Start dev environment //
///////////////////////////

var buildDevFonts = function () {
    console.log("Building fonts... ");
    mkdirp.sync("builds/dev/dist/fonts");
    return buildVendorFontsGlyphs("builds/dev/dist/fonts");
};

var buildDevCss = function () {
    console.log("Building css... ");
    mkdirp.sync("builds/dev/dist/css");
    return Q.all([
        buildAppStyles("builds/dev/dist/css"),
        buildVendorStyles("builds/dev/dist/css"),
        buildVendorFontsCss("builds/dev/dist/css")
    ]);
};

var buildDevJs = function () {
    console.log("Building js... ");
    mkdirp.sync("builds/dev/dist/js");
    return Q.all([
        buildAppScripts("builds/dev/dist/js"),
        buildAppTemplates("builds/dev/dist/js"),
        buildVendorScripts("builds/dev/dist/js")
    ]);
};

var buildDevHtml = function () {
    console.log("Building html... ");
    var html = fs.readFileSync("app/main.html", "utf8");
    var devHtml = pp.preprocess(html, {TARGET: "dev"});
    fs.writeFileSync("builds/dev/index.html", devHtml);
    return Q();
};

var buildDevFavicon = function () {
    console.log("Building favicon... ");
    return buildAppFavicon("builds/dev");
};

var buildDevImages = function () {
    console.log("Building images... ");
    mkdirp.sync("builds/dev/dist/images");
    return buildAppImages("builds/dev/dist/images");
};

gulp.task("dev", function () {
    buildDevJs();
    buildDevCss();
    buildDevHtml();
    buildDevFonts();
    buildDevFavicon();
    buildDevImages();

    // Set up static file server
    var file = new static.Server("./builds/dev/");
    http.createServer(function (req, res) {
        req.on("end", function () {
            file.serve(req, res);
        }).resume();
    }).listen(8080, "0.0.0.0");

    // Set up WebSocket server to reload the browser
    var ws = {
        sockets: {},
        send: function (msg) {
            _.forEach(this.sockets, function (socket) {
                socket.send(msg);
            });
        }
    };
    http.createServer().on("upgrade", function (req, sock, body) {
        var key = crypto.randomBytes(16).toString("hex");
        if (WebSocket.isWebSocket(req)) {
            ws.sockets[key] = new WebSocket(req, sock, body).on("close", function () {
                delete ws.sockets[key];
            });
        }
    }).listen(8000, "0.0.0.0");

    var scssWatcher = gulp.watch("app/**/*.scss");
    var scssHandler = _.throttle(function () {
        buildDevCss()
            .then(function () {
                ws.send("reload");
            });
    }, 1000);
    scssWatcher.on("change", scssHandler);

    var jsWatcher = gulp.watch(["app/**/*.html", "!app/main.html", "app/**/*.js"]);
    var jsHandler = _.throttle(function () {
        buildDevJs()
            .then(function () {
                ws.send("reload");
            });
    }, 1000);
    jsWatcher.on("change", jsHandler);

    var htmlWatcher = gulp.watch("app/main.html");
    var htmlHandler = _.throttle(function () {
        buildDevHtml()
            .then(function () {
                ws.send("reload");
            });
    }, 1000);
    htmlWatcher.on("change", htmlHandler);

});



////////////////////////////
// Start test environment //
////////////////////////////

gulp.task("tdd", function () {
});



////////////////////
// Build all task //
////////////////////

gulp.task("buildAll", ["buildMac", "buildWeb"]);



///////////////////////////////////////
// Default task: prints help message //
///////////////////////////////////////

gulp.task("default", function () {
    console.log("");
    console.log("Usage: gulp [TASK]");
    console.log("");
    console.log("Available tasks:");
    console.log("  buildAll         builds mac and web");
    console.log("  buildWeb         builds the application to be served via web");
    console.log("  buildMac         builds the application to be served via the Mac App Store");
    console.log("  dev              set up dev environment with auto-recompiling");
    console.log("");
});