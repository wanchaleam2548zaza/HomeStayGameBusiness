// src/logic/gameLogic.js
export const GAME_CONF = {
  INITIAL_MONEY: 5000,
  BASE_TRUCK_COST: 2000,
  COST_EXPONENT: 1.3,
  MAINTENANCE_PER_UNIT: 15,
  WAGE_PER_STAFF: 10,
  TICK_RATE: 100, // ms
};

// รายได้พื้นฐานแยกตามประเภทธุรกิจ
const BASE_REVENUE = {
  homestay: 45,
  logistics: 65,
  cafe: 50,
  tech: 80,
  farm: 40
};

// ค่าบำรุงรักษาแยกตามประเภทธุรกิจ
const BASE_MAINTENANCE = {
  homestay: 12,
  logistics: 20,
  cafe: 15,
  tech: 35,
  farm: 10
};

export const calculateRevenue = (businessType, fleetSize, reputation, multiplier) => {
  const base = BASE_REVENUE[businessType] || 50;
  const revenuePerUnit = base * (reputation / 10) * multiplier;
  return fleetSize * revenuePerUnit;
};

export const calculateExpense = (businessType, fleetSize, staffCount) => {
  const maintenance = BASE_MAINTENANCE[businessType] || GAME_CONF.MAINTENANCE_PER_UNIT;
  return (fleetSize * maintenance) + (staffCount * GAME_CONF.WAGE_PER_STAFF);
};

export const getUpgradeCost = (fleetSize) => {
  return Math.floor(GAME_CONF.BASE_TRUCK_COST * Math.pow(GAME_CONF.COST_EXPONENT, fleetSize));
};