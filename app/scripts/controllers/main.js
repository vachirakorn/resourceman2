'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', ['$scope', '$timeout', '$http', '$log', 'ganttUtils', 'GanttObjectModel', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$aside', '$alert', '$document', '$window', function($scope, $timeout, $http, $log, utils, ObjectModel, mouseOffset, debounce, moment, $modal, $aside, $alert, $document, $window) {
        $scope.taskTemp = {};
        $scope.rowTemp = {};
        $scope.projectTemp = {};
        $scope.projectsName = [];
        var isFirstLoad = true;
        var objectModel;
        var dataToRemove;
        var isAsideOpened = false;
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
        var reloadAlert = $alert({
            scope: $scope,
            title: '',
            content: 'Click reload button to update view ',
            type: 'danger',
            duration: '5',
            templateUrl: 'template/reload.alert.tpl.html'
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

        /*
        note: for angular-strap selector
        label -> select options displayed in the view
        value -> real value save in mongoDB
        */

        $scope.selector = {
            priorityLevels: [{
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
            }],
            types: [{
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
            }]

        };
        $scope.teams = ['Front', 'Back', 'Android', 'iPhone', 'iPad', 'Orderstat', 'UM', 'Technical Chart', 'MI6', 'Gen5', 'Ereport', 'JSP', 'Piwik', 'Sense', 'Noti', 'Seos', ' Seosd', 'DataClient', 'SetSmart', 'Click2win'];

        // Algorithm to Calculating Color Contrast
        var getContrastYIQ = function(hexcolor) {
            var r = parseInt(hexcolor.substr(1, 2), 16);
            var g = parseInt(hexcolor.substr(3, 2), 16);
            var b = parseInt(hexcolor.substr(5, 2), 16);
            var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            //console.log('yiq: '+yiq);
            return (yiq >= 128) ? 'black' : 'white';
        };
        
        $scope.currentPalette = 'palette1';
        $scope.sampleColorsPicker = {
            palette1: ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00',
                '#ace600', '#73e600', '#39e600', '#00cc00', '#009926',
                '#66ffb3', '#00ffbf', '#00ffff', '#1ac6ff', '#1a8cff',
                '#3366ff', '#3333ff', '#6633ff', '#9933ff', '#cc33ff',
                '#ff00ff', '#ff00bf', '#ff0080', '#ff3399', '#ff66b3',
                '#ff99cc', '#ffcce6'
            ],
            palette2: ['#ff9999', '#ffb399', '#ffcc99', '#ffe699', '#ffff99',
                '#e6ff99', '#ccff99', '#b3ff99', '#99ff99', '#99ffb3',
                '#99ffcc', '#99ffe6', '#99ffff', '#99e6ff', '#99ccff',
                '#99b3ff', '#9999ff', '#b399ff', '#cc99ff', '#e699ff',
                '#ff99ff', '#ff99e6', '#ff99cc', '#ff99b3'

            ],
            palette3: ['#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080',
                '#999999', '#b3b3b3', '#cccccc', '#e6e6e6'

            ],
            setTaskColor: function(color) {
                $scope.asideTask.model.color = color;

                if (getContrastYIQ(color) === 'white') {
                    $scope.asideTask.model.classes = 'white';
                } else {
                    $scope.asideTask.model.classes = 'black';
                }

            },
            setProjectColor: function(color) {
                $scope.asideProject.model.color = color;
                if (getContrastYIQ(color) === 'white') {
                    $scope.asideProject.model.classes = 'gantt-row-milestone white';
                } else {
                    $scope.asideProject.model.classes = 'gantt-row-milestone black';
                }
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
                //  console.log($event, $scope.asideTask.model.color, color);
                if ($scope.asideTask !== undefined) {
                    $scope.asideTask.model.color = color;
                    if (getContrastYIQ(color) === 'white') {
                        $scope.asideTask.model.classes = 'white';
                    } else {
                        $scope.asideTask.model.classes = 'black';
                    }
                } else if ($scope.asideProject !== undefined) {
                    $scope.asideProject.model.color = color;
                    if (getContrastYIQ(color) === 'white') {
                        $scope.asideProject.model.classes = 'white';
                    } else {
                        $scope.asideProject.model.classes = 'black';
                    }
                }


            }
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
            treeTableColumns: ['model.name'],
            columnsHeaders: {
                'model.name': 'Resource',
                'from': 'From',
                'to': 'To',
                'model.priorityLevel': 'Prioritys',
                'model.shortcut': ''
            },
            columnsClasses: {
                'model.name': 'gantt-column-name',
                'from': 'gantt-column-from',
                'to': 'gantt-column-to',
                'model.shortcut': 'gantt-column-shortcut'
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
            treeHeaderContent: '<i class="fa fa-group"></i> Resource',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-group"></i> {{getHeader()}}',
                'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'to': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'model.id': '<div style="text-align:center;width:30px;"><i class="fa fa-bolt"></i></div>{{getHeader()}}'
            },
            autoExpand: 'both',
            taskOutOfRange: 'truncate',
            fromDate: moment().add(-1, 'week'),
            toDate: moment().add(5, 'week'),
            rowContentEnabled: true,
            taskContentEnabled: true,
            rowContent: '', //custom
            taskContent: '<i class=\"fa fa-' + '{{task.model.priorityLevel===\'critical\'? \'exclamation-triangle\':task.model.priorityLevel===\'high\'? \'exclamation\':\'\'}}' + '\"></i> {{task.model.name}} {{(task.model.project!==undefined && task.model.project!==\'Unassigned project\')?\'| \'+task.model.project:\'\'}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'line',
            currentDateValue: new Date(),
            draw: true,
            readOnly: false,
            groupDisplayMode: 'disabled',
            view: 'resource',
            filterTask: '',
            filterSupervisor: '',
            filterRow: '',
            timeFrames: {
                'day': {
                    start: moment('0:00', 'HH:mm'),
                    end: moment('23:59', 'HH:mm'),
                    color: '#999999',
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
            columnMagnet: '1 day',
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
                    name: '', // Name shown on top of each task.
                    project: 'Unassigned project', //default project name of the task
                    color: '#49d049', // Color of the task in HEX format (Optional).
                    supervisor: [],
                    marketing: [],
                    manday: '',
                    isDrawing: true
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

                    api.data.on.change($scope, function() {
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
                            url: 'scripts/jsp/dataLoader.jsp',
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
                            console.log('[LOG] Data successfully changed order');
                            saveAlert = $alert({
                                title: rowModel.name,
                                content: ' successfully change order!',
                                type: 'success',

                            });
                            saveAlert.$promise.then(function() {
                                saveAlert.show();
                            });
                            $scope.reload();

                        }, function myError(response) {
                            console.log('[LOG] Failed to save the data');

                        });


                    });
                    api.tasks.on.rowChange($scope, function(task, oldRow) {
                        checkAutoSave(task.model.id);
                        // delete this task in old row
                        $scope.taskSave(task, 'deleteOriginal');
                        // save task in new row
                        $scope.taskSave(task, 'autosave');
                        // $scope.reload();
                    });
                    api.tasks.on.add($scope, function(task) {
                        // auto fill project name
                        if ($scope.options.view === 'project' || $scope.options.view === 'summary' && task.row.model.currentProject !== undefined) {
                            task.model.project = task.row.model.currentProject;
                        }

                    });
                    api.tasks.on.add($scope, function(task) {
                        var taskModel = task.model;
                        var rowModel = task.row.model;
                        //auto pop asideTask when drawing

                        if (taskModel.isDrawing === undefined || !taskModel.isDrawing) {
                            return;
                        }

                        checkAutoSave(taskModel.id);
                        $scope.taskTempModel = angular.copy(taskModel);
                        taskModel.isDrawing = false;
                        $scope.resourceTempModel = angular.copy(rowModel);
                        $scope.asideTask = task;
                        taskAside.$promise.then(function() {
                            taskAside.show();
                        });
                        isAsideOpened = true;


                    });
                    api.rows.on.add($scope, function(row) {
                        if (row.model.isNew === undefined || !row.model.isNew) {
                            return;
                        }
                        console.log('autosave new added');
                        //row.model.isNew = undefined;
                        checkAutoSave();
                        if (row.model.height === undefined) {
                            $scope.resourceTempModel = angular.copy(row.model);
                        } else if (row.model.height !== undefined) {
                            $scope.projectTempModel = angular.copy(row.model);
                        }

                        if ($scope.options.view === 'resource' && !row.model.isChildRow) {
                            $scope.asideResource = row; //TODO:CHANGE NAME TO asideResource
                            $scope.resourceSave(row, 'autosave');
                            resourceAside.$promise.then(function() {
                                resourceAside.show();
                            });
                            isAsideOpened = true;

                        } else if ($scope.options.view === 'resource' && row.model.isChildRow) {
                            $scope.resourceSave(row, 'autosave');
                        } else {
                            $scope.asideProject = row;
                            $scope.projectSave(row, 'autosave');
                            projectAside.$promise.then(function() {
                                projectAside.show();
                            });
                            isAsideOpened = true;
                        }

                    });
                    // api.dependencies.on.add($scope, function(dependency) {
                    //     console.log('dependencies change');
                    //     $scope.taskSave(dependency.task, 'autosave');
                    // });
                    // api.dependencies.on.remove($scope, function(dependency) {
                    //     console.log('remove dependencies');
                    //     $scope.taskSave(dependency.task, 'autosave');
                    // });

                    // When gantt is ready, load data.
                    // `data` attribute could have been used too.
                    if (isFirstLoad) {
                        $scope.load();
                        isFirstLoad = false;
                    }

                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        //set colorpicker option
                        if (directiveName === 'ganttTask') {

                            element.bind('mousedown touchstart', function() {
                                event.stopPropagation();
                                //auto save if user click other tasks
                                checkAutoSave(directiveScope.task.model.id);
                                $scope.taskTempModel = angular.copy(directiveScope.task.model);
                            });

                            element.bind('click', function(event) {
                                event.stopPropagation();
                                $document.scrollToElementAnimated(element, $window.innerHeight / 3);
                                logTaskEvent('task-click', directiveScope.task);
                                $scope.asideTask = directiveScope.task;

                                taskAside.$promise.then(function() {
                                    taskAside.show();
                                });
                                isAsideOpened = true;
                            });



                        } else if (directiveName === 'ganttRowLabel') {
                            // Disallow user to click row-label
                            element.unbind();
                            element.bind('mousedown touchstart', function() {
                                event.stopPropagation();

                                //auto save if user click other rows
                                checkAutoSave(directiveScope.row.model.id);

                                if (directiveScope.row.model.height === undefined && $scope.options.view === 'resource') {
                                    $scope.resourceTempModel = angular.copy(directiveScope.row.model);
                                } else if (directiveScope.row.model.height !== undefined && directiveScope.row.model.editable) {
                                    $scope.projectTempModel = angular.copy(directiveScope.row.model);
                                } else {
                                    console.log('[LOG] Height attribute is missing !');
                                    $scope.resourceTempModel = undefined;
                                    $scope.projectTempModel = undefined;
                                }

                            });


                            element.bind('click', function() {
                                event.stopPropagation();
                                $document.scrollToElementAnimated(element, $window.innerHeight / 3);
                                logRowEvent('row-label-click', directiveScope.row);

                                if (directiveScope.row.model.height === undefined && $scope.options.view === 'resource') {
                                    $scope.asideResource = directiveScope.row;
                                    resourceAside.$promise.then(function() {
                                        resourceAside.show();
                                    });

                                    isAsideOpened = true;

                                } else if (directiveScope.row.model.height !== undefined && directiveScope.row.model.editable) {
                                    $scope.asideProject = directiveScope.row;
                                    projectAside.$promise.then(function() {
                                        projectAside.show();
                                    });
                                    isAsideOpened = true;
                                }

                            });



                        }

                    });

                    objectModel = new ObjectModel(api);
                });

            }
        };


        var getLastOrder = function(type) {
            if ($scope.data.length === 0) {
                return 0;
            }
            console.log('lastOrder: ' + $scope.data[$scope.data.length - 1].order);
            var maxx = -99999;
            for (var i = $scope.data.length - 1; i >= 0; i--) {
                if (type === 'resource' && $scope.data[i].order !== undefined && $scope.data[i].order > maxx) {
                    maxx = $scope.data[i].order;
                } else if (type === 'project' && $scope.data[i].order !== undefined && $scope.data[i].order > maxx && $scope.data[i].order < 999999 && $scope.data[i].height !== undefined) {
                    maxx = $scope.data[i].order;
                }
            }
            return maxx;

        };

        var clearAllAside = function() {
            resourceAside.hide();
            projectAside.hide();
            taskAside.hide();
            reloadAlert.hide();

        };

        var tmpFocusObjId;
        var checkAutoSave = function(focusObjId) {
            console.log('check : ' + isAsideOpened);
            //ignore self-click
            if (focusObjId === tmpFocusObjId) {
                return;
            } else {
                tmpFocusObjId = focusObjId;
            }

            if (!isAsideOpened) {
                return;
            } else if (isAsideOpened && $scope.asideResource !== undefined && $scope.asideResource.model.height === undefined) {
                $scope.resourceSave($scope.asideResource, 'autosave');
                clearAllAside();
                $scope.asideResource = undefined;
                $scope.resourceTempModel = undefined;
                isAsideOpened = false;

            } else if (isAsideOpened && $scope.asideResource !== undefined && $scope.asideResource.model.height !== undefined) {
                $scope.projectSave($scope.asideProject, 'autosave');
                clearAllAside();
                $scope.asideProject = undefined;
                $scope.projectTempModel = undefined;
                isAsideOpened = false;

            } else if (isAsideOpened && $scope.asideTask !== undefined) {
                $scope.taskSave($scope.asideTask, 'autosave');
                clearAllAside();
                $scope.asideTask = undefined;
                $scope.taskTempModel = undefined;
                isAsideOpened = false;

            }
        };




        $scope.addResource = function() {

            //add a new resource to the view
            if ($scope.options.view === 'resource') {
                var name = 'New Resource ' + (getLastOrder('resource') + 1);
                $scope.data.push({
                    id: utils.randomUuid(),
                    order: getLastOrder('resource') + 1, //append to the bottom of resources list
                    name: name,
                    filterName: name,
                    content: '<i class=\"{{row.model.isChildRow?\'fa fa-code-fork\':\'fa fa-user\'}}\"></i> {{row.model.name}}',
                    columnKeys: ['model.shortcut'],
                    columnContents: {
                        'model.shortcut': '<div row-shortcut row=\"row\" on-add=\"scope.addSubResource(row)\" on-delete=\"scope.resourceDelete(row);\"></div>'
                    },
                    tel: '',
                    email: '',
                    parent: '',
                    team: '',
                    isNew: true,
                    isChildRow: false
                });
            }


        };
        $scope.addSubResource = function(row) {
            event.stopPropagation();
            var rowModel = row.model;
            if ($scope.options.view === 'resource') {
                $scope.data.push({
                    id: utils.randomUuid(),
                    order: getLastOrder('resource') + 1, //append to the bottom of resources list
                    name: ' ',
                    filterName: rowModel.name,
                    content: ' <i style=\"margin-left:10px;\" class=\"{{row.model.isChildRow?\'fa fa-code-fork\':\'fa fa-user\'}}\"></i> {{row.model.name}}',
                    columnKeys: ['model.shortcut'],
                    columnContents: {
                        'model.shortcut': '<div row-shortcut row=\"row\" on-add=\"scope.addSubResource(row)\" on-delete=\"scope.resourceDelete(row)\"></div>'
                    },
                    tel: undefined,
                    email: undefined,
                    team: rowModel.team,
                    parent: rowModel.id,
                    isNew: true,
                    isChildRow: true
                });
            }

        };

        $scope.addProject = function() {

            if ($scope.options.view !== 'project') {
                $scope.data.push({
                    id: utils.randomUuid(),
                    name: 'New Project',
                    order: getLastOrder('project') + 1,
                    height: '3em',
                    content: '<i class=\"fa fa-' + '{{row.model.priorityLevel===\'critical\'? \'exclamation-triangle\':row.model.priorityLevel===\'high\'? \'exclamation\':\'\'}}' + '\"></i> {{row.model.name}}',
                    classes: 'gantt-row-milestone',
                    color: '#45607D',
                    budget: '',
                    manager: '',
                    data: '',
                    isNew: true,
                    isChildRow: false,
                    editable: true
                });
            }
        };

        //BUG FIXED MONGODB NOT SUPPORT KEY WITH SPECIALIAL CHARACTERS LIKE DOT(.) OR $
        var encodeKey = function(str) {
            return str.replace('\\', '\\\\').replace('\$', '\\u0024').replace('.', '\\u002e');
        };
        var decodeKey = function(str) {
            return str.replace('\\u002e', '.').replace('\\u0024', '\$').replace('\\\\', '\\');
        };

        var renameKey = function(obj, oldName, newName) {
            if (!obj.hasOwnProperty(oldName)) {
                return false;
            }

            obj[newName] = obj[oldName];
            delete obj[oldName];
            return true;
        };
        $scope.resourceSave = function(row, type) {
            var rowModel = row.model;
            //bug fix null resource name
            if (rowModel.name === '') {
                console.log('[LOG] Resource name is required');
                $scope.cancel('resource');
                return;
            }

            //bug fix parent who has children not show when filter
            //NOTE: use filtername to filter resources instead
            if (!rowModel.isChildRow) {
                rowModel.filterName = rowModel.name;
            }

            //bug fix update filterName and team
            if ($scope.options.view === 'resource') {
                for (var i = 0; i < $scope.data.length; i++) {
                    if ($scope.data[i].parent === rowModel.id) {
                        $scope.data[i].team = rowModel.team;
                        $scope.data[i].filterName = rowModel.filterName;
                    }
                }
            }

            //bug fix make temp data to prevent scope data link in view
            var tempRowModel = angular.copy(rowModel);

            if ($scope.options.view === 'project' || $scope.options.view === 'summary') {
                if (rowModel.oldId !== undefined) {
                    tempRowModel.id = rowModel.oldId;
                }
                if (rowModel.oldParent !== undefined) {
                    tempRowModel.parent = rowModel.oldParent;
                }
            } else {
                tempRowModel.id = rowModel.id;
            }


            //bug fix mongoDB not support dot(.) or ($) in map key
            for (var i = 0; i < tempRowModel.columnKeys.length; i++) {
                renameKey(tempRowModel.columnContents, tempRowModel.columnKeys[i], encodeKey(tempRowModel.columnKeys[i]));
                tempRowModel.columnKeys[i] = encodeKey(tempRowModel.columnKeys[i]);
            }


            console.log('SEND : ' + JSON.stringify(tempRowModel));
            $http({
                method: 'POST',
                url: 'scripts/jsp/dataLoader.jsp',
                params: {
                    mode: 'resourceSave',
                    row: JSON.stringify(tempRowModel)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('[LOG] row successfully saved');

                if (type === 'autosave') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully autosaved!',
                        type: 'success'
                    });

                } else if (type === 'save') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully saved!',
                        type: 'success'
                    });
                }

                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
                row.model.isNew = false;

            }, function myError(response) {
                console.log('[LOG] fail to save the row');
                $scope.cancel('resource');
                console.log(response);
            });
            isAsideOpened = false;

        };

        $scope.projectSave = function(row, type) {

            var rowModel = row.model;
            var rowModelId;

            rowModel.filterName = rowModel.name;
            var tempRowModel = angular.copy(rowModel);
            if ($scope.options.view === 'project' || $scope.options.view === 'summary' && rowModel.oldId !== undefined) {
                tempRowModel.id = rowModel.oldId;
            }

            tempRowModel.oldId = undefined;
            tempRowModel.oldParent = undefined;

            console.log('send: ' + JSON.stringify(tempRowModel));

            $http({
                method: 'POST',
                url: 'scripts/jsp/dataLoader.jsp',
                params: {
                    mode: 'projectSave',
                    row: JSON.stringify(tempRowModel)
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                console.log('[LOG] project successfully saved');
                if (response.data.trim() === 'DUPLICATED') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: 'Project name already exists!',
                        type: 'danger',

                    });
                    saveAlert.$promise.then(function() {
                        saveAlert.show();
                    });
                    return;
                }

                if (type === 'autosave') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully autosaved!',
                        type: 'success',

                    });

                } else if (type === 'save') {
                    saveAlert = $alert({
                        title: tempRowModel.name,
                        content: ' successfully saved!',
                        type: 'success'
                    });

                }
                $scope.getProjectsName();
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
                reloadAlert = $alert({
                    scope: $scope,
                    title: tempRowModel.name,
                    content: 'Click reload button to update view ',
                    type: 'danger',
                    duration: '5',
                    placement: 'top-left',
                    templateUrl: 'template/reload.alert.tpl.html'
                });
                reloadAlert.$promise.then(function() {
                    reloadAlert.show();
                });
                //when saved its not new anymore
                row.model.isNew = false;

            }, function myError(response) {
                console.log('[LOG] Failed to save the project');
                $scope.cancel('project');

            });
            isAsideOpened = false;

        };

        $scope.taskSave = function(task, type) {
            var taskModel = task.model;
            var rowModel;
            if (type === 'deleteOriginal') {
                rowModel = task.originalRow.model;
            } else {
                rowModel = task.row.model;
            }

            var tasks = [];
            var rowModelId;

            if ($scope.options.view === 'project' || $scope.options.view === 'summary') {
                for (var i = 0; i < $scope.data.length; i++) {
                    if ($scope.data[i].oldId === rowModel.oldId && $scope.data[i].tasks !== undefined) {
                        for (var j = 0; j < $scope.data[i].tasks.length; j++) {
                            tasks.push($scope.data[i].tasks[j]);
                        }
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
                url: 'scripts/jsp/dataLoader.jsp',
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
                    if (type === 'save') {
                        saveAlert = $alert({
                            title: taskModel.name,
                            content: ' successfully saved!',
                            type: 'success',
                        });
                    } else if (type === 'autosave') {
                        saveAlert = $alert({
                            title: taskModel.name,
                            content: ' successfully autosaved!',
                            type: 'success',

                        });

                    } else if (type === 'delete') {
                        saveAlert = $alert({
                            title: taskModel.name,
                            content: ' successfully deleted!',
                            type: 'success',

                        });
                    }
                    saveAlert.$promise.then(function() {
                        saveAlert.show();
                    });

                },
                function myError(response) {
                    console.log('[LOG] Failed to save the tasks');
                    $scope.cancel('resource');

                });
            isAsideOpened = false;
        };

        $scope.resourceDelete = function(row) {
            event.stopPropagation();

            var rowModel = row.model;
            $http({
                method: 'POST',
                url: 'scripts/jsp/dataLoader.jsp',
                params: {
                    mode: 'resourceDelete',
                    id: rowModel.id
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {
                //delete children
                if (!rowModel.isChildRow) {
                    for (var i = $scope.data.length - 1; i >= 0; i--) {
                        if ($scope.data[i].parent !== undefined && $scope.data[i].parent === rowModel.id) {
                            dataToRemove = [{
                                'id': $scope.data[i].id
                            }];
                            $scope.remove();
                        }
                    }
                }
                //delete parent
                dataToRemove = [{
                    'id': rowModel.id
                }];
                $scope.remove();
                saveAlert = $alert({
                    title: rowModel.name,
                    content: ' successfully deleted!',
                    type: 'success',

                });
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
                clearAllAside();
            }, function myError(response) {
                $scope.cancel('resource');
                saveAlert = $alert({
                    title: rowModel.name,
                    content: 'Failed to deleted, please try again',
                    type: 'danger',

                });
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
                clearAllAside();
            });

            isAsideOpened = false;

        };
        $scope.projectDelete = function(row) {
            var rowModel = row.model;

            //delete row online
            $http({
                method: 'POST',
                url: 'scripts/jsp/dataLoader.jsp',
                params: {
                    mode: 'projectDelete',
                    id: rowModel.oldId
                },
                headers: {
                    'Content-Type': 'application/json'
                }

            }).then(function mySuccess(response) {

                //IMPORTANT: DO NOT DELETE CHILDREN IN DATABASE JUST DELETE IN VIEW
                if (!rowModel.isChildRow) {
                    for (var i = $scope.data.length - 1; i >= 0; i--) {
                        if ($scope.data[i].parent !== undefined && $scope.data[i].parent === rowModel.id) {
                            dataToRemove = [{
                                'id': $scope.data[i].id
                            }];
                            $scope.remove();
                        }
                    }
                }
                dataToRemove = [{
                    'id': rowModel.id
                }];
                $scope.remove();
                saveAlert = $alert({
                    title: rowModel.name,
                    content: ' successfully deleted!',
                    type: 'success',
                });
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
            }, function myError(response) {
                $scope.cancel('resource');
                saveAlert = $alert({
                    title: rowModel.name,
                    content: 'Failed to deleted, please try again',
                    type: 'danger',
                });
                saveAlert.$promise.then(function() {
                    saveAlert.show();
                });
            });

            isAsideOpened = false;

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
        // override parameter


        // Remove data action
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
            // $scope.api.dependencies.refresh();
        };

        $scope.cancel = function(type) {

            if (type === 'task') {

                //bug fix when click cancel after drawing new task
                if ($scope.taskTempModel.isDrawing === undefined) {
                    angular.copy($scope.taskTempModel, $scope.asideTask.model);
                } else if ($scope.taskTempModel.isDrawing) {

                    dataToRemove = [{
                        'id': $scope.resourceTempModel.id,
                        'tasks': [{
                            'id': $scope.taskTempModel.id
                        }]
                    }];
                    $scope.remove();

                }
            } else if (type === 'resource') {
                if ($scope.resourceTempModel.isNew) {
                    dataToRemove = [{
                        'id': $scope.resourceTempModel.id
                    }];
                    $scope.remove();
                } else {
                    angular.copy($scope.resourceTempModel, $scope.asideResource.model);
                }
            } else if (type === 'project' && $scope.projectTempModel.editable) {
                if ($scope.projectTempModel.isNew) {
                    dataToRemove = [{
                        'id': $scope.projectTempModel.id
                    }];
                    $scope.remove();
                } else {
                    angular.copy($scope.projectTempModel, $scope.asideProject.model);
                }
            }
            clearAllAside();
            isAsideOpened = false;

        };

        $scope.load = function() {

            //reset old data when change view

            clearAllAside();
            isAsideOpened = false;
            $scope.data = [];
            $scope.taskTemp = {};
            $scope.rowTemp = {};
            $scope.projectTemp = {};

            //begin load
            if ($scope.options.view === 'resource') {
                $http({
                    method: 'POST',
                    url: 'scripts/jsp/dataLoader.jsp',
                    params: {
                        mode: 'load'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function mySuccess(response) {
                    console.log('[LOG] Successfully loaded resourcces!');

                    for (var i = 0; i < response.data.length; i++) {
                        for (var j = 0; j < response.data[i].columnKeys.length; j++) {
                            renameKey(response.data[i].columnContents, response.data[i].columnKeys[j], decodeKey(response.data[i].columnKeys[j]));
                            response.data[i].columnKeys[j] = decodeKey(response.data[i].columnKeys[j]);
                        }

                    }
                    $scope.data = response.data;
                    $scope.getProjectsName();
                }, function myError(response) {
                    console.log('fail');

                });

            } else {
                $http({
                    method: 'POST',
                    url: 'scripts/jsp/dataLoader.jsp',
                    params: {
                        mode: 'projectLoad'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function mySuccess(response) {

                    for (var i = 0; i < response.data.length; i++) {
                        if (response.data[i].height === undefined && !response.data[i].end) {
                            console.log(response.data[i].name);
                            for (var j = 0; j < response.data[i].columnKeys.length; j++) {
                                renameKey(response.data[i].columnContents, response.data[i].columnKeys[j], decodeKey(response.data[i].columnKeys[j]));
                                response.data[i].columnKeys[j] = decodeKey(response.data[i].columnKeys[j]);
                            }
                        } else {
                            continue;
                        }

                    }

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
            //  $scope.timespans = Sample.getSampleTimespans();
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
                } else {
                    arr[i].parent = map[arr[i].parent];
                }

            }
            return arr;
        };

        $scope.getProjectsName = function() {
            $scope.projectsName = [];
            $http({
                method: 'POST',
                url: 'scripts/jsp/dataLoader.jsp',
                params: {
                    mode: 'getProjectsName'
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function mySuccess(response) {
                console.log('[LOG] Loaded project name completed!');
                for (var i = 0; i < response.data.length; i++) {
                    $scope.projectsName.push({
                        label: response.data[i].name,
                        value: response.data[i].name
                    });
                }

            }, function myError(response) {
                console.log('[LOG] Failed to load project name');

            });

        };

        $scope.reload = function() {
            $scope.load();
        };

        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
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
        $scope.isValidDate = function(from, to) {
            //  console.log(moment(from) < moment(to));
            return moment(from) <= moment(to);
        };


        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        var tmpFrom;
        var tmpTo;
        var taskTmp = {
            model: {},
            row: {
                model: {}
            }
        };
        $scope.timeleft = function(to) {
            return moment(to).fromNow();
        };
        $scope.trackClass = function(to) {
            return moment(to).diff(moment(), 'days') < 15 ? 'danger' : moment(to).diff(moment(), 'days') < 30 ? 'warning' : '';
        };
        $scope.untrack = function(task, row) {
            task.isTrack = false;
            taskTmp.model = task;
            taskTmp.row.model = row;
            $scope.taskSave(taskTmp, 'autosave');

        };
        $scope.$watch('options.view', function(newView, oldView) {

            console.log('oldView: ' + oldView + ' newView: ' + newView);
            if (oldView === 'summary') {
                $scope.options.fromDate = tmpFrom;
                $scope.options.toDate = tmpTo;
            } else {
                tmpFrom = $scope.options.fromDate;
                tmpTo = $scope.options.toDate;
            }
            if (newView === 'project') {
                $scope.options.treeHeaderContent = '<i class="fa fa-sitemap"></i> Project';
                $scope.options.treeTableColumns = ['model.shortcut', 'model.priorityLevel', 'from', 'to'];
                $scope.options.scale = 'day';
                $scope.options.currentDate = 'column';
                $scope.options.readOnly = false;
                $scope.selected = 'project';
            } else if (newView === 'resource') {
                $scope.options.treeHeaderContent = '<i class="fa fa-group"></i> Resource';
                $scope.options.treeTableColumns = ['model.shortcut'];
                $scope.options.scale = 'day';
                $scope.options.currentDate = 'column';
                $scope.options.readOnly = false;
                $scope.selected = 'resource';
            } else if (newView === 'summary') {
                $scope.options.treeHeaderContent = '<i class="fa fa-sitemap"></i> Project';
                $scope.options.treeTableColumns = ['model.shortcut', 'model.priorityLevel', 'from', 'to'];
                $scope.options.fromDate = moment('2016-01-01');
                $scope.options.toDate = moment('2016-12-31');
                $scope.options.scale = 'month';
                $scope.options.currentDate = 'line';
                $scope.options.readOnly = false;
                $scope.selected = 'summary';
                $scope.trackedTasks = [];
                // loadTrackedTask();

            }

            //when start or change view
            if (!isFirstLoad) {
                $scope.load();
            }

        });









    }]);
