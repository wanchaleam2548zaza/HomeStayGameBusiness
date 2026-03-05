// รายชื่อหุ้นและคริปโตเริ่มต้น
export const INITIAL_STOCKS = [
  { symbol: 'BTC', name: 'Digital Gold (Crypto)', basePrice: 45000, volatility: 0.08 }, // สวิงแรงสุด 8%
  { symbol: 'CLSK', name: 'Clean Energy Tech', basePrice: 1500, volatility: 0.06 },
  { symbol: 'TECH', name: 'Future AI Corp', basePrice: 3500, volatility: 0.04 },
  { symbol: 'PROP', name: 'Global Estate Trust', basePrice: 800, volatility: 0.02 } // สวิงน้อยสุด 2%
];

// ฟังก์ชันสุ่มราคาหุ้นให้ขยับขึ้นลง
export const updateStockPrices = (currentStocks) => {
  return currentStocks.map(stock => {
    // สุ่ม % การเปลี่ยนแปลงตามความผันผวน (volatility) ของหุ้นตัวนั้น
    const changePercent = (Math.random() * (stock.volatility * 2)) - stock.volatility;
    let newPrice = stock.price * (1 + changePercent);

    // ป้องกันราคาติดลบหรือเหลือ 0
    newPrice = Math.max(10, Math.floor(newPrice));

    return {
      ...stock,
      prevPrice: stock.price,
      price: newPrice,
      // เพิ่มข้อมูลจำลองสำหรับหุ้นระบบ
      marketCap: newPrice * 50000,
      netProfit: Math.floor(newPrice * (Math.random() * 0.5 + 0.1)),
      health: newPrice > stock.basePrice * 1.2 ? "ดีเยี่ยม" : (newPrice < stock.basePrice * 0.8 ? "เสี่ยง" : "ปกติ"),
      dividend: Math.floor(newPrice * 0.02)
    };
  });
};