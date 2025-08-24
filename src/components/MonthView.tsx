import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getUSDToUAHRate, formatUAH } from '../utils/currency';
import './MonthView.scss';

interface Earning {
  id: string;
  amount: number;
  currency: 'USD' | 'UAH';
  task: string;
  date: Date;
}

const months = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

const MonthView: React.FC = () => {
  const { monthNumber } = useParams<{ monthNumber: string }>();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'UAH'>('USD');
  const [task, setTask] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [usdRate, setUsdRate] = useState<number>(41.0);
  const [totalInUAH, setTotalInUAH] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<'USD' | 'UAH'>('USD');
  const [editTask, setEditTask] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showEditMode, setShowEditMode] = useState(false);

  const monthName = months[parseInt(monthNumber!) - 1];

  // Завантажуємо курс валют при ініціалізації
  useEffect(() => {
    const loadCurrencyRate = async () => {
      const rate = await getUSDToUAHRate();
      setUsdRate(rate);
    };
    loadCurrencyRate();
  }, []);

  // Ініціалізуємо selectedDate поточною датою при завантаженні компонента
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = parseInt(monthNumber!) - 1;
      const day = today.getDate();
      
      // Перевіряємо, чи поточний день належить до вибраного місяця
      const currentMonth = today.getMonth();
      if (currentMonth === month) {
        setSelectedDate(`${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
      } else {
        // Якщо не поточний місяць, встановлюємо перший день місяця
        setSelectedDate(`${year}-${(month + 1).toString().padStart(2, '0')}-01`);
      }
    }
  }, [monthNumber, selectedDate]);

  useEffect(() => {
    const loadEarnings = async () => {
      if (!auth.currentUser || !monthNumber) return;

      try {
        const year = new Date().getFullYear();
        const month = parseInt(monthNumber) - 1; // Конвертуємо в JS формат (0-11)
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Останній день поточного місяця

        const q = query(
          collection(db, 'earnings'),
          where('userId', '==', auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const earningsData: Earning[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const earningDate = data.date.toDate();
          
          if (earningDate >= startDate && earningDate <= endDate) {
            earningsData.push({
              id: doc.id,
              amount: data.amount,
              currency: data.currency,
              task: data.task,
              date: earningDate
            });
          }
        });

        earningsData.sort((a, b) => b.date.getTime() - a.date.getTime());
        setEarnings(earningsData);
      } catch (error) {
        console.error('Помилка завантаження заробітків:', error);
      }
    };
    
    loadEarnings();
  }, [monthNumber, monthName]);

  // Обчислюємо загальну суму в гривнях при зміні заробітків або курсу
  useEffect(() => {
    const calculateTotal = async () => {
      let total = 0;
      
      for (const earning of earnings) {
        if (earning.currency === 'USD') {
          total += earning.amount * usdRate;
        } else {
          total += earning.amount;
        }
      }
      
      setTotalInUAH(total);
    };
    
    calculateTotal();
  }, [earnings, usdRate]);

  const fetchEarnings = async () => {
    if (!auth.currentUser || !monthNumber) return;

    try {
      const year = new Date().getFullYear();
      const month = parseInt(monthNumber) - 1; // Конвертуємо в JS формат (0-11)
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Останній день поточного місяця

      // Спрощений запит тільки з userId
      const q = query(
        collection(db, 'earnings'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const earningsData: Earning[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const earningDate = data.date.toDate();
        
        // Фільтруємо локально по датах
        if (earningDate >= startDate && earningDate <= endDate) {
          earningsData.push({
            id: doc.id,
            amount: data.amount,
            currency: data.currency,
            task: data.task,
            date: earningDate
          });
        }
      });

      // Сортуємо локально по даті (спочатку найновіші)
      earningsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setEarnings(earningsData);
    } catch (error) {
      console.error('Помилка завантаження заробітків:', error);
    }
  };

  const handleAddEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !task || !selectedDate) return;

    setLoading(true);
    
    // Створюємо дату з вибраної дати
    const earningDate = new Date(selectedDate);
    
    const tempEarning: Earning = {
      id: `temp-${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      task,
      date: earningDate
    };

    setEarnings(prev => [tempEarning, ...prev]);

    try {
      await addDoc(collection(db, 'earnings'), {
        userId: auth.currentUser.uid,
        amount: parseFloat(amount),
        currency,
        task,
        date: earningDate
      });

      setAmount('');
      setTask('');
      // Залишаємо selectedDate як є, щоб користувач міг додати ще записи на ту ж дату
      await fetchEarnings();
    } catch (error) {
      console.error('Помилка додавання заробітку:', error);
      setEarnings(prev => prev.filter(e => e.id !== tempEarning.id));
    } finally {
      setLoading(false);
    }
  };

  const handleEditEarning = async (id: string) => {
    if (!auth.currentUser || !editAmount || !editTask) return;

    try {
      setLoading(true);
      const earningRef = doc(db, 'earnings', id);
      
      const updatedDate = new Date(editDate);
      
      await updateDoc(earningRef, {
        amount: parseFloat(editAmount),
        currency: editCurrency,
        task: editTask,
        date: updatedDate,
      });

      // Оновлюємо локальний стан
      setEarnings(earnings.map(earning => 
        earning.id === id 
          ? { 
              ...earning, 
              amount: parseFloat(editAmount), 
              currency: editCurrency, 
              task: editTask, 
              date: updatedDate 
            }
          : earning
      ));

      // Очищаємо стан редагування
      setEditingId(null);
      setEditAmount('');
      setEditCurrency('USD');
      setEditTask('');
      setEditDate('');
    } catch (error) {
      console.error('Помилка оновлення запису:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEarning = async (id: string) => {
    if (!auth.currentUser || !window.confirm('Ви впевнені, що хочете видалити цей запис?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'earnings', id));

      // Оновлюємо локальний стан
      setEarnings(earnings.filter(earning => earning.id !== id));
    } catch (error) {
      console.error('Помилка видалення запису:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (earning: Earning) => {
    setEditingId(earning.id);
    setEditAmount(earning.amount.toString());
    setEditCurrency(earning.currency);
    setEditTask(earning.task);
    setEditDate(earning.date.toISOString().split('T')[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditCurrency('USD');
    setEditTask('');
    setEditDate('');
  };

  const toggleEditMode = () => {
    setShowEditMode(!showEditMode);
    if (editingId) {
      cancelEdit();
    }
  };

  const usdTotal = earnings
    .filter(e => e.currency === 'USD')
    .reduce((total, earning) => total + earning.amount, 0);

  const uahTotal = earnings
    .filter(e => e.currency === 'UAH')
    .reduce((total, earning) => total + earning.amount, 0);

  // Обчислюємо мінімальну та максимальну дати для поточного місяця
  const year = new Date().getFullYear();
  const month = parseInt(monthNumber!) - 1;
  const minDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
  const maxDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date(year, month + 1, 0).getDate().toString().padStart(2, '0')}`;

  return (
    <div className="month-view">
      <header className="month-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Назад
        </button>
        <h1>{monthName} {new Date().getFullYear()}</h1>
      </header>

      <div className="earnings-summary">
        <div className="summary-card">
          <h3>Загальний заробіток</h3>
          <div className="totals">
            <div className="total-item main-total">
              <span className="currency">Загалом:</span>
              <span className="amount">{formatUAH(totalInUAH)}</span>
            </div>
            <div className="breakdown">
              <div className="breakdown-item">
                <span>USD: ${usdTotal.toFixed(2)} (₴{(usdTotal * usdRate).toFixed(2)})</span>
              </div>
              <div className="breakdown-item">
                <span>UAH: ₴{uahTotal.toFixed(2)}</span>
              </div>
              <div className="rate-info">
                <span>Курс: $1 = ₴{usdRate.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="add-earning-form">
        <h3>Додати новий заробіток</h3>
        <form onSubmit={handleAddEarning}>
          <div className="form-row">
            <div className="form-group">
              <input
                type="number"
                step="0.01"
                placeholder="Сума"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'UAH')}
              >
                <option value="USD">USD ($)</option>
                <option value="UAH">UAH (₴)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Назва завдання:</label>
              <input
                type="text"
                placeholder="Назва завдання"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Дата:</label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="add-btn">
            {loading ? 'Додавання...' : 'Додати заробіток'}
          </button>
        </form>
      </div>

      <div className="earnings-list">
        <div className="earnings-list-header">
          <h3>Історія заробітків</h3>
          {earnings.length > 0 && (
            <button 
              type="button" 
              onClick={toggleEditMode}
              className={`edit-mode-btn ${showEditMode ? 'active' : ''}`}
              disabled={loading}
            >
              {showEditMode ? '✖️ Скасувати' : '⚙️ Редагувати'}
            </button>
          )}
        </div>
        {earnings.length === 0 ? (
          <p className="no-earnings">Поки що немає заробітків за цей місяць</p>
        ) : (
          <div className="earnings-items">
            {earnings.map((earning) => (
              <div 
                key={earning.id} 
                className={`earning-item ${earning.id.startsWith('temp-') ? 'temp-earning' : ''}`}
              >
                {editingId === earning.id ? (
                  // Режим редагування
                  <div className="edit-earning-form">
                    <div className="edit-form-row">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Сума"
                        step="0.01"
                        min="0"
                        className="edit-amount-input"
                      />
                      <select 
                        value={editCurrency} 
                        onChange={(e) => setEditCurrency(e.target.value as 'USD' | 'UAH')}
                        className="edit-currency-select"
                      >
                        <option value="USD">USD</option>
                        <option value="UAH">UAH</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editTask}
                      onChange={(e) => setEditTask(e.target.value)}
                      placeholder="Опис завдання"
                      className="edit-task-input"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="edit-date-input"
                    />
                    <div className="edit-buttons">
                      <button 
                        type="button" 
                        onClick={() => handleEditEarning(earning.id)}
                        disabled={loading || !editAmount || !editTask}
                        className="save-btn"
                      >
                        {loading ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelEdit}
                        className="cancel-btn"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  // Режим перегляду
                  <>
                    <div className="earning-content">
                      <div className="earning-info">
                        <h4>{earning.task}</h4>
                        <p className="earning-date">
                          {earning.date.toLocaleDateString('uk-UA')}
                          {earning.id.startsWith('temp-') && (
                            <span className="sync-indicator"> • синхронізація...</span>
                          )}
                        </p>
                      </div>
                      <div className="earning-amount">
                        <div className="primary-amount">
                          {earning.currency === 'USD' ? '$' : '₴'}{earning.amount.toFixed(2)}
                        </div>
                        {earning.currency === 'USD' && (
                          <div className="converted-amount">
                            ≈ ₴{(earning.amount * usdRate).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    {!earning.id.startsWith('temp-') && showEditMode && (
                      <div className="earning-actions">
                        <button 
                          type="button" 
                          onClick={() => startEdit(earning)}
                          className="edit-btn"
                          disabled={loading}
                        >
                          ✏️ Змінити
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteEarning(earning.id)}
                          className="delete-btn"
                          disabled={loading}
                        >
                          🗑️ Видалити
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthView;
