// src/api/deviceStatsApi.js
import { getDevices } from './devicesApi'

export const getDeviceStats = async () => {
  try {
    const devices = await getDevices();
    
    // Calculate various stats
    const stats = {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      byType: devices.reduce((acc, device) => {
        acc[device.type] = (acc[device.type] || 0) + 1;
        return acc;
      }, {}),
      lastUpdated: new Date().toISOString(),
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching device stats:', error);
    throw error;
  }
};