/** Описание объекта, хранящего ссылки на созданные объекты моделей транспортной сети */
class Network {
    constructor() {
        this.bus_graph = null;
        this.troll_graph = null;
        this.tram_graph = null;
    }

    get_graph(tr_type) {
        if (tr_type == 0) {
            return this.bus_graph;
        }
        
        if (tr_type == 1) {
            return this.troll_graph;
        }

        if (tr_type == 2) {
            return this.tram_graph;
        }

        return null;
    }

    set_graph(tr_type, graph) {
        if (tr_type == 0) {
            this.bus_graph = graph;
        }
        
        if (tr_type == 1) {
            this.troll_graph = graph;
        }

        if (tr_type == 2) {
            this.tram_graph = graph;
        }
    }

    is_set_graph(tr_type) {
        if (tr_type == 0) {
            return this.bus_graph != null;
        }
        
        if (tr_type == 1) {
            return this.troll_graph != null;
        }

        if (tr_type == 2) {
            return this.tram_graph != null;
        }

        return null;
    }
}