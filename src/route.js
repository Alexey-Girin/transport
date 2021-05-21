// Объект, представляющий маршрут на карте
class Route {
    constructor(route_data, chart, geometry_data, stops_data, map) {
        this.map = map;        
        this.geometry = this.#init_geometry(geometry_data);
        this.stops = this.#init_stops(stops_data);

        this.route_logic = new Route_logic(chart, route_data);
        this.route_view = new Route_view(
            stops_data, 
            this.forced_set_haul.bind(this),
            this.forced_set_stop.bind(this));

        // Объект выбранного элемента
        this.selected = {
            selected_element: null,
            selected_type: null,
            update_selected: function(new_selected_element, new_selected_type, that) {
                function changeBoundMarkColor(haul, is_selected) {
                    var color = is_selected ? config.selected_color : config.not_selected_color;

                    var start_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.poi_start);
                    var end_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.poi_finish);
                
                    start_stop.setStyle({'color': color}).toggleTooltip();
                    that.route_view.stop_selected_change_view(haul.options.poi_start, is_selected);
                    end_stop.setStyle({'color': color}).toggleTooltip();
                    that.route_view.stop_selected_change_view(haul.options.poi_finish, is_selected);
                }

                if (this.selected_element != null) {
                    this.selected_element.setStyle({'color': config.not_selected_color});
                }

                if (this.selected_type == 'haul') {
                    changeBoundMarkColor(this.selected_element, false);
                    that.route_view.haul_selected_change_view(this.selected_element.options.poi_start, false);
                } else if (this.selected_type == 'stop') {
                    this.selected_element.closeTooltip();
                    that.route_view.stop_selected_change_view(this.selected_element.options.stop_id, false);
                }

                new_selected_element.setStyle({'color': config.selected_color});
                
                if (new_selected_type == 'haul') {
                    changeBoundMarkColor(new_selected_element, true);
                }

                if (new_selected_type == 'haul') {
                    that.route_view.haul_selected_change_view(new_selected_element.options.poi_start, true);
                } else if (new_selected_type == 'stop') {
                    that.route_view.stop_selected_change_view(new_selected_element.options.stop_id, true);
                }

                this.selected_element = new_selected_element;
                this.selected_type = new_selected_type;
            }
        }
        
        this.#set_behavior();
        this.map.setView([
                stops_data[0]['LATITUDE'], stops_data[0]['LONGITUDE']
            ], config.route.onRouteFocusZoom, { animation: true }); 
        
        this.geometry.addTo(this.map);
        this.stops.addTo(this.map);

        this.stops.getLayers().forEach(stop => stop.closeTooltip());
    }

    #init_geometry(geometry_data) {
        var geometry = L.featureGroup();
        
        geometry_data.forEach(element => {
            var haul = L.polyline(element['STAGE_SHAPE'], {
                weight: config.get_haul_weight(config.route.onRouteFocusZoom),
                color: config.not_selected_color,
                poi_start: element['POI_START'],
                poi_finish: element['POI_FINISH']
            });

            geometry.addLayer(haul);
        });

        return geometry;
    }

    #init_stops(stops_data) {
        var stops = L.featureGroup();
        var order = 0;
        
        stops_data.forEach(element => {
            order++;

            var stop = L.circleMarker([
                element['LATITUDE'], element['LONGITUDE']
            ], {
                radius: config.get_stop_radius(config.route.onRouteFocusZoom),
                color: config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                stop_id: element['ID_STOP'],
                stop_name: element['STOP_NAME']
            });

            stop.bindTooltip(L.tooltip({
                pane: 'tooltip',
                permanent: true,
                className: 'text',
                direction: 'right',
                offset: L.point(10, 0)
            }).setContent(`${order}: ${element['STOP_NAME']} (${element['ID_STOP']})`));

            stops.addLayer(stop);
        });

        return stops;
    }

    async #on_haul_click(event) {
        var haul = event.target;
        this.selected.update_selected(haul, 'haul', this);

        var start_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.poi_start);
        var end_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.poi_finish);

        await this.route_logic.haul_selected_handler({
            start_stop_id: start_stop.options.stop_id,
            end_stop_id: end_stop.options.stop_id,
            start_stop_name: start_stop.options.stop_name,
            end_stop_name: end_stop.options.stop_name
        });
    }

    async #on_stop_click(event) {
        var stop = event.target;
        this.selected.update_selected(stop, 'stop', this);
        stop.openTooltip();
        await this.route_logic.stop_selected_handler({
            stop_id: stop.options.stop_id,
            stop_name: stop.options.stop_name
        });
    }

    async forced_set_haul(poi_start) {
        var haul = this.geometry.getLayers()
            .find(e => e.options.poi_start == poi_start);
        this.selected.update_selected(haul, 'haul', this);
        
        var start_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.poi_start);
        var end_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.poi_finish);

        await this.route_logic.haul_selected_handler({
            start_stop_id: start_stop.options.stop_id,
            end_stop_id: end_stop.options.stop_id,
            start_stop_name: start_stop.options.stop_name,
            end_stop_name: end_stop.options.stop_name
        });
    }

    async forced_set_stop(stop_id) {
        var stop = this.stops.getLayers()
            .find(e => e.options.stop_id == stop_id);
        this.selected.update_selected(stop, 'stop', this);
        stop.openTooltip();
        await this.route_logic.stop_selected_handler({
            stop_id: stop.options.stop_id,
            stop_name: stop.options.stop_name
        });
    }

    #set_behavior() {
        this.geometry.getLayers().forEach(haul => haul.on('click', 
            async (e) => this.#on_haul_click(e), this));
        this.stops.getLayers().forEach(stop => stop.on('click', 
            async (e) => this.#on_stop_click(e), this));

        this.map.on('zoomend', () => {
            var mapZoom = this.map.getZoom();

            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.get_stop_radius(mapZoom)
            }));

            this.geometry.getLayers().forEach(stop => stop.setStyle({
                'weight': config.get_haul_weight(mapZoom)
            }, this));

            if (mapZoom >= config.min_map_zoom_for_stops) {
                this.map.getPane('tooltip').style.display = '';
            } else {
                this.map.getPane('tooltip').style.display = 'none';
            }
        });
    }

    hide() {
        this.geometry.clearLayers();
        this.stops.clearLayers();
        this.route_view.clear();
    }
}