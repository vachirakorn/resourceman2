'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', ['$scope', '$timeout', '$http', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$aside', '$alert', function($scope, $timeout, $http, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $aside, $alert) {
            $scope.taskTemp = {};
            $scope.rowTemp = {};
            $scope.projectTemp = {};
            $scope.projectsName = [];
            var isFirstLoad = true;
            var objectModel;
            var dataToRemove;
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
            var saveAlert;

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
                sideMode: 'TreeTable',
                daily: true,
                maxHeight: false,
                width: false,
                zoom: 1,
                columns: ['model.name'],
                treeTableColumns: [],
                columnsHeaders: {
                    'model.name': 'Name',
                    'from': 'From',
                    'to': 'To',
                    'model.utilization': 'Utilization',
                    'model.priorityLevel': 'Priority'
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
                    },
                    'model.priorityLevel': function(priorityLevel) {
                        //capitalize the first letter
                        return (!!priorityLevel) ? priorityLevel.charAt(0).toUpperCase() + priorityLevel.substr(1).toLowerCase() : '';

                    }
                },
                treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                columnsHeaderContents: {
                    'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                    'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                    'to': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                    'model.utilization': '<div style="text-align:center;width:30px;"><i class="fa fa-bolt"></i></div>'
                },
                autoExpand: 'both',
                taskOutOfRange: 'truncate',
                fromDate: moment(null),
                toDate: undefined,
                rowContentEnabled: true,
                taskContentEnabled: true,
                rowContent: '<i class="fa fa-{{row.model.parent===\'\'?\'plus-square-o \':\'\'}}" style=\"color:#006699;\" ng-click="scope.addSubResource(row.model)"></i><i class="fa fa-{{row.model.parent===\'\'?\'user\':\'\'}}"></i> {{row.model.name}}',
                taskContent: '<i class=\"fa fa-' + '{{task.model.priorityLevel===\'critical\'? \'exclamation-triangle\':task.model.priorityLevel===\'high\'? \'exclamation\':\'\'}}' + '\"></i> {{task.model.name}} {{(task.model.project!==undefined && task.model.project!==\'\')?\'|\':\'\'}} {{task.model.project}}',
                allowSideResizing: true,
                labelsEnabled: true,
                currentDate: 'column',
                currentDateValue: new Date(),
                draw: true,
                readOnly: false,
                groupDisplayMode: 'disabled',
                projectView: false,
                filterTask: '',
                filterRow: '',
                timeFrames: {
                    'day': {
                        start: moment('0:00', 'HH:mm'),
                        end: moment('23:59', 'HH:mm'),
                        color: '#ACFFA3',
                        working: true,
                        default: true
                    },
                    // 'noon': {
                    //     start: moment('12:30', 'HH:mm'),
                    //     end: moment('13:30', 'HH:mm'),
                    //     working: false,
                    //     default: true
                    // },
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
                        project: 'Unassigned Project', //default project name of the task
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
                        api.rows.on.move($scope, function(row, oldIndex, newIndex) {
                            var rowModel = row.model;
                            var oldOrder, newOrder;
                            var isProjectRow = (rowModel.height !== undefined) ? true : false;
                            if (oldIndex < newIndex) {
                                oldOrder = $scope.data[newIndex].order;
                                newOrder = $scope.data[newIndex - 1].order;
                            } else if (newIndex < oldIndex) {
                                oldOrder = $scope.data[newIndex].order;
                                newOrder = $scope.data[newIndex + 1].order;
                            }
                            console.log('oldOrder : ' + oldOrder + ' newOrder : ' + newOrder + 'isProjectRow : ' + isProjectRow);
                            //  console.log('sent : '+row);

                            $http({
                                method: 'POST',
                                url: 'scripts/controllers/dataLoader.jsp',
                                params: {
                                    mode: 'changeOrder',
                                    oldOrder: oldOrder,
                                    newOrder: newOrder,
                                    isProjectRow: isProjectRow
                                },
                                headers: {
                                    'Content-Type': 'application/json'
                                }

                            }).then(function mySuccess(response) {
                                console.log('[LOG] data successfully changed order');
                                saveAlert = $alert({
                                    title: rowModel.name,
                                    content: ' successfully change order!',
                                    type: 'success',

                                });
                                saveAlert.$promise.then(function() {
                                    saveAlert.show();
                                });
                                $scope.reload();
                                console.log(response);
                            }, function myError(response) {
                                console.log('[LOG] failed to save the data');
                                console.log(response);
                            });


                        });
                        api.tasks.on.rowChange($scope, function(task, oldRow) {
                            //save old row
                            $scope.resourceSave(oldRow);
                            //  task.model.id = utils.randomUuid();
                            $scope.resourceSave(task.row);
                            //  $scope.reload();
                        });
                        api.tasks.on.add($scope, function(task) {
                            //  console.log(task.row.model.currentProject);
                            if ($scope.options.projectView && task.row.model.currentProject !== undefined)
                                task.model.project = task.row.model.currentProject;

                        });
                        api.dependencies.on.add($scope, function(dependency) {
                            console.log('dependencies change');
                            $scope.taskSave(dependency.task.row.model, dependency.task.model, 'autosave');
                        });
                        api.dependencies.on.remove($scope, function(dependency) {
                            console.log('remove dependencies');
                            $scope.taskSave(dependency.task.row.model, dependency.task.model, 'autosave');
                        });

                        // When gantt is ready, load data.
                        // `data` attribute could have been used too.
                        if (isFirstLoad) {
                            $scope.load();
                            isFirstLoad = false;
                        }


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


                                    //auto save if user click other tasks
                                    if (isAsideOpened && $scope.asideTask !== null) {
                                        $scope.taskSave($scope.asideTask, 'autosave');
                                        taskAside.hide();
                                    } else if (isAsideOpened && $scope.asideRow !== null) {
                                        $scope.resourceSave($scope.asideRow, 'autosave');
                                        resourceAside.hide();
                                    }

                                    $scope.asideTask = directiveScope.task;

                                    taskAside.$promise.then(function() {
                                        isAsideOpened = true;
                                        taskAside.show();
                                    });

                                });
                                element.bind('mousedown touchstart', function() {
                                    event.stopPropagation();
                                    $scope.taskTempModel = angular.copy(directiveScope.task.model);
                                });


                            } else if (directiveName === 'ganttRowLabel') {
                                element.unbind();

                                element.bind('click', function() {
                                    event.stopPropagation();
                                    logRowEvent('row-label-click', directiveScope.row);

                                    //auto save if user click other rows
                                    if (isAsideOpened && $scope.asideRow !== null && $scope.asideRow.height === undefined) {
                                        $scope.resourceSave($scope.asideRow, 'autosave');
                                        resourceAside.hide();
                                    } else if (isAsideOpened && $scope.asideRow !== null && $scope.asideRow.height !== undefined) {
                                        $scope.projectSave($scope.asideProject, 'autosave');
                                        projectAside.hide();
                                    } else if (isAsideOpened && $scope.asideTask !== null && $scope.asideRow !== null) {
                                        $scope.taskSave($scope.asideTask, 'autosave');
                                        taskAside.hide();
                                    }


                                    if (directiveScope.row.model.height === undefined) {
                                        $scope.asideRow = directiveScope.row;
                                        resourceAside.$promise.then(function() {
                                            isAsideOpened = true;
                                            resourceAside.show();
                                        });

                                    } else if (directiveScope.row.model.height !== undefined) {
                                        $scope.asideProject = directiveScope.row;
                                        projectAside.$promise.then(function() {
                                            isAsideOpened = true;
                                            projectAside.show();

                                        });

                                    }

                                });
                                element.bind('mousedown touchstart', function() {
                                    event.stopPropagation();

                                    if (directiveScope.row.model.height === undefined) {
                                        $scope.rowTempModel = angular.copy(directiveScope.row.model);
                                    } else if (directiveScope.row.model.height !== undefined) {
                                        $scope.projectTempModel = angular.copy(directiveScope.row.model);
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
            var getLastOrder = function(type) {
                console.log('lastOrder: ' + $scope.data[$scope.data.length - 1].order);
                var maxx = -99999;
                for (var i = $scope.data.length - 1; i >= 0; i--) {

                    if (type === 'resource' && $scope.data[i].order !== undefined && $scope.data[i].order > maxx) {
                        maxx = $scope.data[i].order;
                    } else if (type === 'project' && $scope.data[i].projectOrder !== undefined && $scope.data[i].projectOrder > maxx && $scope.data[i].projectOrder < 99999) {
                        maxx = $scope.data[i].projectOrder;
                    }
                }
                return maxx;

            };
            $scope.addSubResource = function(rowModel) {
                //alert('Icon from ' + rowModel.name + ' row has been clicked.');
                event.stopPropagation();
                if (isAsideOpened) {
                    if ($scope.asideRow !== null) {

                    } else if ($scope.taskRow !== null) {

                    }
                }

                if ($scope.options.projectView) {
                    $scope.data.push({
                        order: getLastOrder('resource') + 1, //append to the bottom of resources list
                        name: 'New Row',
                        tel: '',
                        email: '',
                        utilization: '0',
                        parent: rowModel.id,
                        oldParent: rowModel.oldParent
                    });
                } else {
                    $scope.data.push({
                        order: getLastOrder('resource') + 1, //append to the bottom of resources list
                        name: 'New Row',
                        tel: '',
                        email: '',
                        utilization: '0',
                        parent: rowModel.id
                    });
                }

                //assign last row

                $scope.asideRow = $scope.data[$scope.data.length - 1];
                //pop up the aside
                resourceAside.$promise.then(function() {
                    resourceAside.show();
                });

            };
            $scope.addResource = function() {
                //  angular.copy($scope.data, dataTemp);
                //add a new resource to the view
                if (!$scope.options.projectView)
                    $scope.data.push({

                        order: getLastOrder('resource') + 1, //append to the bottom of resources list
                        name: 'New Resource',
                        tel: '',
                        email: '',
                        utilization: '0',
                        parent: ''
                    });

                //assign last row
                $scope.asideRow = $scope.data[$scope.data.length - 1];
                //pop up the aside
                resourceAside.$promise.then(function() {
                    resourceAside.show();
                });


            };

            $scope.addProject = function() {
                //copy
                if ($scope.options.projectView)
                    $scope.data.push({
                        name: 'New Project',
                        projectOrder: getLastOrder('project') + 1,
                        height: '3em',
                        classes: 'gantt-row-milestone',
                        color: '#45607D',
                        budget: '',
                        manager: '',
                        data: ''
                    });
                $scope.asideProject = $scope.data[$scope.data.length - 1];

                projectAside.$promise.then(function() {
                    projectAside.show();
                });


            };


            $scope.resourceSave = function(row, type) {
                var rowModel = row.model;
                var tempRowModel = angular.copy(rowModel);
                if ($scope.options.projectView) {
                    if (rowModel.oldId !== undefined)
                        tempRowModel.id = rowModel.oldId;
                    if (rowModel.oldParent !== undefined)
                        tempRowModel.parent = rowModel.oldParent;
                } else
                    tempRowModel.id = rowModel.id;

                console.log("SEND : " + JSON.stringify(tempRowModel));
                $http({
                        method: 'POST',
                        url: 'scripts/controllers/dataLoader.jsp',
                        params: {
                            mode: 'resourceSave',
                            row: JSON.stringify(tempRowModel)
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }

                    }).then(function mySuccess(response) {
                            console.log('[LOG] row successfully saved');
                            if (response.data.trim() === 'duplicate resource name exists') {
                                console.log('');
                                saveAlert = $alert({
                                    title: tempRowModel.name,
                                    content: ' has duplicated resource name exist!',
                                    duration: '4',
                                    type: 'danger',

                                });
                                //delete duplicated row name
                                dataToRemove = [{
                                    'id': rowModel.id
                                }];
                                $scope.remove();
                                isAsideOpened = false;
                            } else if (type === 'autosave') {
                                saveAlert = $alert({
                                    title: tempRowModel.name,
                                    content: ' successfully autosaved!',
                                    type: 'success',

                                });
                                isAsideOpened = false;
                            } else if (type === 'save') {
                                saveAlert = $alert({
                                    title: tempRowModel.name,
                                    content: ' successfully saved!',
                                    type: 'success'
                                });
                                isAsideOpened = false;
                            }

                        }
                        saveAlert.$promise.then(function() {
                            saveAlert.show();
                        });


                    },
                    function myError(response) {
                        console.log('[LOG] fail to save the row');
                        $scope.cancel('resource');
                        console.log(response);
                    });


        };

        $scope.projectSave = function(row, type) {

            var rowModel = row.model;
            var rowModelId;
            var tempRowModel = angular.copy(rowModel);
            if ($scope.options.projectView && rowModel.oldId !== undefined)
                tempRowModel.id = rowModel.oldId;

            tempRowModel.oldId = undefined;
            tempRowModel.oldParent = undefined;
            console.log("send: " + JSON.stringify(tempRowModel));
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'projectSave',
                    row: JSON.stringify(tempRowModel)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('[LOG] project successfully saved');
                //update project has no response.data
                console.log(response);
                $scope.getProjectsName();
                if (type === 'autosave') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully autosaved!',
                        type: 'success',

                    });
                    isAsideOpened = false;
                } else if (type === 'save') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully saved!',
                        type: 'success'
                    });
                    isAsideOpened = false;
                }
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
                //project list changed,updating projects name scope

            }, function myError(response) {
                console.log('[LOG] Failed to save the project');
                $scope.cancel('project');

            });

        };
        $scope.taskSave = function(task, type) {
            var taskModel = task.model;
            var rowModel = task.row.model;
            var tasks = [];
            var rowModelId;

            if ($scope.options.projectView) {
                console.log('[LOG] FIND ROW WITH THE SAME ROWID');
                for (var i = 0; i < $scope.data.length; i++) {
                    if ($scope.data[i].oldId === rowModel.oldId && $scope.data[i].tasks !== undefined) {
                        for (var j = 0; j < $scope.data[i].tasks.length; j++) {
                            tasks.push($scope.data[i].tasks[j]);
                        }
                        console.log('[LOG] FOUND!');
                        console.log(JSON.stringify(tasks) + '\n');
                    }
                }
                rowModelId = rowModel.oldId;
            } else {
                tasks = rowModel.tasks;
                rowModelId = rowModel.id;
            }

            console.log('SEND : ' + JSON.stringify(rowModel));
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'taskSave',
                    id: rowModelId,
                    tasks: JSON.stringify(tasks)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('[LOG] rowModel successfully saved');
                if(type ==='save'){
                  saveAlert = $alert({
                      title: taskModel.name,
                      content: ' successfully saved!'),
                      type: 'success',

                  });
                }else if(type ==='autosave'){
                  saveAlert = $alert({
                      title: taskModel.name,
                      content: ' successfully autosaved!'),
                      type: 'success',

                  });

                }else if(type ==='delete'){
                  saveAlert = $alert({
                      title: taskModel.name,
                      content: ' successfully deleted!'),
                      type: 'success',

                  });
                }
                isAsideOpened = false;
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });

            }, function myError(response) {
                console.log('[LOG] Failed to save the tasks');
                $scope.cancel('row');

            });


            //$scope.reload();
        };
        $scope.resourceDelete = function(row) {
            var rowModel = row.model;

            //delete row offline
            dataToRemove = [{
                'id': rowModel.id
            }];
            $scope.remove();

            //delete row online
            if (!$scope.isNewResource) {

                $http({
                    method: 'POST',
                    url: 'scripts/controllers/dataLoader.jsp',
                    params: {
                        mode: 'resourceDelete',
                        id: rowModel.id
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }

                }).then(function mySuccess(response) {
                    console.log('[LOG] rowModel successfully deleted');
                    isAsideOpened = false;
                }, function myError(response) {
                    console.log('[LOG] fail to delete the rowModel');
                    $scope.cancel('row');

                });
            }

        };
        $scope.projectDelete = function(row) {
            var rowModel = row.model;

            //delete row offline
            dataToRemove = [{
                'id': rowModel.id
            }];
            $scope.remove();

            //delete row online
            if (!$scope.isNewProject) {
                $http({
                    method: 'POST',
                    url: 'scripts/controllers/dataLoader.jsp',
                    params: {
                        mode: 'projectDelete',
                        id: rowModel.id
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }

                }).then(function mySuccess(response) {
                    console.log('[LOG] project rowModel successfully deleted');
                    isAsideOpened = false;
                }, function myError(response) {
                    console.log('[LOG] fail to delete the project rowModel');
                    $scope.cancel('row');

                });
            }

        };
        $scope.taskDelete = function(task) {
            var rowModel = task.row.model;
            var taskModel = task.model;

            //delete task offline
            dataToRemove = [{
                'id': rowModel.id,
                'tasks': [{
                    'id': taskModel.id
                }]
            }];
            $scope.remove();

            //delete task online,
            //note : reuse save function
            $scope.taskSave(task, 'delete');
        };


        // Remove data action
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
            $scope.api.dependencies.refresh();
        };


        $scope.cancel = function(type) {

            if (type === 'task') {
                angular.copy($scope.taskTempModel, $scope.asideTask.model);
            } else if (type === 'row') {
                angular.copy($scope.rowTempModel, $scope.asideRow.model);
            } else if (type === 'project') {
                angular.copy($scope.projectTempModel, $scope.asideProject.model);
            }
            isAsideOpened = false;

        };

        $scope.load = function() {

            //reset temp data when change view
            if (isAsideOpened) {
                console.log('[LOG] Close aside');
                taskAside.hide();
                projectAside.hide();
                resourceAside.hide();
                isAsideOpened = false;
            }
            $scope.data = [];
            $scope.taskTemp = {};
            $scope.rowTemp = {};
            $scope.projectTemp = {};

            //begin load
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
                    console.log('[LOG] Successfully loaded resourcces!');
                    $scope.data = response.data;
                    $scope.getProjectsName();
                }, function myError(response) {
                    console.log('fail');

                });

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
                    var splitedProjectArr = [];
                    var tempData = [];
                    for (var i = 0; i < response.data.length; i++) {
                        //  console.log(response.data[i]);
                        if (response.data[i].end) {
                            tempData = tempData.concat(changeAllId(splitedProjectArr));
                            splitedProjectArr = [];
                        } else {
                            splitedProjectArr.push(response.data[i]);
                            //  console.log('[LOG] split project arr[' + i + '] : ' + angular.toJson(splitedProjectArr));
                        }

                    }
                    //console.log("temp data : " + angular.toJson(tempData));
                    $scope.data = tempData;
                    $scope.getProjectsName();

                }, function myError(response) {
                    console.log('fail');
                });

            }
            $scope.timespans = Sample.getSampleTimespans();
        };

        var changeAllId = function(arr) {
            var map = [];
            var newID, oldID;
            for (var i = 0; i < arr.length; i++) {
                newID = utils.randomUuid();
                oldID = arr[i].id;
                map[oldID] = newID;
                arr[i].id = newID;
                arr[i].oldId = oldID;

            }
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].parent !== '' && arr[i].parent !== null && arr[i].oldParent === undefined) {
                    arr[i].oldParent = arr[i].parent;
                    arr[i].parent = map[arr[i].parent];
                } else
                    arr[i].parent = map[arr[i].parent];

            }
            //console.log("arr : " + arr);
            return arr;

        };

        $scope.getProjectsName = function() {
            $scope.projectsName = [];
            $http({
                method: 'POST',
                url: 'scripts/controllers/dataLoader.jsp',
                params: {
                    mode: 'getProjectsName'
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function mySuccess(response) {
                console.log('[LOG] load project name completed!');
                for (var i = 0; i < response.data.length; i++) {
                    $scope.projectsName.push({
                        label: response.data[i].name,
                        value: response.data[i].name
                    });
                }

            }, function myError(response) {
                console.log('[LOG] failed to load project name');

            });

        };

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



        $scope.expandAll = function() {
            $scope.api.tree.expandAll();
        };

        $scope.collapseAll = function() {
            $scope.api.tree.collapseAll();
        };



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
        $scope.isValidData = function(from, to) {

            //  console.log(moment(from) < moment(to));
            return moment(from) < moment(to);

        };


        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        $scope.$watch('options.projectView', function(projectView) {

            if (projectView) {
                $scope.options.treeTableColumns = ['model.priorityLevel', 'from', 'to'];

            } else {
                $scope.options.treeTableColumns = [];

            }

            //when start or change view
            if (!isFirstLoad) $scope.load();

        });

        $scope.sampleColorsPicker = {
            sampleColors: ['#1abc9c', '#49d049', '#3498db', '#9b59b6', '#3d566e',
                '#f1c40f', '#e67e22', '#e74c3c', '#e678b6', '#95a5a6'
            ],
            setTaskColor: function(color) {
                $scope.asideTask.color = color;
            },
            setProjectColor: function(color) {
                $scope.asideProject.color = color;
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
                if ($scope.asideTask.color !== undefined) {
                    $scope.asideTask.color = color;
                } else if ($scope.asideProject.color !== undefined) {
                    $scope.asideProject.color = color;
                }


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
