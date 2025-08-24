// Функція для отримання актуального курсу USD до UAH
export const getUSDToUAHRate = async (): Promise<number> => {
  try {
    // Використовуємо API НБУ для отримання курсу
    const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json');
    const data = await response.json();
    
    if (data && data.length > 0) {
      return data[0].rate;
    }
    
    // Якщо API недоступне, повертаємо приблизний курс
    return 41.0;
  } catch (error) {
    console.error('Помилка отримання курсу валют:', error);
    // Fallback курс
    return 41.0;
  }
};

// Функція для конвертації USD в UAH
export const convertUSDToUAH = async (usdAmount: number): Promise<number> => {
  const rate = await getUSDToUAHRate();
  return usdAmount * rate;
};

// Функція для форматування суми в гривнях
export const formatUAH = (amount: number): string => {
  return `₴${amount.toFixed(2)}`;
};
