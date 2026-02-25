import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase';
import MapEditor from '../../../components/zones/ZoneEditor/MapEditor';

const ZoneEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zone, setZone] = useState({
    name: '',
    type: 'circle',
    description: '',
    coordinates: []
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadZone = async () => {
      try {
        const docRef = doc(db, 'zones', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setZone({ id: docSnap.id, ...docSnap.data() });
        } else {
          setSnackbar({
            open: true,
            message: 'Zone non trouvee',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Error loading zone:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement',
          severity: 'error'
        });
      }
      setLoading(false);
    };

    loadZone();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'zones', id);
      await updateDoc(docRef, {
        name: zone.name,
        type: zone.type,
        description: zone.description,
        coordinates: zone.coordinates
      });
      
      setSnackbar({
        open: true,
        message: 'Zone modifiee avec succes',
        severity: 'success'
      });
      
      setTimeout(() => navigate('/zones'), 2000);
    } catch (error) {
      console.error('Error saving zone:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la sauvegarde',
        severity: 'error'
      });
    }
    setSaving(false);
  };

  if (loading) {
    return React.createElement(
      Box,
      { sx: { p: 3 } },
      React.createElement(Typography, null, 'Chargement...')
    );
  }

  return React.createElement(
    Box,
    { sx: { p: 3 } },
    React.createElement(
      Typography,
      { variant: 'h4', gutterBottom: true },
      'Modifier la zone'
    ),
    React.createElement(
      Paper,
      { sx: { p: 3 } },
      React.createElement(
        Grid,
        { container: true, spacing: 3 },
        React.createElement(
          Grid,
          { item: true, xs: 12, md: 6 },
          React.createElement(TextField, {
            fullWidth: true,
            label: 'Nom',
            value: zone.name,
            onChange: (e) => setZone({ ...zone, name: e.target.value }),
            margin: 'normal'
          }),
          React.createElement(TextField, {
            fullWidth: true,
            label: 'Description',
            value: zone.description,
            onChange: (e) => setZone({ ...zone, description: e.target.value }),
            margin: 'normal',
            multiline: true,
            rows: 3
          }),
          React.createElement(TextField, {
            fullWidth: true,
            select: true,
            label: 'Type',
            value: zone.type,
            onChange: (e) => setZone({ ...zone, type: e.target.value }),
            margin: 'normal',
            SelectProps: {
              native: true
            }
          },
          React.createElement('option', { value: 'circle' }, 'Cercle'),
          React.createElement('option', { value: 'polygon' }, 'Polygone')
          )
        ),
        React.createElement(
          Grid,
          { item: true, xs: 12, md: 6 },
          React.createElement(
            Typography,
            { variant: 'subtitle1', gutterBottom: true },
            'Editeur de carte'
          ),
          React.createElement(MapEditor, {
            type: zone.type,
            coordinates: zone.coordinates,
            onChange: (coords) => setZone({ ...zone, coordinates: coords })
          })
        ),
        React.createElement(
          Grid,
          { item: true, xs: 12 },
          React.createElement(
            Box,
            { sx: { display: 'flex', gap: 2, justifyContent: 'flex-end' } },
            React.createElement(
              Button,
              { variant: 'outlined', onClick: () => navigate('/zones') },
              'Annuler'
            ),
            React.createElement(
              Button,
              {
                variant: 'contained',
                onClick: handleSave,
                disabled: saving
              },
              saving ? 'Sauvegarde...' : 'Enregistrer'
            )
          )
        )
      )
    ),
    React.createElement(
      Snackbar,
      {
        open: snackbar.open,
        autoHideDuration: 6000,
        onClose: () => setSnackbar({ ...snackbar, open: false })
      },
      React.createElement(
        Alert,
        {
          onClose: () => setSnackbar({ ...snackbar, open: false }),
          severity: snackbar.severity
        },
        snackbar.message
      )
    )
  );
};

export default ZoneEditPage;
