'use strict';

/**
 * @ngdoc overview
 * @name angularGanttDemoApp
 * @description
 * # angularGanttDemoApp
 *
 * Main module of the application.
 */
angular.module('angularGanttDemoApp', [
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
    'ngSanitize'
]).config(['$compileProvider','$asideProvider', function($compileProvider,$asideProvider) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
    angular.extend($asideProvider.defaults, {
              templateUrl: 'template/aside.task.tpl.html',
              animation: 'am-slide-bottom',
              placement: 'bottom'
            });

}]);
