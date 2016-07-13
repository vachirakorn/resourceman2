/**
 * A generic confirmation for risky actions.
 * Usage: Add <div confirm-delete on-confirm="delete(person)">
 */
angular.module('angularGanttDemoApp').directive('rowShortcut', function() {
    return {
       restrict: 'A',
        replace: true,
        templateUrl: 'template/row.shortcut.tpl.html',
        scope: {
            row: '=',
            onAdd: '&',
            onDelete: '&'
        },
        controller: ['$scope',function($scope) {
          //  console.log('row: '+JSON.stringify($scope.row.model));
            $scope.isDeleting = false;
            $scope.add = function(){
              $scope.onAdd();
            };
            $scope.startDelete = function() {
              event.stopPropagation();
                $scope.isDeleting = true;
            };

            $scope.confirm = function() {
                $scope.onDelete();
                
            };
        }]

    };

});
