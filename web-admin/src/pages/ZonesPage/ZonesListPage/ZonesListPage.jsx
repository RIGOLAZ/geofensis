import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { collection, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigate } from 'react-router-dom';

const ZonesListPage = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, zone: null });
  const [editDialog, setEditDialog] = useState({ open: false, zone: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const q = query(collection(db, 'zones'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setZones(zonesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'zones', deleteDialog.zone.id));
      setSnackbar({
        open: true,
        message: 'Zone supprimée avec succès',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la suppression',
        severity: 'error'
      });
    }
    setDeleteDialog({ open: false, zone: null });
  };

  const handleEdit = async () => {
    try {
      await updateDoc(doc(db, 'zones', editDialog.zone.id), {
        name: editDialog.zone.name,
        type: editDialog.zone.type,
        description: editDialog.zone.description
      });
      setSnackbar({
        open: true,
        message: 'Zone modifiée avec succès',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la modification',
        severity: 'error'
      });
    }
    setEditDialog({ open: false, zone: null });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Pagination manuelle
  const paginatedZones = zones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getZoneTypeLabel = (type) => {
    return type === 'circle' ? 'Cercle' : 'Polygone';
  };

  const getZoneTypeColor = (type) => {
    return type === 'circle' ? 'primary' : 'secondary';
  };

  const getCoordinatesCount = (zone) => {
    if (zone.type === 'circle') return '1 centre + rayon';
    if (zone.coordinates) return `${zone.coordinates.length} points`;
    return '0';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4">Gestion des Zones</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/zones/create')}
        >
          Nouvelle Zone
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Type</strong></TableCell>
                <TableCell align="center"><strong>Coordonnées</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedZones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Aucune zone définie. Créez votre première zone !
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedZones.map((zone) => (
                  <TableRow key={zone.id} hover>
                    <TableCell>{zone.name}</TableCell>
                    <TableCell>{zone.description || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getZoneTypeLabel(zone.type)}
                        size="small"
                        color={getZoneTypeColor(zone.type)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={getCoordinatesCount(zone)}>
                        <Chip
                          icon={<PlaceIcon />}
                          label={zone.type === 'circle' ? '1' : (zone.coordinates?.length || 0)}
                          size="small"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          onClick={() => setEditDialog({ open: true, zone })}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, zone })}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={zones.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Paper>

      {/* Dialog de suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, zone: null })}
      >
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog.zone?.name 
              ? `Confirmez la suppression de la zone : ${deleteDialog.zone.name}`
              : 'Confirmez la suppression de cette zone'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, zone: null })}>
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, zone: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifier la zone</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom"
              value={editDialog.zone?.name || ''}
              onChange={(e) => setEditDialog({
                ...editDialog,
                zone: { ...editDialog.zone, name: e.target.value }
              })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editDialog.zone?.description || ''}
              onChange={(e) => setEditDialog({
                ...editDialog,
                zone: { ...editDialog.zone, description: e.target.value }
              })}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              select
              label="Type"
              value={editDialog.zone?.type || 'circle'}
              onChange={(e) => setEditDialog({
                ...editDialog,
                zone: { ...editDialog.zone, type: e.target.value }
              })}
              margin="normal"
            >
              <MenuItem value="circle">Cercle</MenuItem>
              <MenuItem value="polygon">Polygone</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, zone: null })}>
            Annuler
          </Button>
          <Button onClick={handleEdit} color="primary" variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ZonesListPage;