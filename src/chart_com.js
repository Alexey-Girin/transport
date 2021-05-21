class Chart_com {
    static get_diagram_setting() {
        var diagram_setting = {
            averaging: $v('P2_GRAPH_STOP_COM_AVERAGING'),
            characteristic: $v('P2_GRAPH_STOP_COM_CHARACTERISTIC'),
            time_period: $v('P2_GRAPH_STOP_COM_TIME_PERIOD'),
            daytype: $v('P2_GRAPH_STOP_COM_DAYTYPE'),
            date: $v('P2_GRAPH_STOP_COM_DATE'),
            enter_exit: $v('P2_GRAPH_STOP_COM_ENTER_OR_EXIT'),
            stop_id: $v('P2_STOP_COM_STOP_ID')
        }

        return diagram_setting;
    }

    static async load_route_pass_date_stop(id_stop, entrance_type, date) {
        var pass = null;
        var parsed_date = date.split('.');
        date = [parsed_date[1], parsed_date[0], parsed_date[2]].join('/');

        try {
            pass = (await get_route_pass_date_stop(id_stop, entrance_type, date)).rows;
        } catch(e) {
            console.log('error to load pass');
        }
        
        return pass;
    }

    static async load_route_pass_averaged_stop(id_stop, entrance_type, daytype) {
        var pass = null;

        try {
            pass = (await get_route_pass_averaged_stop(id_stop, entrance_type, daytype)).rows;
        } catch(e) {
            console.log('error to load pass');
        }
        
        return pass;
    }

    static async load_data() {
        var diagram_setting = Chart_com.get_diagram_setting();
        var data = null;
        var additional_info = null;

        if (diagram_setting.averaging == 0) {
            data = await Chart_com.load_route_pass_averaged_stop(diagram_setting.stop_id, 
                diagram_setting.enter_exit, 
                diagram_setting.daytype
            );
            additional_info = {
                chart_type: 'chart_stop_com',
                chart_title: 'Пассажирооборот (по остановке)'
            }; 
        } else if (diagram_setting.averaging == 1) {
            data = await Chart_com.load_route_pass_date_stop(diagram_setting.stop_id, 
                diagram_setting.enter_exit, 
                diagram_setting.date
            );
            additional_info = {
                chart_type: 'chart_stop_com',
                chart_title: 'Пассажирооборот (по остановке)'
            }; 
        }

        return {
            data: data,
            additional_info: additional_info
        }
    }

    static convert_data_to_array_for_chart(data, title) {
        var result_array = [['Время суток', title]];

        data.forEach(element => {
            var interval = element.interval.split('_', 2).join('_');
            result_array.push([interval, element.value]);
        });

        return result_array;
    }

    static async update() {
        Chart_com.clear();

        var loaded_data = await Chart_com.load_data();

        if (loaded_data.data == null) {
            return;
        }

        var data = loaded_data.data;
        var additional_info = loaded_data.additional_info;

        data = Chart_com.convert_data_to_array_for_chart(data, additional_info.chart_title);
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
        chart.draw(data, google.charts.Bar.convertOptions(options)); 
    }

    static clear() {
        var chart_types = [
            ['chart_stop_com']
        ];

        chart_types.forEach(id => {
            document.getElementById(id).innerHTML = "";
        });
    }
}