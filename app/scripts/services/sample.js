'use strict';

/**
 * @ngdoc service
 * @name angularGanttDemoApp.Sample
 * @description
 * # Sample
 * Service in the angularGanttDemoApp.
 */
angular.module('angularGanttDemoApp')
    .service('Sample', function Sample() {
        return {
            getResourceSampleData: function() {
                return [
                    // Order is optional. If not specified it will be assigned automatically

                    {
                        name: 'Vachirakorn',
                        tel: '0882391875',
                        email: 'vachirakorn@hotmail.com',
                        children: ['overlap1'],
                        tasks: [{
                            name: 'learn angular-gantt',
                            project: 'Internship',
                            color: '#ff99cc',
                            from: new Date(2016, 4, 30, 8, 0, 0),
                            to: new Date(2016, 5, 2, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'BR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '6',
                            progress: 100
                        }, {
                            name: 'analysis requirements',
                            project: 'Internship',
                            color: '#ff99cc',
                            from: new Date(2016, 5, 3, 8, 0, 0),
                            to: new Date(2016, 5, 5, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'BR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '6',
                            progress: 100
                        }, {
                            name: 'discuss design prototype',
                            project: 'Internship',
                            color: '#ff99cc',
                            from: new Date(2016, 5, 6, 8, 0, 0),
                            to: new Date(2016, 5, 7, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'BR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '6',
                            progress: 100
                        }, {
                            name: 'Design new UI',
                            project: 'Internship',
                            color: '#1abc9c',
                            from: new Date(2016, 5, 8, 8, 0, 0),
                            to: new Date(2016, 5, 14, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'IR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '5',
                            progress: 100
                        }, {
                            name: 'Coding DB connection',
                            project: 'Internship',
                            color: '#ffcc00',
                            from: new Date(2016, 5, 15, 8, 0, 0),
                            to: new Date(2016, 5, 23, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'IR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '7'
                        }],
                        utilization: 70

                    }, {
                        name: 'Sompong',
                        tasks: [{
                            name: 'QA',
                            project: 'Internship',
                            color: '#cc33ff',
                            from: new Date(2016, 5, 19, 8, 0, 0),
                            to: new Date(2016, 5, 27, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'IR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '21.8'

                        }],
                        utilization: 30
                    }, {
                        name: 'Somchai',
                        tasks: [{
                            name: 'Support',
                            project: 'E-GOLD',
                            color: '#dd44cc',
                            from: new Date(2016, 4, 30, 8, 0, 0),
                            to: new Date(2016, 5, 7, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'SR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '15.7'
                        }],
                        utilization: 30
                    }, {
                        name: 'Somsri',
                        tasks: [{
                            name: 'Android UI',
                            project: 'settrade',
                            color: '#f32d3a',
                            from: new Date(2016, 4, 28, 8, 0, 0),
                            to: new Date(2016, 5, 20, 18, 30, 0),
                            priorityLevel: 'high',
                            type: 'IR',
                            supervisor: 'Chadchai,Mansari',
                            marketing: 'Namtip',
                            manday: '11.6'

                        }],
                        utilization: 30
                    }
                ];
            },
            getSampleTimespans: function() {
                return [{
                    from: new Date(2016, 4, 30, 8, 0, 0),
                    to: new Date(2016, 5, 7, 15, 0, 0),
                    name: 'Learning phase'
                        //priorityLevel: undefined,
                        //classes: [],
                        //data: undefined
                }];
            },
            getProjectSampleData: function() {
                return [{
                    name: 'Internship',
                    height: '3em',
                    // sortable: false,
                    // drawTask: false,
                    classes: 'gantt-row-milestone',
                    color: '#45607D',
                    data: 'Can contain any custom data or object'
                }, {
                    name: 'Vachirakorn',
                    tel: '0882391875',
                    email: 'vachirakorn@hotmail.com',
                    parent: ['Internship'],
                    tasks: [{
                        name: 'learn angular-gantt',
                        project: 'Internship',
                        color: '#ff99cc',
                        from: new Date(2016, 4, 30, 8, 0, 0),
                        to: new Date(2016, 5, 2, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'BR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '6',
                        progress: 100
                    }, {
                        name: 'analysis requirements',
                        project: 'Internship',
                        color: '#ff99cc',
                        from: new Date(2016, 5, 3, 8, 0, 0),
                        to: new Date(2016, 5, 5, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'BR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '6',
                        progress: 100
                    }, {
                        name: 'discuss design prototype',
                        project: 'Internship',
                        color: '#ff99cc',
                        from: new Date(2016, 5, 6, 8, 0, 0),
                        to: new Date(2016, 5, 7, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'BR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '6',
                        progress: 100
                    }, {
                        name: 'Design new UI',
                        project: 'Internship',
                        color: '#1abc9c',
                        from: new Date(2016, 5, 8, 8, 0, 0),
                        to: new Date(2016, 5, 14, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'IR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '5',
                        progress: 100
                    }, {
                        name: 'Coding DB connection',
                        project: 'Internship',
                        color: '#ffcc00',
                        from: new Date(2016, 5, 15, 8, 0, 0),
                        to: new Date(2016, 5, 23, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'IR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '7'
                    }],
                    utilization: 70

                }, {
                    name: 'Sompong',
                    parent: ['Internship'],
                    tasks: [{
                        name: 'QA',
                        project: 'Internship',
                        color: '#cc33ff',
                        from: new Date(2016, 5, 19, 8, 0, 0),
                        to: new Date(2016, 5, 27, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'IR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '21.8'

                    }],
                    utilization: 30
                },{
                    name: 'Internship2',
                    height: '3em',
                    tasks: [{
                        name: 'QA',
                        project: 'Internship2',
                        color: '#cc33ff',
                        from: new Date(2016, 5, 19, 8, 0, 0),
                        to: new Date(2016, 5, 27, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'IR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '21.8'

                    }],
                    // sortable: false,
                    // drawTask: false,
                    classes: 'gantt-row-milestone',
                    color: '#45607D',
                    data: 'Can contain any custom data or object'
                },{
                    name: 'Somsom',
                    parent:['Internship2'],
                    tasks: [{
                        name: 'QA',
                        project: 'Internship2',
                        color: '#cc33ff',
                        from: new Date(2016, 5, 19, 8, 0, 0),
                        to: new Date(2016, 5, 27, 18, 30, 0),
                        priorityLevel: 'high',
                        type: 'IR',
                        supervisor: 'Chadchai,Mansari',
                        marketing: 'Namtip',
                        manday: '21.8'

                    }],
                    utilization: 30
                }];

            }

        };
    });
