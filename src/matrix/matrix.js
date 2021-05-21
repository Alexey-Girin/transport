class Matrix {
    constructor(map, all_stops_data_full) {
        // Перегоны графа
        this.destinations = null;

        // Остановки графа
        this.stops = L.featureGroup();

        // Объект карты
        this.map = map;

        // Объект выбранного элемента
        this.selected_stop = null;

        this.selected_haul = null;

        this.is_displayed = false;

        this.#fill_data(all_stops_data_full.bus);
        this.#fill_data(all_stops_data_full.tram);
        this.#fill_data(all_stops_data_full.trol);

        this.#set_behavior();
        Views.init_set(this.on_date_update.bind(this));
    }

    // Заполнение графа данными
    #fill_data(all_stops_data) {
        var mapZoom = this.map.getZoom();

        all_stops_data.forEach(element => {
            var stop = L.circleMarker([
                element['LT'], element['LN']
            ], {
                radius: config.get_stop_radius(mapZoom),
                color: matrix_config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                stop_id: element['ID'],
                stop_name: element['NM'],
                addition: 0,
                weight: 1
            });

            this.stops.addLayer(stop);
        });
    }

    async #update_matrix(stop) {
        if (stop == null) {
            return;
        }
        var date = Views.get_date();

        if (date == "") {
            alert('Дата не установлена');
            return;
        }

        if (this.selected_stop != null) {
            this.stops.getLayers().forEach(stop_ => {
                this.#set_stop_style(stop_, 'standart');
            });
        }

        this.selected_stop = stop;
        this.#set_stop_style(this.selected_stop, 'selected');

        var destinations = await loading_data.load_destination(stop.options.stop_id, date);

        this.destinations = destinations;
        this.destinations.forEach(destination => {
            var stop_ = this.stops.getLayers().find(e => e.options.stop_id == destination);
            if (stop_ != this.selected_stop) {
                this.#set_stop_style(stop_, 'destination');
            }

            if (stop_ != undefined) {
                this.stops.removeLayer(stop_);
                this.stops.addLayer(stop_);
            }
        });

        this.stops.removeLayer(stop);
        this.stops.addLayer(stop);
        Views.set_matrix_report(stop.options.stop_id);
    }

    async #on_stop_click(event) {
        var stop = event.target;
        this.#update_matrix(stop);
    }

    async #search(stop_id) {

    }

    #set_stop_style(stop, type) {
        var mapZoom = this.map.getZoom();

        if (stop == undefined) {
            return;
        }

        if (type == 'selected') {
            stop.setStyle({
                radius: config.get_stop_radius(mapZoom + 2),
                color: config.selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                addition: 2,
                weight: 2
            });
        } else if (type == 'destination') {
            stop.setStyle({
                radius: config.get_stop_radius(mapZoom + 2),
                color: 'blue',
                fillColor: 'white',
                fillOpacity: 1,
                addition: 2,
                weight: 2
            });
        } else if (type == 'standart') {
            stop.setStyle({
                radius: config.get_stop_radius(mapZoom),
                color: matrix_config.not_selected_color,
                fillColor: 'white',
                fillOpacity: 1,
                addition: 0,
                weight: 1
            });
        }
    }

    #create_tooltip(stop_name, stop_id) {
        return L.tooltip({
            pane: 'tooltip',
            permanent: true,
            className: 'text',
            direction: 'right',
            offset: L.point(10, 0)
        }).setContent(`${stop_name} (${stop_id})`);
    }

    #set_behavior() {
        this.stops.getLayers().forEach(stop => stop.on('click', 
            async (e) => this.#on_stop_click(e), this));

        this.map.on('zoomend', () => {
            if (!this.is_displayed) {
                return;
            }

            var mapZoom = this.map.getZoom();

            this.stops.getLayers().forEach(stop => stop.setStyle({
                'radius': config.get_stop_radius(mapZoom + stop.options.addition)
            }));
        });
    }

    show() {
        var mapZoom = this.map.getZoom();

        this.stops.addTo(this.map);

        this.stops.getLayers().forEach(stop => stop.setStyle({
            'radius': config.get_stop_radius(mapZoom)
        }));

        this.is_displayed = true;
    }

    // Сокрытие графа с карты
    hide() {
        this.is_displayed = false;

        if (this.selected_stop != null) {
            this.selected_stop.setStyle({color: matrix_config.not_selected_color});
        }

        this.selected_stop = null
        this.stops.removeFrom(this.map);
    }

    on_date_update() {
        this.#update_matrix(this.selected_stop);
    }
}