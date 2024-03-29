var NodeHelper = require("node_helper");

var fs = require("fs");
var config = require(global.root_path + "/config/config.js");
var defaultModules = require(global.root_path + "/modules/default/defaultmodules.js");
var SimpleGit = require("simple-git");
//TODO: consider var npm  = require("npm");
var childProcess = require("child_process");

module.exports = NodeHelper.create({
	config: {
		update: false
	},

	loaded: async function() {
		console.log("AutoInstall - check modules to install");

		var self = this;
		var modules = config.modules;

		var installNextModule = function() {
			if (modules.length > 0) {
				var nextModule = modules[0];
				self.installModule(nextModule, function(err) {
					if (err) {
						console.log("Error in autoinstall on module " + nextModule.module + ": " + err);
						console.log(err.stack);
					}
					modules = modules.slice(1);
					installNextModule();
				});
			} else {
				// All modules are installed
				console.log("All modules checked. Autoinstall done.");
			}
		};

		return installNextModule();
	},

	socketNotificationReceived: function(notification, payload) {
		console.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		if (notification === "AUTO_UPDATE") {
			this.config.update = true;
			this.loaded(function() {
				console.log("Done AUTO_UPDATE");
			});
		}
	},

	/* installModule(module)
	 * Installs a missing module if it has a git repository.
	 *
	 * argument module object - The module from config to check and install.
	 */
	installModule: function(module, callback) {
		if (module.disabled) {
			return callback(null);
		}

		var elements = module.module.split("/");
		var moduleName = elements[elements.length - 1];
		var moduleFolder =  global.root_path + "/modules/" + module.module;

		if (defaultModules.indexOf(moduleName) !== -1) {
			// Don't install default modules
			console.log("AutoInstall skip default module " + moduleName);
			return callback(null);
		}

		console.log("AutoInstall checking " + moduleFolder);
		if(fs.existsSync(moduleFolder)) {
			if (this.config.update) {
				console.log("AutoInstall - check updates for already installed module " + moduleName);
				return this.updateModule(moduleFolder, callback);
			} else {
				console.log("Autoinstall - update check disabled");
				return callback(null);
			}
		} else {
			console.log("AutoInstall - skip for existing dir " + moduleName);
		}

		if (module.repository === undefined) {
			// No repository configured
			console.log("AutoInstall - skip module without repository " + moduleName);
			return callback(null);
		}

		console.log("Missing module: " + moduleName + " (" + moduleFolder + ".");
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
				console.log(moduleFolder + " has no remote git repo. Not updated.");
				return callback(null);
			}

			// Folder has .git and has at least one git remote
			git.fetch(function(err, status) {
				if (err != null) {
					return callback(err);
				}
			}).status(function(err, status) {
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
		childProcess.execSync("npm --prefix '" + where + "' install '" + where + "'", {cwd: where, env: process.env, stdio: "inherit"});
	},
});
