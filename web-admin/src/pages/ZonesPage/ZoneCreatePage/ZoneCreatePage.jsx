import React from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import MapEditor from '../../../components/zones/ZoneEditor/MapEditor';

const ZoneCreatePage = () => {
  const navigate = useNavigate();

  const handleSave = async (zoneData) => {
    try {
      await addDoc(collection(db, 'zones'), {
        ...zoneData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin' // Ã€ remplacer par l'UID rÃ©el
      });
      
      navigate('/zones');
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Erreur lors de la crÃ©ation de la zone');
    }
  };

  return <MapEditor onSave={handleSave} />;
};

export default ZoneCreatePage;
