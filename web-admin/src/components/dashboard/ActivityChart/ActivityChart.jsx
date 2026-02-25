import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../api/firebase';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const ActivityChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // GÃ©nÃ©rer les 7 derniers jours
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: startOfDay(date),
        label: format(date, 'EEE', { locale: fr }),
        fullDate: format(date, 'dd/MM'),
        entries: 0,
        exits: 0,
      };
    });

    const q = query(
      collection(db, 'geofence_logs'),
      where('timestamp', '>=', days[0].date)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = [...days];

      snapshot.docs.forEach((doc) => {
        const event = doc.data();
        const eventDate = event.timestamp?.toDate?.();
        
        if (eventDate) {
          const dayIndex = newData.findIndex(
            (d) => format(d.date, 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd')
          );
          
          if (dayIndex !== -1) {
            if (event.type === 'ZONE_ENTRY') {
              newData[dayIndex].entries++;
            } else if (event.type === 'ZONE_EXIT') {
              newData[dayIndex].exits++;
            }
          }
        }
      });

      setData(newData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="fullDate" />
        <YAxis />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: 8 }}
          labelStyle={{ color: '#666' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="entries"
          name="EntrÃ©es"
          stroke="#4CAF50"
          activeDot={{ r: 8 }}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="exits"
          name="Sorties"
          stroke="#F44336"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ActivityChart;
