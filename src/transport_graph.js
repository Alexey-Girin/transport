class Transport_graph {
    constructor(stops_data, geometry_data, map, handler) {
        this.map = map;
        this.is_displayed = false;

        this.stops = this._init_stops(stops_data);
        this.geometry = this._init_geometry(geometry_data);

        this.selected = {
            selected_element: null,
            selected_type: null,
            update_selected: function(new_selected_element, new_selected_type, that) {
                function changeBoundMarkColor(haul, is_selected) {
                    var color = is_selected ? config.selected_color : config.not_selected_color;

                    var start_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.start_stop_id);
                    var end_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.end_stop_id);

                    if (is_selected) {
                        start_stop.setStyle({'color': color})
                            .bindTooltip(that._create_tooltip(
                                start_stop.options.stop_name,
                                start_stop.options.stop_id))
                            .openTooltip();
                        end_stop.setStyle({'color': color})
                            .bindTooltip(that._create_tooltip(
                                end_stop.options.stop_name,
                                end_stop.options.stop_id))
                            .openTooltip();
                    } else {
                        start_stop.setStyle({'color': color}).unbindTooltip();
                        end_stop.setStyle({'color': color}).unbindTooltip();
                    }
                }

                if (this.selected_element != null) {
                    this.selected_element.setStyle({'color': config.not_selected_color});
                }

                if (this.selected_type == 'haul') {
                    changeBoundMarkColor(this.selected_element, false);
                } else if (this.selected_type == 'stop') {
                    this.selected_element.unbindTooltip();
                }

                if (new_selected_element == null) {
                    return;
                }

                new_selected_element.setStyle({'color': config.selected_color});
                
                if (new_selected_type == 'haul') {
                    changeBoundMarkColor(new_selected_element, true);
                } else if (new_selected_type == 'stop') {
                    new_selected_element
                        .bindTooltip(that._create_tooltip(
                            new_selected_element.options.stop_name,
                            new_selected_element.options.stop_id))
                        .openTooltip();
                }

                this.selected_element = new_selected_element;
                this.selected_type = new_selected_type;
            }
        }

        this._set_behavior();
        
        this.handler = handler.set_handlers(
            this._on_haul_changed_external.bind(this),
            this._on_stop_changed_external.bind(this)
        );
    }

    _init_stops(stops_data) {
        var stops = L.featureGroup();
        var mapZoom = this.map.getZoom();

        stops_data.forEach(element => {
            var stop = L.circleMarker([
                element['LT'], element['LN']
            ], {
                radius: config.get_stop_radius(mapZoom),
                color: config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                stop_id: element['ID'],
                stop_name: element['NM']
            });

            stops.addLayer(stop);
        });

        return stops;
    }

    _init_geometry(geometry_data) {
        var geometry = L.featureGroup();
        var mapZoom = this.map.getZoom();

        geometry_data.forEach(element => {
            var haul = L.polyline(element.geom, {
                id: element.id,
                weight: config.get_haul_weight(mapZoom),
                color: config.not_selected_color,
                start_stop_id: element.poi_start,
                end_stop_id: element.poi_finish
            });

            geometry.addLayer(haul);
        });

        return geometry;
    }

    _set_behavior() {
        this.geometry.getLayers().forEach(haul => haul.on('click', 
            async (e) => this._on_haul_click(e), this));
        this.stops.getLayers().forEach(stop => stop.on('click', 
            async (e) => this._on_stop_click(e), this));

        this.map.on('zoomend', () => {
            if (!this.is_displayed) {
                return;
            }

            var mapZoom = this.map.getZoom();

            if (mapZoom >= config.min_map_zoom_for_stops) {
                this.map.getPane('tooltip').style.display = '';
                this.stops.addTo(this.map);
            } else {
                this.map.getPane('tooltip').style.display = 'none';
                this.stops.removeFrom(this.map);
            }

            this.geometry.getLayers().forEach(stop => stop.setStyle({
                'weight': config.get_haul_weight(mapZoom)
            }, this));
            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.get_stop_radius(mapZoom)
            }));
        });
    }

    async _update_haul(haul) {
        this.geometry.removeLayer(haul);
        this.geometry.addLayer(haul);

        var start_stop = this.stops.getLayers().find(e => e.options.stop_id == haul.options.start_stop_id);
        this.stops.removeLayer(start_stop);
        this.stops.addLayer(start_stop);

        var end_stop = this.stops.getLayers().find(e => e.options.stop_id == haul.options.end_stop_id);
        this.stops.removeLayer(end_stop);
        this.stops.addLayer(end_stop);

        this.selected.update_selected(haul, 'haul', this);

        await this.handler.on_haul_selected({
            start_stop_id: start_stop.options.stop_id,
            end_stop_id: end_stop.options.stop_id,
            start_stop_name: start_stop.options.stop_name,
            end_stop_name: end_stop.options.stop_name
        });
    }

    _on_haul_click(event) {
        var haul = event.target;
        this._update_haul(haul);
    }

    _on_haul_changed_external(start_stop_id, end_stop_id) {
        var haul = this.geometry.getLayers()
            .find(e => e.options.start_stop_id == start_stop_id 
                && e.options.end_stop_id == end_stop_id);
        
        if (haul == undefined) {
            return;
        }

        var start_stop = this.stops.getLayers().find(e => e.options.stop_id == start_stop_id);
        this.map.setView(
            start_stop.getLatLng(), 
            config.route.onRouteFocusZoom, { 
                animation: true 
            }); 
        this._update_haul(haul);
    }

    async _update_stop(stop) {
        this.stops.removeLayer(stop);
        this.stops.addLayer(stop);

        this.selected.update_selected(stop, 'stop', this);

        await this.handler.on_stop_selected({
            stop_id: stop.options.stop_id,
            stop_name: stop.options.stop_name
        });
    }

    _on_stop_click(event) {
        var stop = event.target;
        this._update_stop(stop);
    }

    _on_stop_changed_external(stop_id) {
        var stop = this.stops.getLayers()
            .find(e => e.options.stop_id == stop_id);

        if (stop == undefined) {
            return;
        }

        this.map.setView(
            stop.getLatLng(), 
            config.route.onRouteFocusZoom, { 
                animation: true 
            }); 
        this._update_stop(stop);
    }

    _create_tooltip(stop_name, stop_id) {
        return L.tooltip({
            pane: 'tooltip',
            permanent: true,
            className: 'text',
            direction: 'right',
            offset: L.point(10, 0)
        }).setContent(`${stop_name} (${stop_id})`);
    }

    show() {
        var mapZoom = this.map.getZoom();

        this.geometry.addTo(this.map);
        this.geometry.getLayers().forEach(haul => haul.setStyle({
            'weight': config.get_haul_weight(mapZoom)
        }));

        if (this.map.getZoom() >= config.min_map_zoom_for_stops) {
            this.stops.addTo(this.map);
            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.get_stop_radius(mapZoom)
            }));
        }

        this.is_displayed = true;

        this.handler.set_handlers(
            this._on_haul_changed_external.bind(this),
            this._on_stop_changed_external.bind(this)
        );
    }

    hide() {
        this.is_displayed = false;
        this.selected.update_selected(null, null, this);
        
        this.geometry.removeFrom(this.map);
        this.stops.removeFrom(this.map);

        this.handler.hide();
    }
}