class Route_logic {
    constructor(chart, route_data) {
        this.chart = chart;
        this.route_data = route_data;

        Views.show_or_hide_stop_diagram(false);
        Views.show_or_hide_haul_diagram(false);
    }

    async haul_selected_handler(stops_data) {
        Views.show_or_hide_stop_diagram(false);
        Views.show_or_hide_haul_diagram(true);
        Views.set_segment_report(stops_data.start_stop_id, stops_data.end_stop_id);

        var route_data = this.route_data;

        this.chart.set_options({
            element_type: 'haul',
            route_data: route_data,
            stops_data: stops_data
        });
        await this.chart.display();
    }

    async stop_selected_handler(stops_data) {
        Views.show_or_hide_haul_diagram(false);
        Views.show_or_hide_stop_diagram(true);
        Views.set_stop_report(stops_data.stop_id);

        var route_data = this.route_data;

        this.chart.set_options({
            element_type: 'stop',
            route_data: route_data,
            stops_data: stops_data
        });

        await this.chart.display();
    }
}