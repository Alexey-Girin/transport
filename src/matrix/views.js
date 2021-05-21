class Views {
    static init_set(handler) {
        var btn_date_update = document.getElementById('P5_MATRIX_CONFIRM');
        btn_date_update.addEventListener('click', async function() {
            await handler();
        });
    }

    static get_date() {
        var date = $v('P5_SELECT_DATE');
        return date;
    }

    static open_loader() {
        var loader = document.getElementById('loader');
        loader.style.visibility = 'visible';
    }

    static hide_loader() {
        var loader = document.getElementById('loader');
        loader.style.visibility = 'hidden';
    }

    static set_matrix_report(stop_id) {
        apex.item("P5_STOP_ID").setValue(stop_id);
    }
}