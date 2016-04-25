var app = {

  TIMEOUT_DATA_CONTEXT : 5,
  TIMEOUT_ACTION_CONTEXT : 5,


  /*** WRAPS THE DEFAULT ADJUST HEIGHT TO PUT A DELAY ALLOW FOR ASYNC UI ELEMENTS TO RENDER ***/
  resizeFrame : function() {
    setTimeout(
      function() {
        console.log("Resizing to fit contents...");
        gadgets.window.adjustHeight();
      },
      500
    );
  },

  /*** WRAPS THE DEFAULT ADJUST HEIGHT TO PUT A DELAY ALLOW FOR ASYNC UI ELEMENTS TO RENDER ***/
  execPromiseChain : function(promises) {
    var base = $.when({});
    $.each(promises, function(index, promise){
      base = base.then(promise);
    });
  },

  K_JIVE_URL : "jiveUrl",
  K_VIEWER : "viewer",
  K_VIEW_CONTEXT : "viewContext",
  K_ACTION_CONTEXT : "actionContext",
  K_DATA_CONTEXT : "dataContext",
  K_TILE_CONTEXT : "tileContext",
  K_EXT_PROPS : "extProps",
  K_PARAM_SWAGGER_URL : "swaggerURL",
  K_PARAM_SWAGGER_JSON : "swaggerJSON",

  currentContext : {},

  getJiveURL :          function() {   return opensocial.getEnvironment()[this.K_JIVE_URL]; },

  getViewer :         function() {   return this.currentContext[this.K_VIEWER];  },
  setViewer :    function(viewer) {  this.currentContext[this.K_VIEWER] = viewer; },

  getActionContext :  function() {   return this.currentContext[this.K_ACTION_CONTEXT];  },
  setActionContext :    function(context) {  this.currentContext[this.K_ACTION_CONTEXT] = context; },

  getViewContext :    function() {   return this.currentContext[this.K_VIEW_CONTEXT];  },
  setViewContext :    function(context) {  this.currentContext[this.K_VIEW_CONTEXT] = context; },

  getDataContext :    function() {   return this.currentContext[this.K_DATA_CONTEXT];  },
  setDataContext :    function(context) {  this.currentContext[this.K_DATA_CONTEXT] = context; },

  getExtProps :    function() {   return this.currentContext[this.K_EXT_PROPS];  },
  setExtProps :    function(extProps) {  this.currentContext[this.K_EXT_PROPS] = extProps; },

  getTileContext :  function() {   return this.currentContext[this.K_TILE_CONTEXT];  },
  setTileContext :    function(config,options,container) {  this.currentContext[this.K_TILE_CONTEXT] = { "config" : config, "options" : options, "container" : container }; },
  setTileContainer :    function(container) {  this.currentContext[this.K_TILE_CONTEXT]["container"] = container; },

  initViewerContext : function() {
        return $.Deferred(
            function(deferred) {
                console.log("Initializing Viewer Context...");
                osapi.jive.corev3.people.getViewer().execute(
                    function(viewer) {
                        app.setViewer(viewer);
                        console.log("\tViewer Context",viewer);
                        deferred.resolve();
                    } // end function
                );
            }
        ).promise();
  },

  initViewContext : function() {

      /*** RESOLVE THE VIEW CONTEXT ***/
      return $.Deferred(
          function(deferred) {
              console.log("Initializing View Context...");

              /*** GET THE VIEW NAME ***/
              var currentView = location.href.substr(location.href.indexOf('view=')+'view='.length);
              currentView = currentView.substr(0,currentView.indexOf('&'));

              osapi.jive.core.container.getLaunchContext(
                  function(rawContext) {
                    var embeddedContext = null;
                    if (rawContext) {
                      if (rawContext && rawContext["jive"] && rawContext["jive"]["context"]) {
                        embeddedContext = rawContext["jive"]["context"];
                      } // end if
                      osapi.jive.corev3.resolveContext(rawContext,
                        function(object) {
                          var viewContext = object["content"];
                          app.setViewContext({ "view" : currentView, "context" : viewContext, "embeddedContext" : embeddedContext });
                          console.log("\tView Context",currentView,viewContext);
                          deferred.resolve();
                      });
                    } else {
                        app.setViewContext({ "view" : currentView, "embeddedContext" : embeddedContext });
                        console.log("\tView Context",currentView);
                        deferred.resolve();
                    }// end if
                  } // end function
              );
          }
      ).promise();
  },

  initExtProps : function() {

    /*** RESOLVE THE VIEW CONTEXT ***/
    return $.Deferred(
        function(deferred) {
            console.log("Initializing ExtProps...");

            if (!app.getViewContext()) {
              deferred.resolve();
            } // end if

            /*** FALL BACK TO THE CONTEXT META-DATA FOR VIEW / ACTION / CONTAINER ***/
            var resourceURL = null;

            if (app.getViewContext()["context"]) {
              resourceURL = app.getViewContext()["context"]["resources"]["extprops"]["ref"];
            } else if (app.getTileContext() && app.getTileContext()["container"]) {
              //******************************************************
              //TODO: MAY HAVE MORE TO DO HERE TO GET THE URL
              //******************************************************
              resourceURL = app.getTileContext()["container"]["resources"]["extprops"]["ref"];
            } else if (app.getActionContext() && app.getActionContext()["context"]) {
              resourceURL = app.getActionContext()["context"]["resources"]["extprops"]["ref"];
            } // end if

            console.log('Resource URL',resourceURL);
            if (resourceURL) {

              /*** ADJUST URL TO START IN RIGHT LOCATION ****/
              resourceURL = resourceURL.substring(resourceURL.indexOf("/v3")+"/v3".length);

              console.log("Getting ExtProps...",resourceURL);

              osapi.jive.core.get({
                  v:"v3",
                  href:resourceURL
              }).execute(function(response) {
                if (response["error"]) {
                    console.log('error',response["error"]);
                } else {
                   app.setExtProps(response["content"]);
                   deferred.resolve();
                } // end if
              });
            } else {
                deferred.resolve();
            }// end if

          } // end function
      ).promise();
  },

  initActionContext : function() {

      return $.Deferred(
          function(deferred) {
              console.log("Initializing Action Context...");
              /**** THESE VALUES MUST MATCH THE ACTION IDS IN YOUR app.xml ******/
              $.each([
                  "swagger4jive.canvas",
                  "swagger4jive.places.all.tab",
                  "swagger4jive.createmenu.action",
                  "swagger4jive.app.rte.action"
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
              setTimeout(function() { deferred.resolve(); }, 5);
          } // end function
      ).promise();
  },

  initDataContext : function() {
        return $.Deferred(
            function(deferred) {
                console.log("Initializing Data Context...");

                /**** EXAMPLE LOADING CONTEXT DATA FOR !APP VIEW & EXT-OBJECTS ****/
                opensocial.data.getDataContext().registerListener('org.opensocial.ee.context',
                    function (key) {
                       var data = opensocial.data.getDataContext().getDataSet(key);
                       app.setDataContext(data);
                       console.log("\tData Context",data);
                    } // end function
                );
                setTimeout(function() { deferred.resolve(); }, 3);
            }
        ).promise();
  },

  initTileOpen : function() {
    return $.Deferred(
        function(deferred) {
            if (jive && jive.tile) {
              console.log("Initializing Tile Open...");
              jive.tile.onOpen(
                  function(config,options) {
                      app.setTileContext(config,options);
                      console.log("\t Tile Context",config,options);
                      deferred.resolve();
                  } // end function
              );
            } else {
              console.log("Tiles Not Enabled","open");
              deferred.resolve();
            } // end if
        } // end function
    ).promise();
  },

  initTileContainer : function() {
    return $.Deferred(
        function(deferred) {
            if (jive && jive.tile) {
              console.log("Initializing Tile Container...");
              jive.tile.getContainer(
                  function(container) {
                      app.setTileContainer(container);
                      console.log("\t Tile Container",container);
                      deferred.resolve();
                  } // end function
              );
            } else {
              console.log("Tiles Not Enabled","container");
              deferred.resolve();
            } // end if
        } // end function
    ).promise();
  },

  getRemoteJSON : function(jsonURL) {
    return $.Deferred(
        function(deferred) {

          osapi.http.get({
              'href' : jsonURL,
              'format' : 'json',
              'authz' : 'signed'
          }).execute(function(response) {
            if (response["error"]) {
               deferred.reject(response["error"]);
            } else {
               deferred.resolve(response["content"]);
            } // end if
          });

        } // end function
      ).promise();
  },

  initSwaggerJSON : function() {
    return $.Deferred(
        function(deferred) {
            console.log("Initializing Swagger JSON...");

            var json = null;
            var jsonUrl = null;

            /*** CHECK URL HASH FOR OVERRIDE APPS PARAM, FIRST ***/
            var jsonUrl = gadgets.views.getParams()[app.K_PARAM_SWAGGER_URL];

            /*** CHECK THE !app CONTEXT FOR SERIALIZED JSON FIRST ***/
            if (app.getDataContext() &&
                app.getDataContext()[app.K_PARAM_SWAGGER_JSON]) {
                json = app.getDataContext()[app.K_PARAM_SWAGGER_JSON];
            } // end if

            /*** NOW, LET'S CHECK THE EMBEDDED CONTEXT ONLY IF WE HAVEN'T FOUND SOMETHING YET ***/
            if (!json &&
                app.getViewContext() &&
                app.getViewContext()["embeddedContext"] &&
                app.getViewContext()["embeddedContext"][app.K_PARAM_SWAGGER_JSON]) {
                json = app.getViewContext()["embeddedContext"][app.K_PARAM_SWAGGER_JSON];
            } // end if

            /*** IF WE FOUND JSON, AND NO PARAM OVERRIDE URL THEN EXIT EARLY ***/
            if (json && !jsonUrl) {
               console.log('Found Embedded Context JSON w/o Param URL Override, exiting early');
               deferred.resolve(json);
               return; //TODO: NEEDED?
            } // end if

            if (!jsonUrl) {

              /*** CHECK THE !app CONTEXT FOR SERIALIZED JSON FIRST ***/
              if (app.getDataContext() &&
                  app.getDataContext()[app.K_PARAM_SWAGGER_URL]) {
                  jsonUrl = app.getDataContext()[app.K_PARAM_SWAGGER_URL];
              } // end if

              /*** NOW, LET'S CHECK THE EMBEDDED CONTEXT ONLY IF WE HAVEN'T FOUND SOMETHING YET ***/
              if (!jsonUrl &&
                  app.getViewContext() &&
                  app.getViewContext()["embeddedContext"] &&
                  app.getViewContext()["embeddedContext"][app.K_PARAM_SWAGGER_URL]) {
                  jsonUrl = app.getViewContext()["embeddedContext"][app.K_PARAM_SWAGGER_URL];
              } // end if

              /*** CHECK THE TILE CONFIG NEXT FOR OVERRIDE URL ***/
              if (!jsonUrl &&
                  app.getTileContext() &&
                  app.getTileContext()["config"] &&
                  app.getTileContext()["config"][app.K_PARAM_SWAGGER_URL]) {
                    jsonUrl = app.getTileContext()["config"][app.K_PARAM_SWAGGER_URL];
              } // end if

              if (!jsonUrl) {
                  var extProps = app.getExtProps();
                  if (extProps && extProps[app.K_PARAM_SWAGGER_URL]) {
                      console.log('Found Swagger URL in Context ExtProps ....');
                      jsonUrl = extProps[app.K_PARAM_SWAGGER_URL];
                  } // end if
                  if (!jsonUrl) {
                    /*** ONE LAST CHECK TO SEE IF THE SPEC IS SAVED EXPLICITLY TO THE PLACE ***/
                    if (extProps && extProps[app.K_PARAM_SWAGGER_JSON]) {
                        console.log('Found Swagger JSON in Context ExtProps ....');
                        json = extProps[app.K_PARAM_SWAGGER_JSON];
                    } // end if
                  } // end if

              } // end if

            } // end if

            if (json && !jsonUrl) {
              console.log('Using JSON found in ExtProps Context, since no json URL was found to override');
              deferred.resolve(json);
              return; //TODO: NEEDED?
            } // end if

            /**** FINALLY ****/
            if (jsonUrl) {
              app.getRemoteJSON(jsonUrl).then(
                  /** SUCCESS **/
                  function(data) {
                      console.log('Found Swagger JSON from Remote URL',jsonUrl);
                      deferred.resolve(data);
                  }, // end function
                  /** ERROR **/
                  function(error) {
                      console.log('ERROR: Found Swagger JSON from Remote URL',jsonUrl,error);
                      deferred.reject(error);
                  } // end function
              );
            } else {
                console.log("No Swagger Specification Details Found");
                deferred.reject({ "msg" : "Unable to located any Swagger Specification Details" });
            } // end if
        } // end function
    ).promise();
  },

  initSwagger : function() {
    return $.Deferred(
      function(deferred) {
          console.log("Initializing Swagger...");
          app.initSwaggerJSON().then(
              /*** SUCCESS ***/
              function(json) {
                app.initSwaggerUI(json);
              }, // end success
              /*** FAILURE ***/
              function(error) {
                $('body').append('<h1>Error</h1><p>'+JSON.stringify(error)+'</p>');
              }  // end error
          );
        } // end function
      ).promise();
  },

  initSwaggerUI : function(swaggerSpecJSON) {
    console.log("Initializing SwaggerUI...",swaggerSpecJSON);
    $(function () {

      hljs.configure({
        highlightSizeThreshold: 5000
      });

      // Pre load translate...
      if(window.SwaggerTranslator) {  window.SwaggerTranslator.translate();       }

      window.swaggerUi = new SwaggerUi({
        url : "ignore",
        spec : swaggerSpecJSON,
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: app.handleSwaggerUIOnComplete,
        onFailure: function(data) { console.log("Unable to Load SwaggerUI");  },
        docExpansion: "list",
        jsonEditor: false,
        defaultModelRendering: 'schema',
        showRequestHeaders: false
      });

      window.swaggerUi.load();

      });
  },

  handleSwaggerUIOnComplete : function(swaggerApi, swaggerUi) {
    if(typeof initOAuth == "function") {
      initOAuth({
        clientId: "your-client-id",
        clientSecret: "your-client-secret-if-required",
        realm: "your-realms",
        appName: "your-app-name",
        scopeSeparator: ",",
        additionalQueryStringParams: {}
      });
    }

    if(window.SwaggerTranslator) {
      window.SwaggerTranslator.translate();
    }

    app.resizeFrame();
  },

  init : function() {

    /*** AUTO-EXPAND THE CONTAINER WHENEVER SOMETHING IS COLLAPSED/EXPANDED ***/
    $('body').on('click','a.toggleOperation,a.expandResource,a.collapseResource',
        function(event) {
            app.resizeFrame(app.resizeFrame());
        }
    ); // end function

    var initQueue = [
        this.initActionContext,
        this.initDataContext,
        this.initViewContext,
        this.initExtProps,
        this.initViewerContext,
        this.initTileOpen,
        this.initTileContainer,
        this.initSwagger
    ];
    app.execPromiseChain(initQueue);

  } // end init

};

gadgets.util.registerOnLoadHandler(gadgets.util.makeClosure(app, app.init));
