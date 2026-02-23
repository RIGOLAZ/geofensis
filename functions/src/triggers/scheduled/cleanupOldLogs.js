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

    if (oldLogs.empty) {
      console.log('No old logs to clean up');
      return;
    }

    const batch = admin.firestore().batch();
    oldLogs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`Cleaned up ${oldLogs.size} old log entries`);
    
    // Archiver dans Cloud Storage (optionnel)
    const archiveData = oldLogs.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      archivedAt: new Date().toISOString()
    }));

    const file = admin.storage().bucket().file(`archives/geofence_logs/${Date.now()}.json`);
    await file.save(JSON.stringify(archiveData), {
      contentType: 'application/json',
      gzip: true
    });

    console.log('Archive created in Cloud Storage');
  });