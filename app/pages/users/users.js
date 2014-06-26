angular.module("loyall.pages")

.controller("UsersController", ["$scope", function ($scope) {
	var usersRQ = Users.reactiveQuery({});
	usersRQ.on("change", function () {
		$scope.safeApply(function () {
			$scope.users = usersRQ.result;
		});
	});
	$scope.users = usersRQ.result;

	$scope.setUser = function (user) {
		$scope.selectedUser = user;
	};

	// Order properties
	$scope.orderPredicate = "profile.name";
	$scope.orderReverse = false;
}])

.controller("UserManagementController", ["$scope", function ($scope) {

	$scope.onRoleAdd = function (role) {
		Loyall.call("addUserToRole", $scope.selectedUser._id, role);
	};
	$scope.onRoleRemove = function (role) {
		Loyall.call("removeUserFromRole", $scope.selectedUser._id, role);
	};

	$scope.onGroupAdd = function (group) {
		Loyall.call("addUserToGroup", $scope.selectedUser._id, group);
	};
	$scope.onGroupRemove = function (group) {
		Loyall.call("removeUserFromGroup", $scope.selectedUser._id, group);
	};

}]);
