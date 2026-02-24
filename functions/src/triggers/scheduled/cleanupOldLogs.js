const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.cleanupOldLogs = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 jours
    );
    
    const oldLogs = await admin.firestore()
      .collection('geofence_logs')
      .where('timestamp', '<', cutoff)
      .limit(500)
      .get();
    
    const batch = admin.firestore().batch();
    oldLogs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Cleaned up ${oldLogs.size} old log entries`);
    return null;
  });
