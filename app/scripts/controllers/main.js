'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', ['$scope', '$timeout', '$http', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$aside', function($scope, $timeout, $http, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $aside) {

        var objectModel;
        var dataToRemove;
        var dataCache = [];
        var taskCache;
        var isAsideOpened;
        var taskAside = $aside({
            scope: $scope,
            show: false,
            backdrop: false,
            templateUrl: 'template/aside.task.tpl.html'

        });
        var resourceAside = $aside({
            scope: $scope,
            show: false,
            backdrop: false,
            templateUrl: 'template/aside.resource.tpl.html'

        });
        var projectAside = $aside({
            scope: $scope,
            show: false,
            backdrop: false,
            templateUrl: 'template/aside.project.tpl.html'

        });
        // Event handler
        var logScrollEvent = function(left, date, direction) {
            if (date !== undefined) {
                $log.info('[Event] api.on.scroll: ' + left + ', ' + (date === undefined ? 'undefined' : date.format()) + ', ' + direction);
            }
        };

        // Event handler
        var logDataEvent = function(eventName) {
            $log.info('[Event] ' + eventName);
        };

        // Event handler
        var logTaskEvent = function(eventName, task) {
            $log.info('[Event] ' + eventName + ': ' + task.model.name);
        };

        // Event handler
        var logRowEvent = function(eventName, row) {
            $log.info('[Event] ' + eventName + ': ' + row.model.name);
        };

        // Event handler
        var logTimespanEvent = function(eventName, timespan) {
            $log.info('[Event] ' + eventName + ': ' + timespan.model.name);
        };

        // Event handler
        var logLabelsEvent = function(eventName, width) {
            $log.info('[Event] ' + eventName + ': ' + width);
        };

        // Event handler
        var logColumnsGenerateEvent = function(columns, headers) {
            $log.info('[Event] ' + 'columns.on.generate' + ': ' + columns.length + ' column(s), ' + headers.length + ' header(s)');
        };

        // Event handler
        var logRowsFilterEvent = function(rows, filteredRows) {
            $log.info('[Event] rows.on.filter: ' + filteredRows.length + '/' + rows.length + ' rows displayed.');
        };

        // Event handler
        var logTasksFilterEvent = function(tasks, filteredTasks) {
            $log.info('[Event] tasks.on.filter: ' + filteredTasks.length + '/' + tasks.length + ' tasks displayed.');
        };

        // Event handler
        var logReadyEvent = function() {
            $log.info('[Event] core.on.ready');
        };

        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };

        // angular-gantt options
        $scope.options = {
            mode: 'custom',
            scale: 'day',
            sortMode: undefined,
            sideMode: 'Table',
            daily: false,
            maxHeight: false,
            width: true,
            zoom: 1,
            columns: ['model.name', 'model.utilization'],
            treeTableColumns: ['from', 'to'],
            columnsHeaders: {
                'model.name': 'Name',
                'from': 'From',
                'to': 'To',
                'model.utilization': 'Utilization'
            },
            columnsClasses: {
                'model.name': 'gantt-column-name',
                'from': 'gantt-column-from',
                'to': 'gantt-column-to',
                'model.utilization': 'gantt-column-utilization'
            },
            columnsFormatters: {
                'from': function(from) {
                    return from !== undefined ? from.format('lll') : undefined;
                },
                'to': function(to) {
                    return to !== undefined ? to.format('lll') : undefined;
                },
                'model.utilization': function(utilization) {
                    return utilization + '%';
                }
            },
            treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'to': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'model.utilization': '<div style="text-align:center;width:30px;"><i class="fa fa-bolt"></i></div>'
            },
            autoExpand: 'none',
            taskOutOfRange: 'truncate',
            fromDate: moment(null),
            toDate: undefined,
            rowContentEnabled: true,
            taskContentEnabled: true,
            rowContent: '<i class="fa fa-user"></i> {{row.model.name}}',
            taskContent: '<i class=\"fa fa-' + '{{task.model.priorityLevel===\'critical\'? \'exclamation\':\'a\'}}' + '\"></i> {{task.model.name}} | {{task.model.project}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'column',
            currentDateValue: moment(),
            draw: true,
            readOnly: false,
            groupDisplayMode: 'disabled',
            projectView: false,
            filterTask: '',
            filterRow: '',
            timeFrames: {
                'day': {
                    start: moment('9:00', 'HH:mm'),
                    end: moment('17:30', 'HH:mm'),
                    color: '#ACFFA3',
                    working: true,
                    default: true
                },
                'noon': {
                    start: moment('12:30', 'HH:mm'),
                    end: moment('13:30', 'HH:mm'),
                    working: false,
                    default: true
                },
                'closed': {
                    working: false,
                    default: true
                },
                'weekend': {
                    working: false
                },
                'holiday': {
                    working: false,
                    color: 'red',
                    classes: ['gantt-timeframe-holiday']
                }
            },
            dateFrames: {
                'weekend': {
                    evaluator: function(date) {
                        return date.isoWeekday() === 6 || date.isoWeekday() === 7;
                    },
                    targets: ['weekend']
                },
                '11-november': {
                    evaluator: function(date) {
                        return date.month() === 10 && date.date() === 11;
                    },
                    targets: ['holiday']
                }
            },
            timeFramesWorkingMode: 'hidden',
            timeFramesNonWorkingMode: 'visible',
            columnMagnet: '15 minutes',
            timeFramesMagnet: true,
            dependencies: {
                enabled: true,
                conflictChecker: true
            },
            targetDataAddRowIndex: undefined,
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function() {
                return {
                    id: utils.randomUuid(), // Unique id of the task.
                    name: 'New task', // Name shown on top of each task.
                    color: '#AA8833' // Color of the task in HEX format (Optional).
                };
            },
            api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.core.on.ready($scope, function() {
                    // Log various events to console
                    api.scroll.on.scroll($scope, logScrollEvent);
                    api.core.on.ready($scope, logReadyEvent);

                    api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
                    api.data.on.load($scope, addEventName('data.on.load', logDataEvent));
                    api.data.on.clear($scope, addEventName('data.on.clear', logDataEvent));
                    api.data.on.change($scope, addEventName('data.on.change', logDataEvent));

                    api.tasks.on.add($scope, addEventName('tasks.on.add', logTaskEvent));
                    api.tasks.on.change($scope, addEventName('tasks.on.change', logTaskEvent));
                    api.tasks.on.rowChange($scope, addEventName('tasks.on.rowChange', logTaskEvent));
                    api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));

                    if (api.tasks.on.moveBegin) {
                        api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', logTaskEvent));
                        //api.tasks.on.move($scope, addEventName('tasks.on.move', logTaskEvent));
                        api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', logTaskEvent));

                        api.tasks.on.resizeBegin($scope, addEventName('tasks.on.resizeBegin', logTaskEvent));
                        //api.tasks.on.resize($scope, addEventName('tasks.on.resize', logTaskEvent));
                        api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', logTaskEvent));
                    }

                    api.rows.on.add($scope, addEventName('rows.on.add', logRowEvent));
                    api.rows.on.change($scope, addEventName('rows.on.change', logRowEvent));
                    api.rows.on.move($scope, addEventName('rows.on.move', logRowEvent));
                    api.rows.on.remove($scope, addEventName('rows.on.remove', logRowEvent));

                    api.side.on.resizeBegin($scope, addEventName('labels.on.resizeBegin', logLabelsEvent));
                    //api.side.on.resize($scope, addEventName('labels.on.resize', logLabelsEvent));
                    api.side.on.resizeEnd($scope, addEventName('labels.on.resizeEnd', logLabelsEvent));

                    api.timespans.on.add($scope, addEventName('timespans.on.add', logTimespanEvent));
                    api.columns.on.generate($scope, logColumnsGenerateEvent);

                    api.rows.on.filter($scope, logRowsFilterEvent);
                    api.tasks.on.filter($scope, logTasksFilterEvent);

                    api.data.on.change($scope, function(newData) {
                        if (dataToRemove === undefined) {
                            dataToRemove = [];
                        }
                    });

                    // When gantt is ready, load data.
                    // `data` attribute could have been used too.
                    $scope.load();

                    // Add some DOM events
                    // api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                    //
                    //     if (directiveName === 'ganttTask') {
                    //         element.bind('click', function(event) {
                    //             event.stopPropagation();
                    //             logTaskEvent('task-click', directiveScope.task);
                    //         });
                    //         element.bind('mousedown touchstart', function(event) {
                    //             event.stopPropagation();
                    //             $scope.live.row = directiveScope.task.row.model;
                    //             if (directiveScope.task.originalModel !== undefined) {
                    //                 $scope.live.task = directiveScope.task.originalModel;
                    //             } else {
                    //                 $scope.live.task = directiveScope.task.model;
                    //             }
                    //             $scope.$digest();
                    //         });
                    //     } else if (directiveName === 'ganttRow') {
                    //         element.bind('click', function(event) {
                    //             event.stopPropagation();
                    //             logRowEvent('row-click', directiveScope.row);
                    //         });
                    //         element.bind('mousedown touchstart', function(event) {
                    //             event.stopPropagation();
                    //             $scope.live.row = directiveScope.row.model;
                    //             $scope.$digest();
                    //         });
                    //     } else if (directiveName === 'ganttRowLabel' ) {
                    //         element.bind('click', function() {
                    //             logRowEvent('row-label-click', directiveScope.row);
                    //         });
                    //         element.bind('mousedown touchstart', function() {
                    //             $scope.live.row = directiveScope.row.model;
                    //             $scope.$digest();
                    //         });
                    //     }
                    // });


                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        //set colorpicker option



                        if (directiveName === 'ganttTask') {
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logTaskEvent('task-click', directiveScope.task);
                                $scope.asideTask = directiveScope.task.model;
                                $scope.asideRow = directiveScope.task.row.model;
                                angular.copy($scope.data, dataCache);


                                taskAside.$promise.then(function() {
                                    taskAside.show();
                                });

                            });


                        } else if (directiveName === 'ganttRowLabel') {
                            element.unbind();
                            element.bind('click', function() {
                                logRowEvent('row-label-click', directiveScope.row);

                                if (isAsideOpened) {
                                    //if user click other rows while aside still opens then fire cancel() old ones
                                    $scope.cancel();
                                    projectAside.hide();

                                }
                                angular.copy($scope.data, dataCache);
                                $scope.$digest();
                                console.log("copy");

                                if (directiveScope.row.model.height === undefined) {
                                    $scope.asideRow = directiveScope.row.model;
                                    resourceAside.$promise.then(function() {
                                        isAsideOpened = true;
                                        console.log("aside opened");
                                        resourceAside.show();
                                    });
                                } else {
                                  console.log("bind scope");
                                    $scope.asideProjectRow = directiveScope.row.model;

                                    projectAside.$promise.then(function() {
                                        isAsideOpened = true;
                                        console.log("aside opened");
                                        projectAside.show();
                                    });
                                }


                            });
                        }
                    });

                    //                    api.tasks.on.rowChange($scope, function(task) {
                    //                        $scope.live.row = task.row.model;
                    //                    });
                    //                      api.rows.on.add($scope,function(row){
                    //                    	  console.log("add new row : " + row.model.name);
                    //
                    //
                    //                      });

                    objectModel = new ObjectModel(api);
                });

            }
        };
        var getLastOrder = function() {
            console.log("lastOrder: " + $scope.data[$scope.data.length - 1].order);
            return $scope.data[$scope.data.length - 1].order;

        };
        $scope.addResource = function() {
            angular.copy($scope.data, dataCache);
            //add a new resource to the view
            $scope.data.push({
                order: getLastOrder() + 1, //append to the bottom of resources list
                name: 'New Resource',
                tel: '',
                email: '',
                utilization: '0',
                rid: '0'
            });
            //pop up the aside
            $scope.asideRow = $scope.data[$scope.data.length - 1];

            resourceAside.$promise.then(function() {
                resourceAside.show();
            });


        };

        $scope.addProject = function() {
            angular.copy($scope.data, dataCache);
            $scope.data.push({
                name: 'New Project',
                height: '3em',
                classes: 'gantt-row-milestone',
                color: '#45607D',
                budget: '',
                manager: '',
                data: '',
                rid: '0'
            });
            $scope.asideProjectRow = $scope.data[$scope.data.length - 1];

            projectAside.$promise.then(function() {
                projectAside.show();
            });


        };

        $scope.rowSave = function(row) {
            //..db
            //add a new resource to db
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'rowSave',
                    row: JSON.stringify(row)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('success');
                isAsideOpened = false;
                console.log(response);
            }, function myError(response) {
                console.log('fail');
                $scope.cancel();
                console.log(response);
            });

        };
        $scope.projectSave = function(row) {
            //..db
            //add a new resource to db
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'projectSave',
                    row: JSON.stringify(row)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('success');
                isAsideOpened = false;
                console.log(response);
            }, function myError(response) {
                console.log('fail');
                $scope.cancel();
                console.log(response);
            });

        };
        $scope.taskSave = function(rid, tasks) {
            // var i,j;
            //..db
            // for (i = 0; i < $scope.data.length; i++) {
            //     if ($scope.data[i].id === rowid) {
            //         for (j = 0; j < $scope.data[i].tasks.length; j++) {
            //             if ($scope.data[i].tasks[j].id === taskid) {
            //                 break;
            //             }
            //         }
            //     }
            // }
            //  alert('i: '+i+' j: '+j);

            console.log("sent: " + JSON.stringify(tasks));
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'taskSave',
                    rid: rid,
                    tasks: JSON.stringify(tasks)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('success');
                isAsideOpened = false;
                console.log(response);
            }, function myError(response) {
                console.log('fail');
                $scope.cancel();
                console.log(response);
            });

            //$scope.reload();
        };
        $scope.resourceDelete = function(rowid) {

            dataToRemove = [{
                'id': rowid
            }];
            $scope.remove();
            $scope.resourceSave();
        };
        $scope.taskDelete = function(rowid, taskid) {

            dataToRemove = [{
                'id': rowid,
                'tasks': [{
                    'id': taskid
                }]
            }];
            $scope.remove();
            $scope.taskSave();
        };
        // Remove data action
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
            $scope.api.dependencies.refresh();
        };


        $scope.cancel = function() {
            angular.copy(dataCache, $scope.data);
            isAsideOpened = false;
            console.log("aside closed");
        };

        // Reload data action
        //$http.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';

        $scope.load = function() {
            if (!$scope.options.projectView) {
                $http({
                    method: 'POST',
                    url: 'scripts/controllers/dataLoader.jsp',
                    params: {
                        mode: 'load'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function mySuccess(response) {
                    console.log('success');
                    $scope.data = response.data;


                }, function myError(response) {
                    console.log('fail');
                    console.log(response);
                });

                // dataToRemove = undefined;
                $scope.timespans = Sample.getSampleTimespans();
            } else {
              $http({
                  method: 'POST',
                  url: 'scripts/controllers/dataLoader.jsp',
                  params: {
                      mode: 'projectLoad'
                  },
                  headers: {
                      'Content-Type': 'application/json'
                  }
              }).then(function mySuccess(response) {
                  console.log('success');
                  $scope.data = response.data;


              }, function myError(response) {
                  console.log('fail');
                  console.log(response);
              });


                $scope.timespans = Sample.getSampleTimespans();
            }

        };

        $scope.$watch('options.projectView', function(projectView) {
            if (projectView) {
                $scope.options.sideMode = 'TreeTable';
                //$scope.options.groupDisplayMode = 'disabled';
            } else {
                $scope.options.sideMode = 'Table';
              //  $scope.options.groupDisplayMode = 'disabled';
            }
            $scope.load();

        });

        $scope.reload = function() {
            $scope.load();
        };



        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
        };

        // Add data to target row index
        $scope.addOverlapTaskToTargetRowIndex = function() {
            var targetDataAddRowIndex = parseInt($scope.options.targetDataAddRowIndex);

            if (targetDataAddRowIndex) {
                var targetRow = $scope.data[$scope.options.targetDataAddRowIndex];

                if (targetRow && targetRow.tasks && targetRow.tasks.length > 0) {
                    var firstTaskInRow = targetRow.tasks[0];
                    var copiedColor = firstTaskInRow.color;
                    var firstTaskEndDate = firstTaskInRow.to.toDate();
                    var overlappingFromDate = new Date(firstTaskEndDate);

                    overlappingFromDate.setDate(overlappingFromDate.getDate() - 1);

                    var overlappingToDate = new Date(overlappingFromDate);

                    overlappingToDate.setDate(overlappingToDate.getDate() + 7);

                    targetRow.tasks.push({
                        'name': 'Overlapping',
                        'from': overlappingFromDate,
                        'to': overlappingToDate,
                        'color': copiedColor
                    });
                }
            }
        };
        $scope.handleTaskIconClick = function(taskModel) {
            alert('Icon from ' + taskModel.name + ' task has been clicked.');
        };

        $scope.handleRowIconClick = function(rowModel) {
            alert('Icon from ' + rowModel.name + ' row has been clicked.');
        };

        $scope.expandAll = function() {
            $scope.api.tree.expandAll();
        };

        $scope.collapseAll = function() {
            $scope.api.tree.collapseAll();
        };

        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        $scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {
                return undefined;
            }

            if (scale.match(/.*?week.*?/)) {
                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {
                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {
                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {
                return 800 * zoom;
            }

            return 40 * zoom;
        };



        // Visual two way binding.
        // $scope.live = {};
        //
        // var debounceValue = 1000;
        //
        // var listenTaskJson = debounce(function(taskJson) {
        //     if (taskJson !== undefined) {
        //         var task = angular.fromJson(taskJson);
        //         objectModel.cleanTask(task);
        //         var model = $scope.live.task;
        //         angular.extend(model, task); //copy task to model
        //     }
        // }, debounceValue);
        // $scope.$watch('live.taskJson', listenTaskJson);
        //
        // var listenRowJson = debounce(function(rowJson) {
        //     if (rowJson !== undefined) {
        //         var row = angular.fromJson(rowJson);
        //         objectModel.cleanRow(row);
        //         var tasks = row.tasks;
        //
        //         delete row.tasks;
        //         delete row.drawTask;
        //
        //         var rowModel = $scope.live.row;
        //
        //         angular.extend(rowModel, row);
        //
        //         var newTasks = {};
        //         var i, l;
        //
        //         if (tasks !== undefined) {
        //             for (i = 0, l = tasks.length; i < l; i++) {
        //                 objectModel.cleanTask(tasks[i]);
        //             }
        //
        //             for (i = 0, l = tasks.length; i < l; i++) {
        //                 newTasks[tasks[i].id] = tasks[i];
        //             }
        //
        //             if (rowModel.tasks === undefined) {
        //                 rowModel.tasks = [];
        //             }
        //             for (i = rowModel.tasks.length - 1; i >= 0; i--) {
        //                 var existingTask = rowModel.tasks[i];
        //                 var newTask = newTasks[existingTask.id];
        //                 if (newTask === undefined) {
        //                     rowModel.tasks.splice(i, 1);
        //                 } else {
        //                     objectModel.cleanTask(newTask);
        //                     angular.extend(existingTask, newTask);
        //                     delete newTasks[existingTask.id];
        //                 }
        //             }
        //         } else {
        //             delete rowModel.tasks;
        //         }
        //
        //         angular.forEach(newTasks, function(newTask) {
        //             rowModel.tasks.push(newTask);
        //         });
        //     }
        // }, debounceValue);
        // $scope.$watch('live.rowJson', listenRowJson);
        //
        // $scope.$watchCollection('live.task', function(task) {
        //     $scope.live.taskJson = angular.toJson(task, true);
        //     $scope.live.rowJson = angular.toJson($scope.live.row, true);
        // });
        //
        // $scope.$watchCollection('live.row', function(row) {
        //     $scope.live.rowJson = angular.toJson(row, true);
        //     if (row !== undefined && row.tasks !== undefined && row.tasks.indexOf($scope.live.task) < 0) {
        //         $scope.live.task = row.tasks[0];
        //     }
        // });
        //
        // $scope.$watchCollection('live.row.tasks', function() {
        //     $scope.live.rowJson = angular.toJson($scope.live.row, true);
        // });

        $scope.sampleColorsPicker = {
            sampleColors: ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#3d566e', '#f1c40f', '#e67e22', '#e74c3c', '#e678b6', '#95a5a6'],
            setTaskColor: function(color) {
                $scope.asideTask.color = color;
            },
            setProjectColor: function(color) {
                $scope.asideProjectRow.color = color;
            }
        };
        $scope.colorpicker = {
            disabled: false,
            format: 'hex',
            alpha: false,
            swatch: true,
            swatchPos: 'right',
            swatchBootstrap: true,
            pos: 'top left',
            case: 'lower',
            swatchOnly: true,
            inline: false,
            onColorChange: function($event, color) {
                console.log($event, $scope.asideTask.color, color);
                $scope.asideTask.color = color;
                $scope.asideProjectRow.color = color;
            }
        };

        //<---- custom fields ---->
        //directiveScope.task.model.priority;
        $scope.priorityLevels = [{
            'label': 'Critical',
            'value': 'critical'
        }, {
            'label': 'High',
            'value': 'high'
        }, {
            'label': 'Medium',
            'value': 'medium'
        }, {
            'label': 'Low',
            'value': 'low'
        }];
        //directiveScope.task.model.type;
        $scope.types = [{
            'label': 'BR',
            'value': 'BR'
        }, {
            'label': 'CR',
            'value': 'CR'
        }, {
            'label': 'IR',
            'value': 'IR'
        }, {
            'label': 'QR',
            'value': 'QR'
        }, {
            'label': 'SR',
            'value': 'SR'
        }];






    }]);
