class Graph_handler {
    constructor(chart) {
        this.chart = chart;
        this.stops_data = null;

        this.current_selected = null;
    }

    set_handlers(forced_set_haul, forced_set_stop) {
        Views.search_click_handler_set(forced_set_haul, forced_set_stop);  
        return this;
    }

    #full_info_block(transport_data, click_handler) {
        this.clear();

        transport_data.forEach(element => {
            this.#set_element_info(element, click_handler);
        });    
    }

    #set_element_info(route_info, click_handler) {
        var tr_class = "tr_info_element_graph";
        var tr_data_class = "tr_info_element_data_graph";

        var tr_block = document.getElementById("tr_info_block");

        var info_div = document.createElement("div");
        info_div.className = tr_class;
        info_div.setAttribute("ROUTE_NUMBER", route_info['ROUTE_NUMBER']);
        info_div.setAttribute("ROUTE_VARIANT", route_info['ROUTE_VARIANT']);

        var tr_num = document.createElement("div");
        tr_num.className = tr_data_class;
        tr_num.innerText = `Маршрут: ${route_info['ROUTE_NUMBER']} (${route_info['ROUTE_ID_ASU']})`;
        info_div.append(tr_num);

        var tr_var = document.createElement("div");
        tr_var.className = tr_data_class;
        tr_var.innerText = `Вариант: ${route_info['ROUTE_VARIANT']}`;
        info_div.append(tr_var);

        tr_block.append(info_div);

        info_div.addEventListener('click', click_handler);

        return info_div;
    }

    clear() {
        var tr_block = document.getElementById("tr_info_block");
        while (tr_block.firstChild) {
            tr_block.removeChild(tr_block.firstChild);
        }

        this.current_selected = null;
    }

    async #on_info_haul_click(event) {
        if (this.current_selected != null) {
            this.current_selected.className = 'tr_info_element_graph';
        }

        this.current_selected = event.currentTarget;
        event.currentTarget.className = 'tr_info_element_selected_graph';

        var route_data = {
            route_number: event.currentTarget.getAttribute('ROUTE_NUMBER'),
            route_variant: event.currentTarget.getAttribute('ROUTE_VARIANT')
        };

        var stops_data = this.stops_data;

        this.chart.set_options({
            element_type: 'haul',
            route_data: route_data,
            stops_data: stops_data
        });
        await this.chart.display();
    }

    // Обработка события нажатия на инфоблок для остановки
    async #on_info_stop_click(event) {
        if (this.current_selected != null) {
            this.current_selected.className = 'tr_info_element_graph';
        }

        this.current_selected = event.currentTarget;
        event.currentTarget.className = 'tr_info_element_selected_graph';

        var route_data = {
            route_number: event.currentTarget.getAttribute('ROUTE_NUMBER'),
            route_variant: event.currentTarget.getAttribute('ROUTE_VARIANT')
        };

        var stops_data = this.stops_data;

        this.chart.set_options({
            element_type: 'stop',
            route_data: route_data,
            stops_data: stops_data
        });
        await this.chart.display();
    }

    // Обработка события нажатия на перегон
    async on_haul_selected(stops_data) {
        this.chart.remove();

        Views.show_or_hide_stop_diagram(false);
        Views.show_or_hide_haul_diagram(true);

        var stops_data_for_loading = {
            poi_start: stops_data.start_stop_id,
            poi_finish: stops_data.end_stop_id
        };

        var transport_data = await loading_data.load_graph_transport_by_stops_pair(stops_data_for_loading);

        if (transport_data == null) {
            return;
        }

        Views.heatmap_update_unset();
        Views.heatmap_update_set(async () => await Heatmap.build(transport_data, stops_data, 'haul'));

        Views.set_segment_report(stops_data.start_stop_id, stops_data.end_stop_id);
        this.stops_data = stops_data;
        this.#full_info_block(transport_data, this.#on_info_haul_click.bind(this));
    }

    // Обработка события нажатия на остановку
    async on_stop_selected(stops_data) {
        this.chart.remove();

        Views.show_or_hide_haul_diagram(false);
        Views.show_or_hide_stop_diagram(true);

        var transport_data = await loading_data.load_graph_transport_by_stop(stops_data.stop_id);

        if (transport_data == null) {
            return;
        }

        Views.set_stop_report(stops_data.stop_id);
        Views.set_stop_com_report(stops_data.stop_id)
        this.stops_data = stops_data;
        this.#full_info_block(transport_data, this.#on_info_stop_click.bind(this));
    }

    hide() {
        this.clear();
        this.chart.remove();

        Chart_com.clear();
        Views.search_click_handler_unset();
        Views.heatmap_update_unset();
        Views.clear_heatmap();
        Views.show_or_hide_stop_diagram(false);
        Views.show_or_hide_haul_diagram(false);
    }
}