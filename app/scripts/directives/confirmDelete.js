/**
 * A generic confirmation for risky actions.
 * Usage: Add <div confirm-delete on-confirm="delete(person)">
 */
angular.module('angularGanttDemoApp').directive('confirmDeleteButton', function() {
    return {
       restrict: 'A',
        replace: true,
        templateUrl: 'template/confirm.delete.button.tpl.html',
        scope: {
            onConfirm: '&'
        },
        controller: ['$scope',function($scope) {
            $scope.isDeleting = false;
            $scope.startDelete = function() {
                $scope.isDeleting = true;
            };
            $scope.cancel = function() {
                $scope.isDeleting = false;
            };
            $scope.confirm = function() {
                $scope.onConfirm();
            };
        }]

    }

});
