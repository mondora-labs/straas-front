angular.module("loyall.pages")

    .controller("detailEsercenteController", ["$scope", "$stateParams", function ($scope, $stateParams) {

        var Esercenti = Loyall.createCollection("esercenti");

        var esercentiRQ = Esercenti.reactiveQuery({_id:$stateParams.esercenteId});
        $scope.esercente = esercentiRQ.result[0];


    }]);
