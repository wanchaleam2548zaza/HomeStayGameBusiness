// src/logic/gameLogic.js
export const GAME_CONF = {
  INITIAL_MONEY: 5000,
  BASE_TRUCK_COST: 2000,
  COST_EXPONENT: 1.3,
  MAINTENANCE_PER_UNIT: 15,
  WAGE_PER_STAFF: 10,
  TICK_RATE: 500, // ms (ใช้สำหรับของอื่น ไม่ใช่รายได้)
  INCOME_CYCLE_MS: 120000, // 2 นาที
  TAX_RATE: 0.10, // 10%
};

// รายได้พื้นฐานต่อรอบ 2 นาที แยกตามประเภทธุรกิจ
const BASE_REVENUE_PER_CYCLE = {
  homestay: 8000,
  logistics: 12000,
  cafe: 9000,
  tech: 14000,
  farm: 6500
};

// ค่าบำรุงรักษาแยกตามประเภทธุรกิจ (ต่อรอบ)
const BASE_MAINTENANCE = {
  homestay: 12,
  logistics: 20,
  cafe: 15,
  tech: 35,
  farm: 10
};

// เงินเดือนพนักงานต่อหน่วยธุรกิจ ต่อรอบ
const SALARY_PER_UNIT = {
  homestay: 1200,
  logistics: 1800,
  cafe: 1000,
  tech: 2500,
  farm: 800
};

export const calculateRevenue = (businessType, fleetSize, reputation, multiplier) => {
  const base = BASE_REVENUE_PER_CYCLE[businessType] || 8000;
  const revenuePerUnit = base * (reputation / 10) * multiplier;
  return fleetSize * revenuePerUnit;
};

export const calculateExpense = (businessType, fleetSize, staffCount) => {
  const maintenance = BASE_MAINTENANCE[businessType] || GAME_CONF.MAINTENANCE_PER_UNIT;
  return (fleetSize * maintenance) + (staffCount * GAME_CONF.WAGE_PER_STAFF);
};

// คำนวณรายได้ต่อรอบ 2 นาที พร้อมหักภาษีและเงินเดือน
export const calculateCycleIncome = (businessType, fleetSize, reputation, eventMultiplier, titleIncomeBonus = 0, titleSalaryBonus = 0) => {
  const base = BASE_REVENUE_PER_CYCLE[businessType] || 8000;
  const bonusMultiplier = 1 + (titleIncomeBonus / 100);
  const grossRevenue = Math.floor(fleetSize * base * (reputation / 10) * eventMultiplier * bonusMultiplier);
  const tax = Math.floor(grossRevenue * GAME_CONF.TAX_RATE);
  const baseSalary = Math.floor((SALARY_PER_UNIT[businessType] || 1200) * fleetSize);
  const salaryMultiplier = 1 + (titleSalaryBonus / 100); // salaryBonus เป็นลบ = ลดเงินเดือน
  const salary = Math.max(0, Math.floor(baseSalary * salaryMultiplier));
  const netIncome = grossRevenue - tax - salary;
  return { grossRevenue, tax, salary, netIncome };
};

export const getUpgradeCost = (fleetSize) => {
  return Math.floor(GAME_CONF.BASE_TRUCK_COST * Math.pow(GAME_CONF.COST_EXPONENT, fleetSize));
};