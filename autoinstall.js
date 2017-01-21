/* global Module, Log */

/* autoinstall.js
 *
 * All code is run server side in node_helper.js. This file exists to prevent errors in the client trying to load it.
 */

Module.register("autoinstall", {
	notificationReceived: function(notification, payload, sender) {
		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}

		if (notification === "AUTO_UPDATE") {
			this.sendSocketNotification("AUTO_UPDATE", {});
		}
	}
});
