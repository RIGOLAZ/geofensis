import React, { useEffect, useState } from 'react'
import { Typography, Grid, Paper, Box, Chip, Alert } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RealTimeMap from '../../components/dashboard/RealTimeMap/RealTimeMap'
import { getDashboardStats, getRecentAlerts } from '../../api/dashboardApi'
import { subscribeToDevices } from '../../api/devicesApi'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalZones: 0,
    activeDevices: 0,
    todayAlerts: 0,
    violations: 0
  })
  const [devices, setDevices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Charger les stats initiales
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
        
        const recentAlerts = await getRecentAlerts(5)
        setAlerts(recentAlerts)
      } catch (err) {
        setError('Erreur chargement stats: ' + err.message)
      }
    }
    loadStats()

    // Souscrire aux devices en temps réel
    const unsubscribe = subscribeToDevices((updatedDevices) => {
      setDevices(updatedDevices.map(d => ({
        id: d.id,
        lat: d.lastLocation?.lat || 48.8566,
        lng: d.lastLocation?.lng || 2.3522,
        name: d.name || d.id,
        status: d.status
      })))
      setLoading(false)
    })

    // Rafraîchir les stats toutes les 30 secondes
    const interval = setInterval(loadStats, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // Données pour le graphique (à remplacer par vraies données historiques)
  const activityData = [
    { name: '00:00', alerts: 0 },
    { name: '04:00', alerts: 0 },
    { name: '08:00', alerts: 0 },
    { name: '12:00', alerts: 0 },
    { name: '16:00', alerts: 0 },
    { name: '20:00', alerts: 0 },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord
      </Typography>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3">{stats.totalZones}</Typography>
            <Typography color="textSecondary">Zones Actives</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3">{stats.activeDevices}</Typography>
            <Typography color="textSecondary">Devices Connectés</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3">{stats.todayAlerts}</Typography>
            <Typography color="textSecondary">Alertes Aujourd'hui</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="error">{stats.violations}</Typography>
            <Typography color="textSecondary">Violations</Typography>
          </Paper>
        </Grid>

        {/* Real Time Map */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 450 }}>
            <Typography variant="h6" gutterBottom>
              Localisation en Temps Réel ({devices.length} devices)
            </Typography>
            <Box sx={{ height: 380 }}>
              <RealTimeMap devices={devices} />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 450, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Alertes Récentes
            </Typography>
            {loading ? (
              <Typography>Chargement...</Typography>
            ) : alerts.length === 0 ? (
              <Typography color="textSecondary">Aucune alerte récente</Typography>
            ) : (
              alerts.map(alert => (
                <Box key={alert.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    {alert.type === 'ZONE_ENTRY' ? '🚨 Entrée' : '✅ Sortie'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Zone: {alert.zoneId}
                  </Typography>
                  <Typography variant="caption">
                    {alert.timestamp?.toLocaleString?.() || 'Date inconnue'}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
        
        {/* Activity Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Activité (données simulées)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="alerts" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}