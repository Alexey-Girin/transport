class Route_view {
    constructor(stops_data, forced_set_haul, forced_set_stop) {

        this.forced_set_haul = forced_set_haul;
        this.forced_set_stop = forced_set_stop;

        this.info_div_array = [];
        this.#init_info_div_array(stops_data);
    }

    #init_info_div_array(stops_data) {
        this.clear();

        for (var i = 0; i < stops_data.length - 1; i++) {
            this.info_div_array.push(this.#set_stop_info(stops_data[i]));
            this.info_div_array.push(this.#set_haul_info(stops_data[i]['ID_STOP'], stops_data[i + 1]['STOP_ID']));
        }

        this.info_div_array.push(this.#set_stop_info(stops_data[stops_data.length - 1]));
    }

    #set_stop_info(info_stop) {
        var tr_class = "tr_info_element";
        var tr_data_class = "tr_info_element_data";

        var tr_block = document.getElementById("tr_info_block");

        var info_div = document.createElement("div");
        info_div.className = tr_class;
        info_div.setAttribute("stop_id", info_stop['ID_STOP']);

        var tr_num = document.createElement("div");
        tr_num.className = tr_data_class;
        tr_num.innerText = info_stop['STOP_NAME'];
        info_div.append(tr_num);

        var tr_var = document.createElement("div");
        tr_var.className = tr_data_class;
        tr_var.innerText = info_stop['ID_STOP'];
        info_div.append(tr_var);

        tr_block.append(info_div);
        info_div.addEventListener('click', this.#on_info_stop_click.bind(this));

        return info_div;
    }

    #set_haul_info(poi_start, poi_finish) {
        var tr_class = "tr_info_haul";

        var tr_block = document.getElementById("tr_info_block");

        var info_div = document.createElement("div");
        info_div.className = tr_class;
        info_div.setAttribute("poi_start", poi_start);
        info_div.setAttribute("poi_finish", poi_finish);

        tr_block.append(info_div);
        info_div.addEventListener('click', this.#on_info_haul_click.bind(this));

        return info_div;
    }

    clear() {
        var tr_block = document.getElementById("tr_info_block");
        while (tr_block.firstChild) {
            tr_block.removeChild(tr_block.firstChild);
        }

        this.info_div_array = [];
    }

    #on_info_haul_click(event) {
        var poi_start = event.currentTarget.getAttribute('poi_start');
        var poi_finish = event.currentTarget.getAttribute('poi_finish');
        this.forced_set_haul(poi_start, poi_finish);
    }

    #on_info_stop_click(event) {
        var stop_id = event.currentTarget.getAttribute('stop_id');
        this.forced_set_stop(stop_id);
    }

    haul_selected_change_view(poi_start, is_selected) {
        var tr_class = is_selected ? 'tr_info_haul_selected' : 'tr_info_haul';
        var element = this.info_div_array.find(element => element.getAttribute('poi_start') == poi_start);

        element.className = tr_class;
        element.scrollIntoView({behavior: "smooth", block: "center"});
    }

    stop_selected_change_view(stop_id, is_selected) {
        var tr_class = is_selected ? 'tr_info_element_selected' : 'tr_info_element';
        var element = this.info_div_array.find(element => element.getAttribute('stop_id') == stop_id);

        element.className = tr_class;
        element.scrollIntoView({behavior: "smooth", block: "center"});
    }
}