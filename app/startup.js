///////////////////////////////////////
// Init DDP connection with Asteroid //
///////////////////////////////////////

var GIVE_UP_DELAY = 30000;
(function () {
	var config = {
		dev: {
			host: "localhost:3000"
		},
		test: {
			host: "TBD"
		},
		prod: {
			host: "TBD",
			ssl: true
		}
	};
	var cfg;
	if (/b/.test(APP_VERSION)) {
		cfg = config.dev;
	} else if (/t/.test(APP_VERSION)) {
		cfg = config.test;
	} else {
		cfg = config.prod;
	}
	var deferred = Q.defer();
	window.Straas = new Asteroid(cfg.host, cfg.ssl, cfg.debug);
	Straas.on("connected", function () {
		deferred.resolve();
	});
	window.STRAAS_CONNECTED = deferred.promise.timeout(GIVE_UP_DELAY);
})();



//////////////////////////
// Router configuration //
//////////////////////////

angular.module("straas")

.factory("TimeoutPromiseService", ["$q", "$timeout", "$state", function ($q, $timeout, $state) {
	var timeoutPromise = function (promise, t) {
		var deferred = $q.defer();
		var timer = $timeout(function () {
			deferred.reject("timeout");
			$state.go("serverProblems");
		}, t);
		promise.then(function (res) {
			$timeout.cancel(timer);
			deferred.resolve(res);
		}, function (err) {
			$timeout.cancel(timer);
			deferred.reject(err);
			$state.go("serverProblems");
		});
		return deferred.promise;
	};
	return {
		timeoutPromise: timeoutPromise
	};
}])

.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

	/////////////////////////
	// Root abstract state //
	/////////////////////////

	$stateProvider.state("root", {
		abstract: true,
		templateUrl: "root.html",
		resolve: {
			resumingLogin: ["TimeoutPromiseService", "$state", function (TimeoutPromiseService, $state) {
				return STRAAS_CONNECTED
					.then(function () {
						var resProm = Straas.resumeLoginPromise;
						if (resProm.isPending()) {
							return TimeoutPromiseService.timeoutPromise(resProm, GIVE_UP_DELAY)
								.finally(function () {
									return true;
								});
						}
						return true;
					})
					.then(function () {
						var sub = Straas.subscribe("configurations");
						return TimeoutPromiseService.timeoutPromise(sub.ready, GIVE_UP_DELAY);
					})
					.fail(function () {
						$state.go("staticHome");
					});
			}]
		}
	});



	//////////////////
	// Common pages //
	//////////////////

	$stateProvider.state("home", {
		url: "/",
		parent: "root",
		templateUrl: "pages/home/home.html",
		controller: "HomeController",
		onEnter: ["$rootScope", "$state", function ($rootScope, $state) {
			if ($rootScope.user) {
				$state.go("personalHome");
			}
		}],
		public: true
	});

	$stateProvider.state("staticHome", {
		url: "/staticHome",
		templateUrl: "pages/staticHome/staticHome.html",
		public: true
	});

	$stateProvider.state("notFound", {
		url: "/notFound",
		parent: "root",
		templateUrl: "pages/notFound/notFound.html",
		public: true
	});

	$stateProvider.state("serverProblems", {
		url: "/serverProblems",
		parent: "root",
		templateUrl: "pages/serverProblems/serverProblems.html",
		public: true
	});



	/////////////////////////
	// User-specific pages //
	/////////////////////////

	$stateProvider.state("personalHome", {
		url: "/home",
		parent: "root",
		templateUrl: "pages/personalHome/personalHome.html",
		controller: "PersonalHomeController"
	});

	$stateProvider.state("profile", {
		url: "/profile",
		parent: "root",
		templateUrl: "pages/profile/profile.html",
		controller: "ProfileController"
	});

	$stateProvider.state("admin", {
		url: "/admin",
		parent: "root",
		templateUrl: "pages/admin/admin.html",
		controller: "AdminController"
	});

	$stateProvider.state("users", {
		url: "/users",
		parent: "root",
		templateUrl: "pages/users/users.html",
		controller: "UsersController",
		resolve: {
			usersAdminSub: ["TimeoutPromiseService", function (TimeoutPromiseService) {
				var sub = Straas.subscribe("usersAdmin");
				return TimeoutPromiseService.timeoutPromise(sub.ready, GIVE_UP_DELAY);
			}]
		}
	});

	///////////////
	// Otherwise //
	///////////////

	$urlRouterProvider.otherwise("/");

}])



///////////////////////////////
// Hook angular and Asteroid //
///////////////////////////////

.run(["$rootScope", "$state", "MndSidebarService", function ($rootScope, $state, MndSidebarService) {

	$rootScope.safeApply = function (fn) {
		var phase = $rootScope.$$phase;
		if (phase === "$apply" || phase === "$digest") {
			if (typeof fn === "function") {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	Configurations = Straas.getCollection("configurations");
	Users = Straas.getCollection("users");

	Straas.on("login", function (userId) {
		$rootScope.loggedInUserQuery = Users.reactiveQuery({_id: userId});
		$rootScope.safeApply(function () {
			$rootScope.user = $rootScope.loggedInUserQuery.result[0];
			$rootScope.signedIn = true;
		});
		$rootScope.loggedInUserQuery.on("change", function () {
			$rootScope.safeApply(function () {
				$rootScope.user = $rootScope.loggedInUserQuery.result[0];
			});
		});
	});
	Straas.on("logout", function () {
		$rootScope.safeApply(function () {
			delete $rootScope.user;
			$rootScope.signedIn = false;
			if (!$state.current.public) {
				$state.go("home");
			}
		});
	});

	$rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) { 
		if (MndSidebarService.getSidebarStatus()) {
			MndSidebarService.toggleSidebarStatus();
		}
		$rootScope.$broadcast("sidebarStatusChanged");
		if (toState.name === "home" && $rootScope.user) {
			event.preventDefault(); 
			$state.go("personalHome");
		}
	});

}])

.controller("MainController", ["$scope", function ($scope) {
	$scope.login = function () {
		Straas.loginWithGithub();
	};
	$scope.logout = function () {
		Straas.logout();
	};
}]);
