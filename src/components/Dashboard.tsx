import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  useEffect(() => {
    const fetchTotal = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(
          collection(db, 'earnings'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        let sum = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          sum += Number(data.amount) || 0;
        });
        setTotalEarnings(sum);
      } catch (err) {
        setTotalEarnings(0);
        console.error('Помилка отримання даних:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotal();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Помилка виходу:', error);
    }
  };

  const handleMonthClick = (monthIndex: number) => {
    navigate(`/month/${monthIndex + 1}`);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Мій заробіток</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Вийти
        </button>
      </header>

      <div className="total-earnings-card">
        <h2>Загальний заробіток за весь час</h2>
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <p className="primary-amount">${totalEarnings.toFixed(2)}</p>
        )}
      </div>

      <div className="months-grid">
        {months.map((month, index) => (
          <div
            key={index}
            className="month-card"
            onClick={() => handleMonthClick(index)}
          >
            <h3>{month}</h3>
            <p>{new Date().getFullYear()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
