const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onGeofenceEvent = functions.firestore
  .document('geofence_logs/{logId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    
    try {
      // Récupérer les infos du device
      const deviceDoc = await admin.firestore().doc(`devices/${event.deviceId}`).get();
      const deviceData = deviceDoc.data();
      
      if (!deviceData) {
        console.log('Device not found:', event.deviceId);
        return;
      }

      // Envoi notification push via FCM
      if (deviceData.fcmToken) {
        const message = {
          token: deviceData.fcmToken,
          notification: {
            title: event.type === 'ZONE_ENTRY' ? '🚨 Entrée Zone' : '✅ Sortie Zone',
            body: `Zone: ${event.zoneName || event.zoneId}`
          },
          data: {
            type: event.type,
            zoneId: event.zoneId,
            timestamp: event.timestamp.toMillis().toString(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'geofence-alerts',
              sound: 'default',
              priority: 'high'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                alert: {
                  title: event.type === 'ZONE_ENTRY' ? '🚨 Entrée Zone' : '✅ Sortie Zone',
                  body: `Zone: ${event.zoneName || event.zoneId}`
                }
              }
            }
          }
        };

        await admin.messaging().send(message);
        console.log('Push notification sent to:', event.deviceId);
      }

      // Envoi SMS si configuré
      if (event.smsAlert && event.contactPhone) {
        const twilio = require('twilio')(
          functions.config().twilio.sid,
          functions.config().twilio.token
        );
        
        await twilio.messages.create({
          body: `ALERTE GEOFENCING: ${event.type} dans ${event.zoneName}`,
          from: functions.config().twilio.phone,
          to: event.contactPhone
        });
        
        console.log('SMS sent to:', event.contactPhone);
      }

      // Webhook vers système externe
      if (event.webhookUrl) {
        const fetch = require('node-fetch');
        await fetch(event.webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Geofencing-Signature': functions.config().webhook.secret
          },
          body: JSON.stringify({
            event: event.type,
            zoneId: event.zoneId,
            zoneName: event.zoneName,
            deviceId: event.deviceId,
            location: event.location,
            timestamp: event.timestamp.toISOString()
          })
        });
        
        console.log('Webhook sent to:', event.webhookUrl);
      }

      // Mettre à jour les statistiques du device
      await admin.firestore().doc(`devices/${event.deviceId}`).update({
        lastEvent: event.type,
        lastEventTime: event.timestamp,
        lastZone: event.zoneId,
        eventsCount: admin.firestore.FieldValue.increment(1)
      });

    } catch (error) {
      console.error('Error processing geofence event:', error);
    }
  });