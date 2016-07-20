//Fixed autofocus modal
angular.module('angularGanttDemoApp').directive('autoFocus',['$timeout', function($timeout) {
    return {
        restrict: 'AC',
        link: function(_scope, _element) {
            $timeout(function(){
                _element[0].focus();
            }, 0);
        }
    };
}]);
