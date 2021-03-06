window.onload = init;

async function init() {
    var map = L.map('map', {
        renderer: L.canvas()
    });
    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);
    map.createPane('tooltip');
    
    map.setView(config.map.center, config.map.zoom);

    var all_stops_data_bus = await loading_data.load_all_stops_by_tr_type(0);
    var all_stops_data_trol = await loading_data.load_all_stops_by_tr_type(1);
    var all_stops_data_tram = await loading_data.load_all_stops_by_tr_type(2);
    var all_stops_data_metro = await loading_data.load_all_stops_by_tr_type(7);

    if (all_stops_data_bus == null ||
        all_stops_data_trol == null || 
        all_stops_data_tram == null ||
        all_stops_data_metro == null) {
        alert('Ошибка. Не удалость загрузить данные по остановкам');
        return;
    }

    var new_matrix = new Matrix(map, {
        bus: all_stops_data_bus,
        trol: all_stops_data_trol,
        tram: all_stops_data_tram,
        metro: all_stops_data_metro
    });
    new_matrix.show();
}