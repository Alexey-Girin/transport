class Chart {
    constructor() {
        this.data_options = null;
    }

    set_options(data_options) {
        this.clear();
        this.data_options = data_options;
    }

    #download_chart(options, chart) {
            var description = document.getElementById("description_canvas");
            var ctx = description.getContext("2d");
            ctx.clearRect(0, 0, description.width, description.height);
            ctx.font = "14px Arial";
            var step = 17;

            var description_characteristic = `Характеристика:\t ${options.characteristic_type}`;
            description_characteristic += options.element_type == 'stop' 
                ? ` (${options.enter_exit})` : '';
            ctx.fillText(description_characteristic, 0, step);
            step += 17;

            ctx.fillText(`Маршрут (вариант):\t ${options.route_number} (${options.route_variant})`, 0, step);
            step += 17;

            if (options.element_type == 'stop') {
                ctx.fillText(`Остановка: ${options.stops_data.stop_name} (${options.stops_data.stop_id})`, 0, step);
                step += 17;
            } else {
                ctx.fillText(`От: ${options.stops_data.start_stop_name} (${options.stops_data.start_stop_id})`, 0, step);
                step += 17;

                ctx.fillText(`До: ${options.stops_data.end_stop_name} (${options.stops_data.end_stop_id})`, 0, step);
                step += 17;
            }

            ctx.fillText(`Тип дня:\t ${options.day_type}`, 0, step);
            var description_data = description.toDataURL('image/jpg');

            var doc = new jsPDF({
                orientation: 'landscape',
                format: 'a5',
                unit: 'px'
            });
            doc.addImage(description_data, 20, 10, 373, 42);
            doc.addImage(chart.getImageURI(), 20, 64, 400, 230);

            var char_name = options.characteristic_type;
            char_name += options.element_type == 'stop' 
                ? `-${options.enter_exit}` : '';
            
            var stops_data_for_filename = options.element_type == 'stop'
                ? `остановка-${options.stops_data.stop_id}` 
                : `перегон-${options.stops_data.start_stop_id}-${options.stops_data.end_stop_id}`;
            
            doc.save(`диаграмма_маршрут-${options.route_number}-${options.route_variant}_${stops_data_for_filename}_${char_name}_${options.day_type}`);
    }

    async #load_data() {
        var data_options = this.data_options;

        var data = null;
        var additional_info = null;

        if (data_options.element_type == 'haul') {
            return await loading_data.load_data_for_haul(
                data_options.route_data,
                data_options.stops_data
            );
        } else if (data_options.element_type == 'stop') {
            return await loading_data.load_data_for_stop(
                data_options.route_data,
                data_options.stops_data.stop_id
            );
        }

        return {
            data: data,
            additional_info: additional_info
        }
    }

    #convert_data_to_array_for_chart(data, title) {
        var result_array = [['Время суток', title]];

        data.forEach(element => {
            var interval = element.interval.split('_', 2).join('_');
            result_array.push([interval, element.value]);
        });

        return result_array;
    }

    async display() {
        if (this.data_options == null) {
            return;
        }

        this.clear();

        var loaded_data = await this.#load_data();

        if (loaded_data.data == null) {
            return;
        }

        var data = loaded_data.data;
        var additional_info = loaded_data.additional_info;

        data = this.#convert_data_to_array_for_chart(data, additional_info.chart_title);
        data = google.visualization.arrayToDataTable(data);

        var options = {
            legend: { position: 'none' },
            colors: ['#01939A'],
            chartArea: {left:"10%",top:"5%",width:"90%",height:"85%"},
            series: {
                0: {targetAxisIndex: 0}
            },
            hAxis: {
                title: 'Время суток',
                maxTextLines: 1,
                maxAlternation: 1,
                slantedText: false

            },
            vAxis: {
                title: additional_info.chart_title
            }
        };

        var chart = new google.visualization.ColumnChart(document.getElementById(additional_info.chart_type));

        var data_options = this.data_options;
        var diagram_setting = data_options.element_type == 'stop'  
            ? Views.get_stop_diagram_setting()
            : Views.get_haul_diagram_setting();
        Views.chart_download_handler_unset();
        Views.chart_download_handler_set(this.#download_chart, {
            element_type: data_options.element_type,
            characteristic_type: additional_info.chart_title, 
            route_number: data_options.route_data.route_number, 
            route_variant: data_options.route_data.route_variant, 
            stops_data: data_options.stops_data,
            day_type: diagram_setting.daytype,
            enter_exit: data_options.element_type == 'stop'? diagram_setting.enter_exit : null
        }, chart);

        chart.draw(data, google.charts.Bar.convertOptions(options));
    }

    clear() {
        var chart_types = [
            ['chart_haul'],
            ['chart_stop']
        ];

        chart_types.forEach(id => {
            document.getElementById(id).innerHTML = "";
        });
    }

    remove() {
        this.data_options = null;

        this.clear();
    }
}