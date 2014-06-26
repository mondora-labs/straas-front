angular.module("loyall.components")

.directive("llModal", [function () {
	return {
		restrict: "EA",
		templateUrl: "components/modal/modal.html",
		transclude: true,
		scope: {
			open: "=",
			header: "@"
		},
		link: function ($scope) {
			var body = angular.element(document.querySelector("body"));
			$scope.$watch("open", function (open) {
				if (open) {
					body.addClass("modal-open");
				} else {
					body.removeClass("modal-open");
				}
			});
		}
	};
}]);
