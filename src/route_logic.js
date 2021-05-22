/** Описание объекта, определяющего обработчики событий 
* выбора элементов модели маршрута (перегонов, остановочных пунктов) */
class Route_logic {
    /**
     * @param {Chart} chart - объект диаграммы
     * @param {{route_number: string, route_variant: number}} route_data 
     * - данные о маршруте
     */
    constructor(chart, route_data) {
        this.chart = chart;
        this.route_data = route_data;

        Views.show_or_hide_stop_diagram(false);
        Views.show_or_hide_haul_diagram(false);
    }

    /**
     * Обработка события выбора перегона 
     * @param {{
     *      start_stop_id: number,
     *      end_stop_id: number,
     *      start_stop_name: string,
     *      end_stop_name: string
     *  }} stops_data - данные об остановочных пунктах перегона
     */
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

    /**
     * Обработка события выбора остановочного пункта
     * @param {{stop_id: number, stop_name: string}} stops_data 
     * - данные об остановочном пункте 
     */
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