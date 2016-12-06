var NodeHelper = require("node_helper");

var fs = require("fs");
var config = require(__dirname + "/../../config/config.js");
var defaultModules = require(__dirname + "/../../modules/default/defaultmodules.js");
var SimpleGit = require("simple-git");
//TODO: consider var npm  = require("npm");
var child_process = require("child_process");
var deasync = require("deasync");

module.exports = NodeHelper.create({
	config: {},

	init: function() {
		console.log("AutoInstall - check modules to install");

		for (var m in config.modules) {
			var module = config.modules[m];
			if (!module.disabled) {
				try {
					this.installModule(module);
				} catch(e) {
					console.log("Error while checking/installing " + module);
					console.log(e);
				}
			}
		}
	},

	/* installModule(module)
	 * Installs a missing module if it has a git repository.
	 *
	 * argument module object - The module from config to check and install.
	 */
	installModule: function(module) {
		var elements = module.module.split("/");
		var moduleName = elements[elements.length - 1];
		var moduleFolder =  __dirname + "/../../modules/" + module.module;

		if (defaultModules.indexOf(moduleName) !== -1) {
			// Don't install default modules
			console.log("AutoInstall - skip default module " + moduleName);
			return;
		}

		try {
			fs.accessSync(moduleFolder, fs.R_OK);
			// No exception, so dir exists
			console.log("AutoInstall - already installed " + moduleName);
			return;
		} catch (e) {
			//console.log(e);
			console.log("Missing module: " + moduleName + " (" + moduleFolder + ".");
		}

		if (module.repository === undefined) {
			// No repository configured
			console.log("AutoInstall - skip module without repository " + moduleName);
			return;
		}
		console.log("Install "+moduleName+" from "+module.repository);

		var done = false;
		var self = this;
		SimpleGit().clone(module.repository, moduleFolder, function(err, data) {
			if (err !== null) {
				console.log(err);
				console.log(err.stack);
				done = true;
				return;
			}

			self.npm_install(moduleFolder);
			done = true;
		});

		while(done === false) {
			deasync.sleep(100);
		}
	},

	npm_install: function(where) {
		var env = process.env;
		where = where+"/";
		env["NODE_ENV"] = "production";
		console.log(where);
		child_process.execSync("npm --prefix '" + where + "' install '" + where + "'", {cwd: where, env: process.env, stdio: "inherit"});
	},
});
