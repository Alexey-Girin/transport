/** Загрузка данных со стороны сервера */
var loading_data = function() {
    /** Загрузка геометрий перегонов для одного маршрута */
    async function load_route_geometry(route_data) {
        Views.open_loader();

        var loaded_data = null;
        var route_geometry = [];

        try {
            loaded_data = (await get_route_geometry(route_data.route_variant, route_data.direction)).rows;
        } catch(e) {
            console.log('error to load route geometry', e);
            Views.hide_loader();
            return null;
        }

        for (var i = 0; i < loaded_data.length; i++) {
            route_geometry.push({
                POI_START: loaded_data[i]['POI_START'],
                POI_FINISH: loaded_data[i]['POI_FINISH'],
                STAGE_SHAPE: JSON.parse(loaded_data[i]['STAGE_SHAPE'])
            });
        }

        for (var i = 0; i < loaded_data.length; i++) {
            route_geometry[i]['STAGE_SHAPE'][0] = JSON.parse(loaded_data[i]['START_STOP_COORD']);
            route_geometry[i]['STAGE_SHAPE'][route_geometry[i]['STAGE_SHAPE'].length - 1] = JSON.parse(loaded_data[i]['END_STOP_COORD']);
        }

        Views.hide_loader();

        return route_geometry;
    }

    // public: загрузка остановок для маршрута
    async function load_route_stops(route_data) {
        var route_stops = null;

        try {
            route_stops = (await get_route_stops(route_data.route_number, route_data.route_variant, route_data.direction)).rows;
        } catch(e) {
            console.log('error to load route stops', e);
        }

        return route_stops;
    }

    // public: загрузка скорости для маршрутов
    async function load_route_speed(route_data, stops_data, daytype, period) {
        var speed = null;

        if (period == 0) {
            try {
                speed = (await get_route_speed_period(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route speed');
            }
        } else if (period == 1) {
            try {
                speed = (await get_route_speed_hour(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route speed');
            }
        } else if (period == 15) {
            try {
                speed = (await get_route_speed_15(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route speed');
            }
        } 
        
        if (speed == undefined) {
            return null;
        }

        return speed;
    }

    // public: загрузка времени для маршрутов
    async function load_route_time(route_data, stops_data, daytype, period) {
        var time = null;

        if (period == 0) {
            try {
                time = (await get_route_time_period(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route time');
            }
        } else if (period == 1) {
            try {
                time = (await get_route_time_hour(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route time');
            }
        } else if (period == 15) {
            try {
                time = (await get_route_time_15(route_data, stops_data, daytype)).rows;
            } catch(e) {
                console.log('error to load route time');
            }
        } 

        if (time == undefined) {
            return null;
        }
        
        return time;
    }

    /**
     * Загрузка геометрий перегонов для одного вида транспорта
     * @param {number} tr_type - вид транспорта
     * @returns 
     */
    async function load_graph_geometry(tr_type) {
        var full_data = null;
        Views.open_loader();

        try {
            full_data = (await get_graph_geometry(tr_type)).rows;
        } catch(e) {
            console.log('Ошибка загрузки (геометрии перегонов): ', tr_type);
            Views.hide_loader();
            return null;
        }

        if (full_data.length == 0) {
            console.log('Ошибка загрузки (геометрии перегонов): ', tr_type);
            Views.hide_loader();
            return null;
        }
        
        for (var i = 0; i < full_data.length; i++) {
            var start_stop_coord = JSON.parse(full_data[i]['start_stop_coord']);
            var end_stop_coord = JSON.parse(full_data[i]['end_stop_coord']);

            full_data[i].geom = JSON.parse(full_data[i]['geom']);
            full_data[i].geom[0] = start_stop_coord;
            full_data[i].geom[full_data[i].geom.length - 1] = end_stop_coord;
        }

        Views.hide_loader();
        return full_data;
    }

    // Загрузка маршрутов для перегона
    async function load_graph_transport_by_stops_pair(stops_data) {
        var routes = null;

        try {
            routes = (await get_graph_transport_by_stops_pair(stops_data)).rows;
        } catch(e) {
            console.log('Ошибка загрузки (маршруты для перегона): ', stops_data);
            return null;
        }

        return routes;
    }

    // Загрузка маршрутов для остановки
    async function load_graph_transport_by_stop(id_stop) {
        var routes = null;

        try {
            routes = (await get_graph_transport_by_stop(id_stop)).rows;
        } catch(e) {
            console.log('Ошибка загрузки (маршруты для остановки): ', id_stop);
            return null;
        }

        return routes;
    }

    // 
    async function load_stop_name_by_id(stop_id) {
        var stop_name = null;

        try {
            stop_name = (await get_stop_data_by_id(stop_id))['STOP_NAME'];
        } catch(e) {
            console.log('error to load stop name by id');
        }

        return stop_name;
    }

    // Загрузка данных остановки по id 
    async function load_stop_data_by_id(stop_id) {
        var stop_data = null;

        try {
            stop_data = (await get_stop_data_by_id(stop_id));
        } catch(e) {
            console.log('Ошибка загрузки (данные остановки по id): ', stop_id);
            return null;
        }

        return stop_data;
    }

    async function  load_segment_routes(segment_data) {
        var routes_data = null;

        try {
            routes_data = (await get_segment_routes(segment_data)).rows;
        } catch(e) {
            console.log('error to load segment routes by stops pair');
        }

        for (var i = 0; i < routes_data.length; i++) {
            routes_data[i]['STAGE_SHAPE'] = JSON.parse(routes_data[i]['STAGE_SHAPE']);
        }

        return routes_data;
    }

    // Загрузка остановок графа
    async function load_all_stops_by_tr_type(tr_type) {
        var full_data = null;

        Views.open_loader();

        if (tr_type == 7) {
            try {
                full_data = (await get_stops_metro()).rows;
            } catch(e) {
                console.log('Ошибка загрузки (остановки графа): ', tr_type);
                return null;
            }

            Views.hide_loader();
            return full_data;
        }

        try {
            full_data = (await get_all_stops_by_tr_type(tr_type)).rows;
        } catch(e) {
            console.log('Ошибка загрузки (остановки графа): ', tr_type);
            return null;
        }

        if (full_data.length == null) {
            console.log('Ошибка загрузки (остановки графа): ', tr_type);
            return null;
        }

        Views.hide_loader();

        return full_data;
    }
    
    // public: загрузка пассажиропотока 
    async function load_salon_pass_averaged(route_data, stops_data, daytype) {
        var pass = null;

        try {
            pass = (await get_salon_pass_averaged(route_data, stops_data, daytype)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_salon_pass_averaged_trip(route_data, stops_data, daytype) {
        var pass = null;

        try {
            pass = (await get_salon_pass_averaged_trip(route_data, stops_data, daytype)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_salon_pass_date(route_data, stops_data, date) {
        var pass = null;
        var parsed_date = date.split('.');
        date = [parsed_date[1], parsed_date[0], parsed_date[2]].join('/');

        try {
            pass = (await get_salon_pass_date(route_data, stops_data, date)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_salon_pass_date_trip(route_data, stops_data, date) {
        var pass = null;
        var parsed_date = date.split('.');
        date = [parsed_date[1], parsed_date[0], parsed_date[2]].join('/');

        try {
            pass = (await get_salon_pass_date_trip(route_data, stops_data, date)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_route_pass_averaged(route_data, id_stop, entrance_type, daytype) {
        var pass = null;

        try {
            pass = (await get_route_pass_averaged(route_data, id_stop, entrance_type, daytype)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_route_pass_date(route_data, id_stop, entrance_type, date) {
        var pass = null;
        var parsed_date = date.split('.');
        date = [parsed_date[1], parsed_date[0], parsed_date[2]].join('/');

        try {
            pass = (await get_route_pass_date(route_data, id_stop, entrance_type, date)).rows;
        } catch(e) {
            console.log('error to load pass');
        }

        if (pass == undefined) {
            return null;
        }
        
        return pass;
    }

    async function load_data_for_haul(route_data, stops_data) {
        var diagram_setting = Views.get_haul_diagram_setting();

        var data = null;
        var additional_info = null;

        if (diagram_setting.averaging == 0) {
            if (diagram_setting.characteristic == 0) {
                data = await load_route_speed(route_data, 
                    stops_data, 
                    diagram_setting.daytype, 
                    diagram_setting.time_period
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Скорость'
                };
            } else if (diagram_setting.characteristic == 1) {
                data = await load_route_time(route_data, 
                    stops_data, 
                    diagram_setting.daytype, 
                    diagram_setting.time_period
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Время'
                };
            } else if (diagram_setting.characteristic == 2) {
                data = await load_salon_pass_averaged(route_data, 
                    stops_data, 
                    diagram_setting.daytype
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Наполнение салона'
                };
            } else if (diagram_setting.characteristic == 3) {
                data = await load_salon_pass_averaged_trip(route_data, 
                    stops_data, 
                    diagram_setting.daytype
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Наполнение салона (с учетом рейсов)'
                }
            }
        } else if (diagram_setting.averaging == 1) {
            if (diagram_setting.characteristic == 2) {
                data = await load_salon_pass_date(route_data, 
                    stops_data, 
                    diagram_setting.date
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Наполнение салона'
                };
            } else if (diagram_setting.characteristic == 3) {
                data = await load_salon_pass_date_trip(route_data, 
                    stops_data, 
                    diagram_setting.date
                );
                additional_info = {
                    chart_type: 'chart_haul',
                    chart_title: 'Наполнение салона (с учетом рейсов)'
                }
            }
        }

        if (data == null) {
            alert('Нет данных');
        }

        return {
            data: data,
            additional_info: additional_info
        }
    }  

    async function load_data_for_stop(route_data, stop_id) {
        var diagram_setting = Views.get_stop_diagram_setting();

        var data = null;
        var additional_info = null;

        if (diagram_setting.averaging == 0) {
            if (diagram_setting.characteristic == 0) {
                data = await load_route_pass_averaged(route_data, 
                    stop_id, 
                    diagram_setting.enter_exit,
                    diagram_setting.daytype
                );
                additional_info = {
                    chart_type: 'chart_stop',
                    chart_title: 'Пассажирооборот (по маршруту)'
                };
            }
        } else if (diagram_setting.averaging == 1) {
            if (diagram_setting.characteristic == 0) {
                data = await load_route_pass_date(route_data, 
                    stop_id, 
                    diagram_setting.enter_exit, 
                    diagram_setting.date
                );
                additional_info = {
                    chart_type: 'chart_stop',
                    chart_title: 'Пассажирооборот (по маршруту)'
                };
            }
        }

        if (data == null) {
            alert('Нет данных');
        }

        return {
            data: data,
            additional_info: additional_info
        }
    }    

    async function load_data_for_heatmap(route_number,
        route_variant,
        stops_data,
        setting) {
        var data = null;

        if (setting.averaging == 0) {
            if (setting.characteristic == 0) {
                data = await load_route_speed({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.daytype, 1);
            } else if (setting.characteristic == 1) {
                data = await load_route_time({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.daytype, 1);
            } else if (setting.characteristic == 2) {
                data = await load_salon_pass_averaged({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.daytype);
            } else if (setting.characteristic == 3) {
                data = await load_salon_pass_averaged_trip({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.daytype);
            }
        } else {
            if (setting.characteristic == 2) {
                data = await load_salon_pass_date({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.date);
            } else if (setting.characteristic == 3) {
                data = await load_salon_pass_date_trip({
                    route_number: route_number,
                    route_variant: route_variant
                }, stops_data, setting.date);
            }
        }

        if (data == null) {
            data = [];
            for (var i = 5; i % 24 != 0; i++) {
                data.push({value: 0});
            }
        }

        return data;
    }

    async function load_destination(stop_id, date) {
        Views.open_loader();

        var stops = null;
        var parsed_date = date.split('.');
        date = [parsed_date[1], parsed_date[0], parsed_date[2]].join('/');

        try {
            stops = (await get_destination(stop_id, date)).rows;
        } catch(e) {
            console.log('error to load stops');
            Views.hide_loader();
        }

        Views.hide_loader();
        if (stops == undefined) {
            return null;
        }
        
        return stops;
    }
        
    return {
        load_route_geometry: load_route_geometry,
        load_route_stops: load_route_stops,
        load_route_speed: load_route_speed,
        load_route_time: load_route_time,
        load_graph_geometry: load_graph_geometry,
        load_graph_transport_by_stops_pair: load_graph_transport_by_stops_pair,
        load_stop_name_by_id: load_stop_name_by_id,
        load_stop_data_by_id: load_stop_data_by_id,
        load_segment_routes: load_segment_routes,
        load_all_stops_by_tr_type: load_all_stops_by_tr_type,
        load_graph_transport_by_stop: load_graph_transport_by_stop,

        load_data_for_haul: load_data_for_haul,
        load_data_for_stop: load_data_for_stop,
        load_data_for_heatmap: load_data_for_heatmap,

        load_destination: load_destination
    }
}();