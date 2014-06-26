angular.module("loyall.pages")

.controller("AdminController", ["$scope", "$interval", function ($scope, $interval) {

	// Configurations
	$scope.menuConfig = Configurations.reactiveQuery({name: "menu"}).result[0];

	///////////////////
	// Save function //
	///////////////////

	var menuConfigCache = angular.copy($scope.menuConfig);
	delete menuConfigCache._id;

	$scope.save = function () {

		// Menu configuration
		menuConfig = angular.copy($scope.menuConfig);
		delete menuConfig._id;
		// Only perform the update if there were modifications
		if (!angular.equals(menuConfig, menuConfigCache)) {
			menuConfigCache = menuConfig;
			Configurations.update($scope.menuConfig._id, menuConfig).remote.fail(function (err) {
				console.log(err);
			});
		}

	};

	var interval = $interval($scope.save, 1000);
	$scope.$on("$destroy", function () {
		$interval.cancel(interval);
	});

}]);
