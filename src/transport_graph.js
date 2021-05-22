/** Описание объекта, представляющего картографическую модель транспортной сети */
class Transport_graph {
    /**
     * @param {*} stops_data - исходные данные об остановочных пунктах
     * @param {*} geometry_data - исходные данные о геометриях перегонов
     * @param {*} map - объект карты
     * @param {Graph_handler} handler - объект, определяющий логику обработки событий 
     * выбора элементов модели транспортной сети
     */
    constructor(stops_data, geometry_data, map, handler) {
        this.map = map;
        
        /** true, если модель в настоящий момент отображается на карте */
        this.is_displayed = false;

        /** Описание остановочных пунктов */
        this.stops = this._init_stops(stops_data);

        /** Описание геометрий перегонов */ 
        this.geometry = this._init_geometry(geometry_data);

        /** Объект выбранного элемента */
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
            this._forced_set_haul.bind(this),
            this._forced_set_stop.bind(this)
        );
    }

    /** Создание описаний остановочных пунктов по исходным данным */
    _init_stops(stops_data) {
        var stops = L.featureGroup();
        var mapZoom = this.map.getZoom();

        stops_data.forEach(element => {
            var stop = L.circleMarker([
                element['LT'], element['LN']
            ], {
                radius: config.stop.get_stop_radius(mapZoom),
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

    /** Создание описаний геометрий перегонов по исходным данным */
    _init_geometry(geometry_data) {
        var geometry = L.featureGroup();
        var mapZoom = this.map.getZoom();

        geometry_data.forEach(element => {
            var haul = L.polyline(element.geom, {
                id: element.id,
                weight: config.haul.get_haul_weight(mapZoom),
                color: config.not_selected_color,
                start_stop_id: element.poi_start,
                end_stop_id: element.poi_finish
            });

            geometry.addLayer(haul);
        });

        return geometry;
    }

    /** Начальное задание обработчиков событий */
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
                'weight': config.haul.get_haul_weight(mapZoom)
            }, this));
            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.stop.get_stop_radius(mapZoom)
            }));
        });
    }

    /** Обновление состояния для выбранного перегона */
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

    /** Обработчик события нажатия на перегон */
    _on_haul_click(event) {
        var haul = event.target;
        this._update_haul(haul);
    }

    /**
     * Обработчик события стороннего выбора перегона
     * @param {number} start_stop_id - ID начального остановочного пункта перегона
     * @param {number} end_stop_id - ID конечного остановочного пункта перегона
     */
     _forced_set_haul(start_stop_id, end_stop_id) {
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

    /** Обновление состояния для выбранного остановочного пункта */
    async _update_stop(stop) {
        this.stops.removeLayer(stop);
        this.stops.addLayer(stop);

        this.selected.update_selected(stop, 'stop', this);

        await this.handler.on_stop_selected({
            stop_id: stop.options.stop_id,
            stop_name: stop.options.stop_name
        });
    }

    /** Обработчик события нажатия на остановочный пункт */
    _on_stop_click(event) {
        var stop = event.target;
        this._update_stop(stop);
    }

    /**
     * Обработчик события стороннего выбора остановочного пункта
     * @param {number} stop_id - ID остановочного пункта
     */
    _forced_set_stop(stop_id) {
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

    /** Создание объекта, задающего всплывающее пояснение для остановочного пункта */
    _create_tooltip(stop_name, stop_id) {
        return L.tooltip({
            pane: 'tooltip',
            permanent: true,
            className: 'text',
            direction: config.tooltip.direction,
            offset: L.point(config.tooltip.offset_x, config.tooltip.offset_y)
        }).setContent(`${stop_name} (${stop_id})`);
    }

    /** Отображение модели на карте */
    show() {
        var mapZoom = this.map.getZoom();

        this.geometry.addTo(this.map);
        this.geometry.getLayers().forEach(haul => haul.setStyle({
            'weight': config.haul.get_haul_weight(mapZoom)
        }));

        if (this.map.getZoom() >= config.min_map_zoom_for_stops) {
            this.stops.addTo(this.map);
            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.stop.get_stop_radius(mapZoom)
            }));
        }

        this.is_displayed = true;

        this.handler.set_handlers(
            this._forced_set_haul.bind(this),
            this._forced_set_stop.bind(this)
        );
    }

    /** Сокрытие модели с карты */
    hide() {
        this.is_displayed = false;
        this.selected.update_selected(null, null, this);
        
        this.geometry.removeFrom(this.map);
        this.stops.removeFrom(this.map);

        this.handler.hide();
    }
}