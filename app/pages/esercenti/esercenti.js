angular.module("loyall.pages")

.controller("EsercentiController", ["$scope", function ($scope) {
	
	var Esercenti = Loyall.createCollection("esercenti");
	
	// prendo tutti gli esercenti
	var esercentiRQ = Esercenti.reactiveQuery({});
	$scope.esercenti = esercentiRQ.result;

    $scope.goToDetail = function(esercenteId) {
        console.log(esercenteId);
    }
}]);
