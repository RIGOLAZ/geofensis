//chemin: mobile/functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

const db = admin.firestore();

// Configuration Twilio (pour SMS)
const twilioClient = twilio(
  functions.config().twilio.sid,
  functions.config().twilio.token
);

// 🔔 Fonction: Envoyer SMS quand alerte créée
exports.sendSMSAlert = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    
    // Récupérer la zone pour avoir le numéro de téléphone
    const zoneDoc = await db.collection('zones').doc(alert.zoneId).get();
    const zone = zoneDoc.data();
    
    if (!zone.smsAlert || !zone.contactPhone) {
      console.log('SMS désactivé ou pas de numéro');
      return null;
    }

    const message = alert.type === 'entry'
      ? `🚨 ALERTE: ${alert.workerName} est entré dans la zone "${zone.name}" à ${alert.timestamp.toDate().toLocaleString()}`
      : `✅ ${alert.workerName} a quitté la zone "${zone.name}" à ${alert.timestamp.toDate().toLocaleString()}`;

    try {
      await twilioClient.messages.create({
        body: message,
        from: functions.config().twilio.phone,
        to: zone.contactPhone,
      });
      
      // Marquer SMS comme envoyé
      await snap.ref.update({ smsSent: true });
      console.log('SMS envoyé à', zone.contactPhone);
      
    } catch (error) {
      console.error('Erreur SMS:', error);
      await snap.ref.update({ smsSent: false, smsError: error.message });
    }
  });

// 📍 Fonction: Nettoyer vieilles positions (tous les jours)
exports.cleanupOldPositions = functions.pubsub
  .schedule('0 0 * * *') // Tous les jours à minuit
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
    );
    
    const oldPositions = await db.collection('positions')
      .where('timestamp', '<', cutoff)
      .get();
    
    const batch = db.batch();
    oldPositions.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`${oldPositions.size} positions supprimées`);
  });

// 🔔 Fonction: Notification push quand worker entre dans zone critique
exports.sendPushNotification = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    
    if (alert.type !== 'entry') return null;
    
    const zoneDoc = await db.collection('zones').doc(alert.zoneId).get();
    const zone = zoneDoc.data();
    
    // Envoyer à tous les admins
    const admins = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const tokens = [];
    admins.docs.forEach(doc => {
      const user = doc.data();
      if (user.fcmToken) tokens.push(user.fcmToken);
    });
    
    if (tokens.length === 0) return null;
    
    const message = {
      notification: {
        title: `🚨 Intrusion zone ${zone.name}`,
        body: `${alert.workerName} est entré dans une zone ${zone.alertLevel}`,
      },
      data: {
        zoneId: alert.zoneId,
        workerId: alert.workerId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens: tokens,
    };
    
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`${response.successCount} notifications envoyées`);
    } catch (error) {
      console.error('Erreur notification:', error);
    }
  });
  