global.root_path = __dirname + "/../../";

// Load internal alias resolver
require("../../js/alias-resolver");

var AutoInstall = require(__dirname + "/node_helper.js");

var instance = new AutoInstall();
instance.config.update = true;
instance.loaded(function(err) {
	if (err) {
		console.log("Error installing/updating modules: " + err);
	}
});
