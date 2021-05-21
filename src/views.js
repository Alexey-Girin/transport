class Views {
    static init_set(handler) {
        var btn_route_confirm = document.getElementById('P2_VARIANT_CONFIRM');
        btn_route_confirm.addEventListener('click', async function() {
            var route_data = {
                tr_num: $v('P2_VARIANT_SELECT_TRANSPORT'),
                route_number: $v('P2_VARIANT_SELECT_ROUTE'),
                route_variant: $v('P2_VARIANT_SELECT_VARIANT'),
                direction: $v('P2_VARIANT_SELECT_DIRECTION')
            }

            if (route_data.route_number == 0 || route_data.route_variant == 0) {
                return;
            }

            await handler.on_route_selected_handler(route_data);
        });

        var btn_clear_all = document.getElementById('P2_CLEAR_ALL_HIDEN');
        btn_clear_all.addEventListener('click', async function() {
            await handler.on_clear_all_click();
        });

        var btn_graph_confirm = document.getElementById('P2_GRAPH_CONFIRM');
        btn_graph_confirm.addEventListener('click', async function() {
            var tr_type = $v('P2_GRAPH_SELECT_TRANSPORT');
            await handler.on_graph_selected_handler(tr_type);
        });

        var btn_haul_update_chart = document.getElementById('P2_HAUL_DIAG_UPDATE');
        btn_haul_update_chart.addEventListener('click', async function() {
            await handler.on_update_chart();
        });

        var btn_stop_update_chart = document.getElementById('P2_STOP_DIAG_UPDATE');
        btn_stop_update_chart.addEventListener('click', async function() {
            await handler.on_update_chart();
        });

        var btn_stop_com_update_chart = document.getElementById('P2_STOP_COM_DIAG_UPDATE');
        btn_stop_com_update_chart.addEventListener('click', async function() {
            await Chart_com.update();
        });
    }

    static search_click_handler_set(handler_haul, handler_stop) {
        var btn_search = document.getElementById('P2_SEARCH');
        btn_search.addEventListener('click', async function() {
            if ($v('P2_SELECT_SEARCH_ELEMENT') == 0) {
                var poi_start = $v('P2_SEARCH_START_STOP');
                var poi_finish = $v('P2_SEARCH_END_STOP');
                await handler_haul(poi_start, poi_finish);
            } else {
                var stop_id = $v('P2_SEARCH_STOP_ID');
                await handler_stop(stop_id);
            } 
        });
    }

    static search_click_handler_unset() {
        var btn_search = document.getElementById('P2_SEARCH');
        var cln = btn_search.cloneNode(true);
        btn_search.parentNode.replaceChild(cln, btn_search);
    }

    static heatmap_update_set(handler) {
        var btn_update = document.getElementById('P2_HEATMAP_UPDATE');
        btn_update.addEventListener('click', handler);
    } 

    static heatmap_update_unset() {
        var btn_update = document.getElementById('P2_HEATMAP_UPDATE');
        var cln = btn_update.cloneNode(true);
        btn_update.parentNode.replaceChild(cln, btn_update);
    } 

    static clear_heatmap() {
        var block = document.getElementById("heatmap_haul");
        while (block.firstChild) {
            block.removeChild(block.firstChild);
        }
    }

    static get_diagram_setting() {
        var diagram_setting = {
            period: $v('P2_SELECT_TIME_PERIOD'),
            daytype: $v('P2_SELECT_DAYTYPE'),
            type: $v('P2_SELECT_TYPE')
        }

        return diagram_setting;
    }

    static open_loader() {
        var loader = document.getElementById('loader');
        loader.style.visibility = 'visible';
    }

    static hide_loader() {
        var loader = document.getElementById('loader');
        loader.style.visibility = 'hidden';
    }

    static get_transport_type() {
        return $v('P2_GRAPH_SELECT_TRANSPORT');
    }

    static get_visualisation_type() {
        return $v('P2_SELECT_VISUALIZATION');
    }

    static set_segment_report(poi_start, poi_finish) {
        apex.item("P2_SEGMENT_REPORT_START_STOP_ID").setValue(poi_start);
        apex.item("P2_SEGMENT_REPORT_END_STOP_ID").setValue(poi_finish);
        $("#P2_UPDATE_SEGMENT_REPORT").click();
        $("#P2_HEATMAP_UPDATE").click();
    }

    static set_stop_report(stop_id) {
        apex.item("P2_STOP_REPORT_STOP_ID").setValue(stop_id);
        $("#P2_UPDATE_STOP_REPORT").click();
    }

    static set_stop_com_report(stop_id) {
        apex.item("P2_STOP_COM_STOP_ID").setValue(stop_id);
        $("#P2_STOP_COM_DIAG_UPDATE").click();
        $("#P2_UPDATE_STOP_COM_REPORT").click();
    }

    static get_haul_diagram_setting() {
        var diagram_setting = {
            averaging: $v('P2_GRAPH_HAUL_AVERAGING'),
            characteristic: $v('P2_GRAPH_HAUL_CHARACTERISTIC'),
            time_period: $v('P2_GRAPH_HAUL_TIME_PERIOD'),
            daytype: $v('P2_GRAPH_HAUL_DAYTYPE'),
            date: $v('P2_GRAPH_HAUL_DATE')
        }

        return diagram_setting;
    }

    static get_stop_diagram_setting() {
        var diagram_setting = {
            averaging: $v('P2_GRAPH_STOP_AVERAGING'),
            characteristic: $v('P2_GRAPH_STOP_CHARACTERISTIC'),
            time_period: $v('P2_GRAPH_STOP_TIME_PERIOD'),
            daytype: $v('P2_GRAPH_STOP_DAYTYPE'),
            date: $v('P2_GRAPH_STOP_DATE'),
            enter_exit: $v('P2_GRAPH_STOP_ENTER_OR_EXIT')
        }

        return diagram_setting;
    }

    static show_or_hide_stop_diagram(is_display) {
        if (is_display) {
            $('#region_stop').show();
        } else {
            $('#region_stop').hide();
        }
    }

    static show_or_hide_haul_diagram(is_display) {
        if (is_display) {
            $('#region_haul').show();
        } else {
            $('#region_haul').hide();
        }
    }

    static chart_download_handler_set(handler, options, chart) {
        var btn_download_haul = document.getElementById('P2_HAUL_DIAG_DOWNLOAD');
        btn_download_haul.addEventListener('click', async function() {
            await handler(options, chart);
        });

        var btn_download_stop = document.getElementById('P2_STOP_DIAG_DOWNLOAD');
        btn_download_stop.addEventListener('click', async function() {
            await handler(options, chart);
        });
    }

    static chart_download_handler_unset() {
        var btn_download_haul = document.getElementById('P2_HAUL_DIAG_DOWNLOAD');
        var cln_btn_download_haul = btn_download_haul.cloneNode(true);
        btn_download_haul.parentNode.replaceChild(cln_btn_download_haul, 
            btn_download_haul);

        var btn_download_stop = document.getElementById('P2_STOP_DIAG_DOWNLOAD');
        var cln_btn_download_stop = btn_download_stop.cloneNode(true);
        btn_download_stop.parentNode.replaceChild(cln_btn_download_stop, 
            btn_download_stop);
    }
}