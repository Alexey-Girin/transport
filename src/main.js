window.onload = onload_set;

function onload_set() {
    google.charts.load('current', {'packages':['corechart', 'bar']})
        .then(async () => {
            await init();
        });
}

async function init() {
    var map = L.map('map', {
        renderer: L.canvas()
    });
    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);
    
    map.setView(config.map.center, config.map.zoom);
    map.createPane('tooltip');

    var current_displayable = null;
    var network = new Network();
    var chart = new Chart();

    async function clear_all() {
        if (current_displayable != null) {
            current_displayable.hide();
            current_displayable = null;
        }
    }

    async function on_clear_all_click() {
        await clear_all();
    }

    /**
     * Отображение одного маршрута на карте 
     * @param {{route_number: string, route_variant: number}} route_data 
     * - данные о маршруте
     */
    async function on_route_selected(route_data) {
        await clear_all();

        var geometry_data = await loading_data.load_route_geometry(route_data);
        var stops_data = await loading_data.load_route_stops(route_data);

        if (Views.get_visualisation_type() != 1
        || current_displayable != null) {
            return;
        }

        console.log("geom_data", geometry_data);
        console.log("stops_data", stops_data);

        if (geometry_data == null || stops_data == null) {
            alert('Для варианта маршрута нет данных');
            return;
        }

        var route = new Route(route_data, chart, geometry_data, stops_data, map);
        current_displayable = route;
    }

    /**
     * Отображение модели транспортной сети на карте для одного вида транспорта
     * @param {number} tr_type - вид транспорта
     */
    async function on_graph_selected(tr_type) {
        await clear_all();

        if (tr_type == -1) {
            return;
        }

        if (!network.is_set_graph(tr_type)) {
            var geometry_data = await loading_data.load_graph_geometry(tr_type);
            var stops_data = await loading_data.load_all_stops_by_tr_type(tr_type);

            if (geometry_data == null || stops_data == null) {
                alert('Ошибка. Не удалость загрузить данные');
                return;
            }

            if (Views.get_visualisation_type() != 2 
                || Views.get_transport_type() != tr_type
                || current_displayable != null) {
                return;
            }

            var graph_handler = new Graph_handler(chart);
            var new_graph = new Transport_graph(stops_data, geometry_data, map, graph_handler);
            network.set_graph(tr_type, new_graph);
        }

        var graph = network.get_graph(tr_type);
        graph.show();
        
        current_displayable = graph;
    }

    async function on_update_chart() {
        chart.display();
    }

    Views.init_set({
        on_route_selected_handler: on_route_selected,
        on_clear_all_click: on_clear_all_click,
        on_graph_selected_handler: on_graph_selected,
        on_update_chart: on_update_chart
    });
}