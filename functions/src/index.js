const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Import des triggers
const { onGeofenceEvent } = require('./triggers/onGeofenceEvent');
const { onDeviceStatusChange } = require('./triggers/onDeviceStatusChange');
const { onUserCreate } = require('./triggers/onUserCreate');

// Import des scheduled functions
const { cleanupOldLogs } = require('./triggers/scheduled/cleanupOldLogs');
const { dailyReport } = require('./triggers/scheduled/dailyReport');

// Export des fonctions
exports.onGeofenceEvent = onGeofenceEvent;
exports.onDeviceStatusChange = onDeviceStatusChange;
exports.onUserCreate = onUserCreate;
exports.cleanupOldLogs = cleanupOldLogs;
exports.dailyReport = dailyReport;

// HTTP API (optionnel)
const { api } = require('./http/api/zones');
exports.api = api;