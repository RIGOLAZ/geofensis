import React, { useEffect, useState } from 'react'
import { Typography, Grid, Paper, Box, Chip } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RealTimeMap from '../../components/dashboard/RealTimeMap/RealTimeMap'
import { getDashboardStats, getActivityData } from '../../api/dashboardApi'
import { subscribeToDevices } from '../../api/devicesApi'

const data = [
  { name: '00:00', alerts: 4 },
  { name: '04:00', alerts: 3 },
  { name: '08:00', alerts: 7 },
  { name: '12:00', alerts: 12 },
  { name: '16:00', alerts: 8 },
  { name: '20:00', alerts: 5 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalZones: 0,
    activeDevices: 0,
    todayAlerts: 0,
    violations: 0
  })
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger les stats initiales
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats()
        setStats(dashboardStats)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()

    // Souscrire aux devices en temps réel
    const unsubscribe = subscribeToDevices((updatedDevices) => {
      setDevices(updatedDevices.map(d => ({
        id: d.id,
        lat: d.lastLocation?.lat || 48.8566,
        lng: d.lastLocation?.lng || 2.3522,
        name: d.name
      })))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord
      </Typography>
      
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
              Localisation en Temps Réel
            </Typography>
            <Box sx={{ height: 380 }}>
              <RealTimeMap devices={devices} />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 450, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Activité Récente
            </Typography>
            {loading ? (
              <Typography>Chargement...</Typography>
            ) : devices.length === 0 ? (
              <Typography color="textSecondary">Aucun device connecté</Typography>
            ) : (
              devices.map(device => (
                <Box key={device.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2">{device.name || device.id}</Typography>
                  <Chip 
                    size="small" 
                    label="En ligne" 
                    color="success" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              ))
            )}
          </Paper>
        </Grid>
        
        {/* Activity Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Activité des 24 dernières heures
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
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
