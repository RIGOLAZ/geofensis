const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Triggers
const geofenceModule = require('./triggers/onGeofenceEvent');
const onGeofenceEvent = geofenceModule.onGeofenceEvent || geofenceModule;

const deviceStatusModule = require('./triggers/onDeviceStatusChange');
const onDeviceStatusChange = deviceStatusModule.onDeviceStatusChange || deviceStatusModule;

// HTTP API
const zonesModule = require('./http/api/zones');
const zonesApi = zonesModule.zonesApi || zonesModule;

const devicesModule = require('./http/api/devices');
const devicesApi = devicesModule.devicesApi || devicesModule;

// Scheduled functions
const cleanupModule = require('./triggers/scheduled/cleanupOldLogs');
const cleanupOldLogs = cleanupModule.cleanupOldLogs || cleanupModule;

const dailyReportModule = require('./triggers/scheduled/dailyReport');
const dailyReport = dailyReportModule.dailyReport || dailyReportModule;

exports.onGeofenceEvent = onGeofenceEvent;
exports.onDeviceStatusChange = onDeviceStatusChange;
exports.cleanupOldLogs = cleanupOldLogs;
exports.dailyReport = dailyReport;

exports.apiZones = functions.https.onRequest(zonesApi);
exports.apiDevices = functions.https.onRequest(devicesApi);
