'use strict';

/**
 * @ngdoc overview
 * @name angularGanttDemoApp
 * @description
 * # angularGanttDemoApp
 *
 * Main module of the application.
 */
var app = angular.module('angularGanttDemoApp', [
    'gantt', // angular-gantt.
    'gantt.sortable',
    'gantt.movable',
    'gantt.drawtask',
    'gantt.tooltips',
    'gantt.bounds',
    'gantt.progress',
    'gantt.table',
    'gantt.tree',
    'gantt.groups',
    'gantt.dependencies',
    'gantt.overlap',
    'gantt.resizeSensor',
    'ngAnimate',
    'mgcrea.ngStrap',
    'color.picker',
    'ngSanitize',
    'ngTagsInput'
]);
app.config(['$compileProvider', '$asideProvider', '$alertProvider', function($compileProvider, $asideProvider, $alertProvider) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
    angular.extend($asideProvider.defaults, {
        templateUrl: 'template/aside.task.tpl.html',
        animation: 'am-slide-bottom',
        placement: 'bottom'
    });
    angular.extend($alertProvider.defaults, {
      container: 'body',
      placement: 'top-right',
      duration: '2',
      show: false,
      templateUrl: 'template/alert.tpl.html'
    });
}]);

app.filter('myFilter', function(){
  // Just add arguments to your HTML separated by :
  // And add them as parameters here, for example:
  // return function(dataArray, searchTerm, argumentTwo, argumentThree) {
  return function(dataArray,searchName, searchSupervisor) {
      // If no array is given, exit.
      if (!dataArray) {
          return;
      }
      // If no search term exists, return the array unfiltered.
      else if (!searchName) {
          return dataArray;
      }
      // Otherwise, continue.
      else {
           // Convert filter text to lower case.
           var name = searchName.toLowerCase();
           var supervisor = searchSupervisor.toLowerCase();
           // Return the array and filter it by looking for any occurrences of the search term in each items id or name.
           return dataArray.filter(function(item){
              // var termInId = item.id.toLowerCase().indexOf(name) > -1;
              var termInName = item.name.toLowerCase().indexOf(name) > -1;
              var termInText = item.supervisor.text.toLowerCase().indexOf(supervisor) > -1;

              return termInName || termInText;
           });
      }
  }
});
