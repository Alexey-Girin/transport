class Matrix {
    constructor(map, all_stops_data_full) {
        this.stops = L.featureGroup();

        this.map = map;

        this.active_stops = null;
        this.active_stops_layer = L.featureGroup();
        this.values = null;

        var pane = map.createPane('connections');
        pane.style.zIndex = 300;
        this.connections = L.featureGroup();

        this.is_displayed = false;

        this._fill_data(all_stops_data_full.bus);
        this._fill_data(all_stops_data_full.tram);
        this._fill_data(all_stops_data_full.trol);
        this._fill_data(all_stops_data_full.metro);

        this._set_behavior();
    }

    _fill_data(all_stops_data) {
        var mapZoom = this.map.getZoom();

        all_stops_data.forEach(element => {
            var stop = L.circleMarker([
                element['LT'], element['LN']
            ], {
                radius: config.stop.get_stop_radius(mapZoom),
                color: matrix_config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                stop_id: element['ID'],
                stop_name: element['NM'],
                addition: 0,
                weight: 1,
                state: 'standart'
            });

            this.stops.addLayer(stop);
        });
    }

    async _create_bunch(stop) {
        this.stops.removeFrom(this.map);
        var date = Views.get_date();

        if (date == "") {
            alert('Дата не установлена');
            return;
        }

        this.active_stops = [stop];
        this.values = [];
        this.active_stops_layer.addLayer(stop);

        var destinations = await loading_data.load_destination(stop.options.stop_id, date);
        destinations.forEach(destination => {
            var end_stop_id = destination['end_stop_id'];
            var value = destination['value'];
            var stop_ = this.stops.getLayers().find(e => e.options.stop_id == end_stop_id);

            if (stop_ != undefined) {
                if (stop_ != stop) {
                    this.values.push({id: end_stop_id, value: value});
                }
            }
        });
        destinations.forEach(destination => {
            var end_stop_id = destination['end_stop_id'];
            var stop_ = this.stops.getLayers().find(e => e.options.stop_id == end_stop_id);

            if (stop_ != undefined) {

                if (stop_ != stop) {
                    this._set_stop_style(stop_, 'destination', 1);
                    this.active_stops.push(stop_);
                    this.active_stops_layer.addLayer(stop_);
                    this._on_destination_stop_click(stop_);
                }
            }
        });

        this.active_stops_layer.removeLayer(stop);
        this.active_stops_layer.addLayer(stop);
        Views.set_matrix_report(stop.options.stop_id);
    }

    async _clear_bunch() {
        if (this.active_stops == null) {
            return;
        }

        this.active_stops.forEach(stop => {
            this._set_stop_style(stop, 'standart', 0);
        });

        this.connections.clearLayers();
        this.active_stops_layer.clearLayers();
        this.active_stops = null;
        this.values = null;
        this.stops.addTo(this.map);
    } 

    async _update_active_stops() {
        for (var i = 1; i < this.active_stops.length; i++) {
            this.active_stops_layer.removeLayer(this.active_stops[i]);
            this.active_stops_layer.addLayer(this.active_stops[i]);
        }

        this.active_stops_layer.removeLayer(this.active_stops[0]);
        this.active_stops_layer.addLayer(this.active_stops[0]);
    }

    async _on_standart_stop_click(stop) {
        if (this.active_stops != null) {
            return;
        }

        this._set_stop_style(stop, 'origin', 2);
        await this._create_bunch(stop);
    }

    async _on_origin_stop_click() {
        await this._clear_bunch();
    }

    async _on_destination_stop_click(stop) {
        var max_value = Math.max.apply(Math, this.values.map(e => e.value));
        var addition = Math.trunc(this.values.find(e => e.id == stop.options.stop_id).value / max_value * 5.0);

        var mapZoom = this.map.getZoom();
        this._set_stop_style(stop, 'selected_destination', addition);

        var connection = L.polyline([this.active_stops[0].getLatLng(), stop.getLatLng()], {
            weight: config.haul.get_haul_weight(mapZoom),
            color: '#3E94D1',
            id: stop.options.stop_id,
            pane: 'connections'
        });
        this.connections.addLayer(connection);
        this._update_active_stops();
    }

    async _on_selected_destination_stop_click(stop) {
        this._set_stop_style(stop, 'destination', 1);
        var connection = this.connections.getLayers().find(e => e.options.id == stop.options.stop_id);
        this.connections.removeLayer(connection);
    }

    async _on_stop_click(event) {
        var stop = event.target;
        
        if (stop.options.state == 'standart') {
            await this._on_standart_stop_click(stop);
        } else if (stop.options.state == 'origin') {
            await this._on_origin_stop_click();
        } else if (stop.options.state == 'destination') {
            await this._on_destination_stop_click(stop);
        } else if (stop.options.state == 'selected_destination') {
            await this._on_selected_destination_stop_click(stop);
        }
    }

    async _search(stop_id) {

    }

    _set_stop_style(stop, type, addition) {
        var mapZoom = this.map.getZoom();

        if (stop == undefined) {
            return;
        }

        if (type == 'origin') {
            stop.setStyle({
                radius: config.stop.get_stop_radius(mapZoom + addition),
                color: '#FF3900',
                fillColor: '#FF3900',
                fillOpacity: 1,
                addition: addition,
                weight: 2,
                state: 'origin'
            });
        } else if (type == 'destination') {
            stop.setStyle({
                radius: config.stop.get_stop_radius(mapZoom + addition),
                color: '#0A64A4',
                fillColor: 'white',
                fillOpacity: 1,
                addition: addition,
                weight: 2,
                state: 'destination'
            });
        } else if (type == 'standart') {
            stop.setStyle({
                radius: config.stop.get_stop_radius(mapZoom),
                color: matrix_config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                addition: addition,
                weight: 1,
                state: 'standart'
            });
        } else if (type == 'selected_destination') {
            stop.setStyle({
                radius: config.stop.get_stop_radius(mapZoom + addition),
                color: '#0A64A4',
                fillColor: '#0A64A4',
                fillOpacity: 1,
                addition: addition,
                weight: 2,
                state: 'selected_destination'
            });
        }
    }

    _set_behavior() {
        this.stops.getLayers().forEach(stop => stop.on('click', 
            async (e) => await this._on_stop_click(e), this));

        this.stops.getLayers().forEach(stop => stop.on('mouseover', 
            () => {
                stop.bindTooltip(L.tooltip({
                    pane: 'tooltip',
                    permanent: true,
                    className: 'text',
                    direction: config.tooltip.direction,
                    offset: L.point(config.tooltip.offset_x, config.tooltip.offset_y)
                }).setContent(stop.options.stop_name));
            }));
        
        this.stops.getLayers().forEach(stop => stop.on('mouseout', 
            () => {
                stop.unbindTooltip();
            }));

        this.map.on('zoomend', () => {
            if (!this.is_displayed) {
                return;
            }

            var mapZoom = this.map.getZoom();

            if (mapZoom >= matrix_config.min_map_zoom_for_tooltip) {
                this.map.getPane('tooltip').style.display = '';
            } else {
                this.map.getPane('tooltip').style.display = 'none';
            }

            this.connections.getLayers().forEach(stop => stop.setStyle({
                'weight': config.haul.get_haul_weight(mapZoom)
            }, this));
            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.stop.get_stop_radius(mapZoom + stop.options.addition)
            }));
        });
    }

    show() {
        var mapZoom = this.map.getZoom();

        this.stops.addTo(this.map);
        this.connections.addTo(this.map);
        L.control.layers(null, {'соединения': this.connections}).addTo(this.map);
        this.active_stops_layer.addTo(this.map);

        this.stops.getLayers().forEach(stop => stop.setStyle({
            'radius': config.stop.get_stop_radius(mapZoom)
        }));

        this.is_displayed = true;
    }

    hide() {
        this.is_displayed = false;

        if (this.selected_stop != null) {
            this.selected_stop.setStyle({color: matrix_config.not_selected_color});
        }

        this.selected_stop = null
        this.stops.removeFrom(this.map);
    }
}