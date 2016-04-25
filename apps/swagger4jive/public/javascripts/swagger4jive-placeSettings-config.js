var app = {

  K_PARAM_SWAGGER_URL : "swaggerURL",

  getJiveURL :          function() {   return opensocial.getEnvironment()[this.K_JIVE_URL]; },

  close : function(config,options) {
    osapi.jive.core.container.closeApp();
  },

  initActionContext : function() {

      return $.Deferred(
          function(deferred) {
              console.log("Initializing Action Context...");
              var promises = [];
              /**** THESE VALUES MUST MATCH THE ACTION IDS IN YOUR app.xml ******/
              $.each([
                  "swagger4jive.places.settings.all.action"
                ],
                  function(idx,actionID) {
                    gadgets.actions.updateAction({
                        id:actionID,
                        callback: gadgets.util.makeClosure( app,
                                                  function (action,context) {
                                                      console.log("\tAction Context Callback... ",action,context);
                                                      if (context) {
                                                        /*** TODO:  DETECT INVALID CONTEXT AND FILTER OUT ***/
                                                        if (true) {
                                                            console.log("\tResolving Context... ",action,context);
                                                            osapi.jive.corev3.resolveContext(context,
                                                              function(object) {
                                                                app["context"] = { "action" : action, "context" : object["content"] };
                                                                console.log("\tAction Context",action,object["content"]);
                                                            });
                                                        } // end if
                                                      } // end if
                                                  },
                                                  actionID)
                      } // end param
                    );
                  } // end function
              );
              setTimeout(function() { deferred.resolve(); }, 500);
          } // end function
      ).promise();
  },

  loadExistingPlaceConfig : function() {

      return $.Deferred(
          function(deferred) {
              console.log("Loading Place Configuration...",app["context"]);

              var extPropServiceURL = app["context"]["context"]["resources"]["extprops"]["ref"];
              extPropServiceURL = extPropServiceURL.substring(extPropServiceURL.indexOf('/places'));

              osapi.jive.core.get({
                  "v" : "v3",
                  "href" : extPropServiceURL
              }).execute(
                  function(response) {
                      if (response.error) {
                        deferred.reject(response["error"]);
                      } else {
                        deferred.resolve(response["content"]);
                      } // end if
                  } // end function
              );
          } // end function
      ).promise();
  },

  handleSave : function(event) {
      var extPropServiceURL = app["context"]["context"]["resources"]["extprops"]["ref"];
      extPropServiceURL = extPropServiceURL.substring(extPropServiceURL.indexOf('/places'));

      $('#btn_save').attr('disabled','disabled');

      osapi.jive.core.post({
          "v" : "v3",
          "href" : extPropServiceURL,
          "body" : {
            "swaggerURL" : $('#'+app.K_PARAM_SWAGGER_URL).val()
          }
      }).execute(
          function(response) {
              if (response["error"]) {
                console.log('error saving',response["error"]);
              } else {
                $('body').append('<h2>Save Successful</h2>').delay(2000).fadeOut(1000,function() { app.close(); });
              } // end if
          } // end function
      );

  },


  init : function() {

    app.initActionContext()
      .then(app.loadExistingPlaceConfig)
      .then(
          /*** SUCCESS ***/
          function(data) {

            /*** INIT UI COMPONENTS ***/
            $(function() {

              if (data && data[app.K_PARAM_SWAGGER_URL]) {
                  $('#'+app.K_PARAM_SWAGGER_URL).val(data[app.K_PARAM_SWAGGER_URL]);
              } // end if

              $('#btn_save').click(app.handleSave);

            });

          },
          /*** ERROR ***/
          function (error) {
            console.log('error',error);
          }
      );

      gadgets.window.adjustHeight();
      gadgets.window.adjustWidth();

  },

};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
