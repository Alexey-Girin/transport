/** Описание объекта, представляющего картографическую модель маршрута */
class Route {
    /**
     * @param {{route_number: string, route_variant: number}} route_data 
     * - данные о маршруте
     * @param {Chart} chart - объект диаграммы 
     * @param {*} geometry_data - исходные данные о геометриях перегонов 
     * @param {*} stops_data - исходные данные об остановочных пунктах
     * @param {*} map - объект карты 
     */
    constructor(route_data, chart, geometry_data, stops_data, map) {
        this.map = map;        

        /** Описание геометрий перегонов */ 
        this.geometry = this._init_geometry(geometry_data);

        /** Описание остановочных пунктов */
        this.stops = this._init_stops(stops_data);

        /** Объект, определяющий обработчики событий 
         * выбора элементов модели маршрута (перегонов, остановочных пунктов) */
        this.route_logic = new Route_logic(chart, route_data);

        /** Объект, задающий блочное представление маршрута */
        this.route_view = new Route_view(
            stops_data, 
            this.forced_set_haul.bind(this),
            this.forced_set_stop.bind(this));

        /** Объект выбранного элемента */
        this.selected = {
            selected_element: null,
            selected_type: null,
            update_selected: function(new_selected_element, new_selected_type, that) {
                function changeBoundMarkColor(haul, is_selected) {
                    var color = is_selected 
                    ? config.selected_color 
                    : config.not_selected_color;

                    var start_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.start_stop_id);
                    var end_stop = that.stops.getLayers()
                        .find(e => e.options.stop_id == haul.options.end_stop_id);
                
                    start_stop.setStyle({'color': color}).toggleTooltip();
                    that.route_view.stop_selected_change_view(haul.options.start_stop_id, is_selected);
                    end_stop.setStyle({'color': color}).toggleTooltip();
                    that.route_view.stop_selected_change_view(haul.options.end_stop_id, is_selected);
                }

                if (this.selected_element != null) {
                    this.selected_element.setStyle({'color': config.not_selected_color});
                }

                if (this.selected_type == 'haul') {
                    changeBoundMarkColor(this.selected_element, false);
                    that.route_view.haul_selected_change_view(this.selected_element.options.start_stop_id, false);
                } else if (this.selected_type == 'stop') {
                    this.selected_element.closeTooltip();
                    that.route_view.stop_selected_change_view(this.selected_element.options.stop_id, false);
                }

                new_selected_element.setStyle({'color': config.selected_color});
                
                if (new_selected_type == 'haul') {
                    changeBoundMarkColor(new_selected_element, true);
                }

                if (new_selected_type == 'haul') {
                    that.route_view.haul_selected_change_view(new_selected_element.options.start_stop_id, true);
                } else if (new_selected_type == 'stop') {
                    that.route_view.stop_selected_change_view(new_selected_element.options.stop_id, true);
                }

                this.selected_element = new_selected_element;
                this.selected_type = new_selected_type;
            }
        }
        
        this._set_behavior();
        this._show(stops_data);
    }

    /** Создание описаний геометрий перегонов по исходным данным */
    _init_geometry(geometry_data) {
        var geometry = L.featureGroup();
        
        geometry_data.forEach(element => {
            var haul = L.polyline(element['STAGE_SHAPE'], {
                weight: config.haul.get_haul_weight(config.route.on_route_focus_zoom),
                color: config.not_selected_color,
                start_stop_id: element['POI_START'],
                end_stop_id: element['POI_FINISH']
            });

            geometry.addLayer(haul);
        });

        return geometry;
    }

    /** Создание описаний остановочных пунктов по исходным данным */
    _init_stops(stops_data) {
        var stops = L.featureGroup();
        var order = 0;
        
        stops_data.forEach(element => {
            order++;

            var stop = L.circleMarker([
                element['LATITUDE'], element['LONGITUDE']
            ], {
                radius: config.stop.get_stop_radius(config.route.on_route_focus_zoom),
                color: config.not_selected_color,
                fillColor: config.stop.fill_color,
                fillOpacity: config.stop.fill_opacity,
                stop_id: element['ID_STOP'],
                stop_name: element['STOP_NAME']
            });

            stop.bindTooltip(L.tooltip({
                pane: 'tooltip',
                permanent: true,
                className: 'text',
                direction: config.tooltip.direction,
                offset: L.point(config.tooltip.offset_x, config.tooltip.offset_y)
            }).setContent(`${order}: ${element['STOP_NAME']} (${element['ID_STOP']})`));

            stops.addLayer(stop);
        });

        return stops;
    }

    /** Обновление состояния для выбранного перегона */
    async _update_haul(haul) {
        this.selected.update_selected(haul, 'haul', this);

        var start_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.start_stop_id);
        var end_stop = this.stops.getLayers()
            .find(e => e.options.stop_id == haul.options.end_stop_id);

        await this.route_logic.haul_selected_handler({
            start_stop_id: start_stop.options.stop_id,
            end_stop_id: end_stop.options.stop_id,
            start_stop_name: start_stop.options.stop_name,
            end_stop_name: end_stop.options.stop_name
        });
    }

    /** Обработчик события нажатия на перегон */
    async _on_haul_click(event) {
        var haul = event.target;
        await this._update_haul(haul);
    }

    /**
     * Обработчик события стороннего выбора перегона
     * @param {number} start_stop_id - ID начального остановочного пункта перегона
     */
    async forced_set_haul(start_stop_id) {
        var haul = this.geometry.getLayers()
            .find(e => e.options.start_stop_id == start_stop_id);

        if (haul == undefined) {
            return;
        }

        await this._update_haul(haul);
    }

    /** Обновление состояния для выбранного остановочного пункта */
    async _update_stop(stop) {
        this.selected.update_selected(stop, 'stop', this);
        stop.openTooltip();
        await this.route_logic.stop_selected_handler({
            stop_id: stop.options.stop_id,
            stop_name: stop.options.stop_name
        });
    }

    /** Обработчик события нажатия на остановочный пункт */
    async _on_stop_click(event) {
        var stop = event.target;
        await this._update_stop(stop);
    }

    /**
     * Обработчик события стороннего выбора остановочного пункта
     * @param {number} stop_id - ID остановочного пункта
     */
    async forced_set_stop(stop_id) {
        var stop = this.stops.getLayers()
            .find(e => e.options.stop_id == stop_id);

        if (stop == undefined) {
            return;
        }

        await this._update_stop(stop);
    }

    /** Начальное задание обработчиков событий */
    _set_behavior() {
        this.geometry.getLayers().forEach(haul => haul.on('click', 
            async (e) => this._on_haul_click(e), this));
        this.stops.getLayers().forEach(stop => stop.on('click', 
            async (e) => this._on_stop_click(e), this));

        this.map.on('zoomend', () => {
            var mapZoom = this.map.getZoom();

            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.stop.get_stop_radius(mapZoom)
            }));

            this.geometry.getLayers().forEach(stop => stop.setStyle({
                'weight': config.haul.get_haul_weight(mapZoom)
            }, this));

            if (mapZoom >= config.min_map_zoom_for_stops) {
                this.map.getPane('tooltip').style.display = '';
            } else {
                this.map.getPane('tooltip').style.display = 'none';
            }
        });
    }

    /** Отображение модели на карте */
    _show(stops_data) {
        this.map.setView([
            stops_data[0]['LATITUDE'], stops_data[0]['LONGITUDE']
        ], config.route.on_route_focus_zoom, {animation: true }); 
        
        this.geometry.addTo(this.map);
        this.stops.addTo(this.map);

        this.stops.getLayers().forEach(stop => stop.closeTooltip());
    }

    /** Сокрытие модели с карты */
    hide() {
        this.geometry.clearLayers();
        this.stops.clearLayers();
        this.route_view.clear();
    }
}