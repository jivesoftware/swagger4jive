(function() {
    jive.tile.onOpen(function(config, options ) {
        gadgets.window.adjustHeight();

        // make sure config has default value
        if (config === null) config = { };
        if (!config["data"]) {
            config["data"] = { };
        }

        // populate the dialog with existing config value
        $("#swaggerURL").val( config["data"]["swaggerURL"]);

        // update config object after clicking submit
        $("#btn_save").click( function() {
            config["data"]["swaggerURL"] = $("#swaggerURL").val();
            jive.tile.close(config, {} );
        });
    });

})();
