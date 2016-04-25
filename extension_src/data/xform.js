function transform(body, headers, options, callback)   {

/*
 * TO DO: Parse 'body' arg based on incoming event from 3rd party system.
 * TO DO: Replace the sample code below with your own transformation code.
 */

// Build activity object.
var activityInfo = { actor: {}, object:{}, jive:{} };

// Optional name of actor for this activity. Remove if n/a.
// activityInfo.actor.name = "Jane Doe";

// Optional email of actor for activity. Remove if n/a.
// activityInfo.actor.email = "janedoe@example.com";

// Optional URL for this activity. Remove if n/a.
// Optional ... Removes the Go To Item Link in the Activity Stream Link (User will use the tile)
if (body["swaggerSite"]) {
  activityInfo.object.url = body["swaggerSite"];
  activityInfo.object.hideGoToItem = false;
} else {
  activityInfo.object.hideGoToItem = true;
} // end if

// Required URL to the image for this activity.
if (body["swaggerLogo"]) {
  activityInfo.object.image = body["swaggerLogo"];
} else {
  activityInfo.object.image = "http://swagger.io/wp-content/uploads/2016/02/swagger-logo.png";
} // end if

// Required title of the activity.
activityInfo.object.title = body["swaggerTitle"];
if (body["swaggerVersion"]) {
  activityInfo.object.title += " " + body["swaggerVersion"];
} // end if

// Optional HTML description of activity. Remove if n/a.
if (body["swaggerDescription"]) {
  activityInfo.object.description = body["swaggerDescription"];
} // end if

/*** TEMPORARY WORKAROUND NEEDED FOR REFERENCING STRUCTURES IN body, headers, options RATHER THAN INDIVIDUALLY TRAVERSING EACH KEY ***/
// function clone(obj) {  if (null == obj || "object" != typeof obj) return obj;  var copy = {};  for (var attr in obj) {   copy[attr] = clone(obj[attr]);   }  return copy;  }
// body = clone(body);
// headers = clone(headers);
// options = clone(options);
/*** END TEMPORARY WORK AROUND ****/

activityInfo.jive.app = {
  'appUUID': "72dd7331-3425-47b7-af18-7538a998609c",
  'view': "ext-object",
  'context': {
    'timestamp': new Date().toISOString(),
    'swaggerLogo' : body["swaggerLogo"],
    'swaggerTitle' : body["swaggerTitle"],
    'swaggerVersion' : body["swaggerVersion"],
    'swaggerDescription' : body["swaggerDescription"],
    'swaggerSite' : body["swaggerSite"],
    'swaggerURL' : body["swaggerURL"],
    'swaggerJSON' : body["swaggerJSON"],
    'rawBody': body,
    'headers': headers,
    'options': options
  }
}

/*
 * Call the callback function with our transformed activity information
 */

callback({ "activity" : activityInfo });

}
