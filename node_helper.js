var NodeHelper = require("node_helper");

var fs = require("fs");
var config = require(__dirname + "/../../config/config.js");
var defaultModules = require(__dirname + "/../../modules/default/defaultmodules.js");
var SimpleGit = require("simple-git");
//TODO: consider var npm  = require("npm");
var child_process = require("child_process");

module.exports = NodeHelper.create({
	config: {},

	loaded: function(callback) {
		console.log("AutoInstall - check modules to install");

		var self = this;
		var modules = config.modules;

		var installNextModule = function() {
			if (modules.length > 0) {
				var nextModule = modules[0];
				self.installModule(nextModule, function(err) {
					if (err) console.log("Error in autoinstall on module " + nextModule.module + ": " + err);
					modules = modules.slice(1);
					installNextModule();
				});
			} else {
				// All modules are installed
				return callback();
			}
		};

		return installNextModule();
	},

	/* installModule(module)
	 * Installs a missing module if it has a git repository.
	 *
	 * argument module object - The module from config to check and install.
	 */
	installModule: function(module, callback) {
		try {
			if (module.disabled) {
				return callback(null);
			}

			var elements = module.module.split("/");
			var moduleName = elements[elements.length - 1];
			var moduleFolder =  __dirname + "/../../modules/" + module.module;

			if (defaultModules.indexOf(moduleName) !== -1) {
				// Don't install default modules
				console.log("AutoInstall - skip default module " + moduleName);
				return callback(null);
			}

			if (module.repository === undefined) {
				// No repository configured
				console.log("AutoInstall - skip module without repository " + moduleName);
				return callback(null);
			}

			try {
				fs.accessSync(moduleFolder, fs.R_OK);
				// No exception, so dir exists
				console.log("AutoInstall - check updates for already installed module " + moduleName);
				return this.updateModule(moduleFolder, callback);
			} catch (e) {
				//console.log(e);
				console.log("Missing module: " + moduleName + " (" + moduleFolder + ".");
			}

			console.log("Install "+moduleName+" from "+module.repository);

			var self = this;
			SimpleGit().clone(module.repository, moduleFolder, function(err, data) {
				if (err !== null) {
					console.log(err);
					console.log(err.stack);
					return callback(err);
				}

				self.npm_install(moduleFolder);
				return callback(null);
			});
		} catch(e) {
			return callback(e);
		}
	},

	updateModule: function(moduleFolder, callback) {
		var self = this;
		var git = SimpleGit(moduleFolder);
		git.getRemotes(true, function(err, remotes) {
			if (err != null) {
				return callback(err);
			}

			if (remotes.length < 1 || remotes[0].name.length < 1) {
				// No valid remote for folder, skip
				return callback(null);
			}

			// Folder has .git and has at least one git remote
			git.fetch()
			.status(function(err, status) {
				if (err != null) {
					return callback(err);
				}

				if (status.behind && status.behind > 0) {
					console.log(moduleFolder + " is " + status.behind + " commits behind.");
					git.pull(function(err, data) {
						if (err != null) {
							return callback(err);
						}

						self.npm_install(moduleFolder);
						return callback(null);
					});
				} else {
					return callback(null);
				}
			});
		});
	},

	npm_install: function(where) {
		var env = process.env;
		where = where+"/";
		env["NODE_ENV"] = "production";
		console.log(where);
		child_process.execSync("npm --prefix '" + where + "' install '" + where + "'", {cwd: where, env: process.env, stdio: "inherit"});
	},
});
