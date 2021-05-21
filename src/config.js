var config = {
    map: {
        center: [59.939036, 30.315822],
        zoom: 16
    },
    route: {
        weight: 6,
        onRouteFocusZoom: 15,
    },
    min_map_zoom_for_stops: 13,
    selected_color: "#FF4600",
    not_selected_color: "#01939A",
    base_color: "#736fa8",
    get_haul_weight: (mapZoom) => {
        return Math.min(8, Math.max((mapZoom - 8), 1));
    },
    get_stop_radius: (mapZoom) => {
        return Math.min(8, Math.max((mapZoom - 9), 1));
    }
}

var matrix_config = {
    not_selected_color: "#989898",
    origin_color: "#FF4600",
    destination_color: "#FFFF00"
}

var graph_config = {
    strokeWidth: 6
}