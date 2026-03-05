import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { db } from './firebase';
import { ref, update, get, serverTimestamp, remove, onValue } from "firebase/database";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { GAME_CONF, calculateRevenue, calculateExpense, getUpgradeCost, calculateCycleIncome } from './logic/gameLogic';

import { BUSINESS_TYPES, getSynchronizedEvent } from './config/eventsData';
import InteractiveNews from './components/InteractiveNews';
import Leaderboard from './components/Leaderboard';
import { INITIAL_STOCKS, updateStockPrices } from './config/stockData';
import StockMarket from './components/StockMarket';
import InfoModal from './components/InfoModal';
import AuctionHouse from './components/AuctionHouse';
import { TITLES, getSynchronizedAuctionItem } from './config/auctionData';
import UpdateLogModal from './components/UpdateLogModal';
import AdminDashboard from './components/AdminDashboard';
import IncomeModal from './components/IncomeModal';

// วางต่อจาก import ต่างๆ
const getDeviceId = () => {
  let deviceId = localStorage.getItem('game_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('game_device_id', deviceId);
  }
  return deviceId;
};
const DEVICE_ID = getDeviceId();

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: 'rgba(10, 15, 30, 0.85)', border: `1px solid ${data.isLoss ? 'rgba(255, 71, 87, 0.5)' : 'rgba(0, 225, 255, 0.3)'}`, borderRadius: '12px', padding: '12px 15px' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 5px 0', fontSize: '0.8rem' }}>เวลา: {data.time}</p>
        <p style={{ color: data.isLoss ? '#ff4757' : '#00E1FF', margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>฿{data.value.toLocaleString()}</p>
        {data.reason && <p style={{ color: '#ff4757', fontSize: '0.85rem', marginTop: '8px' }}>🔻 {data.reason}</p>}
      </div>
    );
  }
  return null;
};
const CustomDot = (props) => (props.payload.isLoss ? <circle cx={props.cx} cy={props.cy} r={5} fill="#ff4757" stroke="#fff" strokeWidth={2} /> : null);

const BusinessChart = ({ data }) => (
  <div style={{ width: '100%', flex: 1, minHeight: 0, minWidth: 0 }}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="waterWave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E1FF" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0055FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" hide />
        <YAxis domain={['dataMin - 100', 'auto']} hide />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="value" stroke="#00E1FF" strokeWidth={3} fillOpacity={1} fill="url(#waterWave)" dot={<CustomDot />} activeDot={{ r: 6, fill: '#fff', stroke: '#00E1FF', strokeWidth: 2 }} isAnimationActive={false} />
        <Brush dataKey="time" height={25} stroke="rgba(0, 225, 255, 0.4)" fill="rgba(0,0,0,0.6)" travellerWidth={12} tickFormatter={() => ''} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

function App() {
  const [username, setUsername] = useState(localStorage.getItem('homestay_user') || "");
  const [displayName, setDisplayName] = useState("");
  const [businessType, setBusinessType] = useState("homestay");
  const [authStep, setAuthStep] = useState("loading");
  const [inputValue, setInputValue] = useState("");
  const [playerIP, setPlayerIP] = useState("Loading...");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [money, setMoney] = useState(GAME_CONF.INITIAL_MONEY);
  const [fleetSize, setFleetSize] = useState(1);
  const [reputation, setReputation] = useState(10);
  const [brandHype, setBrandHype] = useState(100); // เริ่มต้นที่ 100%
  const [currentEvent, setCurrentEvent] = useState({ msg: "ระบบพร้อมทำงาน...", multiplier: 1 });
  const [logs, setLogs] = useState(["เริ่มต้นกิจการของคุณ!"]);
  const [chartData, setChartData] = useState([]);

  const [competitors, setCompetitors] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [myRank, setMyRank] = useState("-");

  const [sysStocks, setSysStocks] = useState([]); // เริ่มเป็นค่าว่างเพื่อรอข้อมูลจริงจาก Firebase
  const [globalStocks, setGlobalStocks] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [showStockMarket, setShowStockMarket] = useState(false);

  const [isIPO, setIsIPO] = useState(false);
  const [infoPopup, setInfoPopup] = useState({ show: false, title: '', content: '' });

  const [inventory, setInventory] = useState([]);
  const [activeTitle, setActiveTitle] = useState(null);
  const [showAuction, setShowAuction] = useState(false);
  const [auctionItem, setAuctionItem] = useState(() => getSynchronizedAuctionItem(Math.floor(Date.now() / 100000)));
  const [currentBucketState, setCurrentBucketState] = useState(0);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState(0);
  const [isAuctionPhase, setIsAuctionPhase] = useState(false);
  const [conflictUser, setConflictUser] = useState(null);
  const [showIPWarning, setShowIPWarning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [debt, setDebt] = useState(0);
  const [baseLoanLimit] = useState(1000000);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [pendingIncome, setPendingIncome] = useState(null);
  const [incomeCycleSeconds, setIncomeCycleSeconds] = useState(120);
  const [upcomingIncome, setUpcomingIncome] = useState(null); // บอกผู้เล่นล่วงหน้าว่าสิ งต้องจ่าย

  const showBusinessInfo = (type) => {
    const b = BUSINESS_TYPES[type];
    setInfoPopup({
      show: true,
      title: `${b.icon} ข้อมูลธุรกิจ: ${b.name}`,
      content: `📝 รายละเอียด: ${b.desc}\n\n⚠️ เหตุการณ์เสี่ยง: ${b.risks}\n\n📉 ความสูญเสียสูงสุด: ${b.maxLoss}`
    });
  };

  const moneyRef = useRef(GAME_CONF.INITIAL_MONEY);
  const debtRef = useRef(0);
  const stateRef = useRef({ fleetSize, reputation, brandHype, currentEvent, logs, businessType, portfolio, isIPO, displayName, inventory, activeTitle, debt });
  const lastStockPriceRef = useRef(0);
  const lastEventBucket = useRef(parseInt(localStorage.getItem('homestay_last_bucket_v2')) || 0);
  const lastExpandTime = useRef(Date.now());
  const auctionProcessedRef = useRef(null); // เก็บ bucket ที่ประมวลผลรางวัลไปแล้ว (กัน double reward)
  const isDeletedRef = useRef(false); // 🛡️ ตรวจจับว่าผู้ใช้นี้โดนลบไปแล้ว เพื่อหยุดการ sync ทันที
  const hasOpenedAuctionRef = useRef(false); // ตรวจสอบว่าประมูลรอบนี้ popup ขึ้นไปแล้วหรือยัง

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setPlayerIP(d.ip))
      .catch(() => setPlayerIP("127.0.0.1"));
  }, []);

  const titleBonus = activeTitle && TITLES[activeTitle] ? TITLES[activeTitle] : { hypeBonus: 0, repBonus: 0, incomeBonus: 0, loanBonus: 0, stockBonus: 1 };
  const loanLimit = baseLoanLimit + (titleBonus.loanBonus || 0); // ✨ ฉายาเพิ่มวงเงินกู้
  const baseNetProfit = calculateRevenue(businessType, fleetSize, reputation + titleBonus.repBonus, currentEvent.multiplier || 1) - calculateExpense(businessType, fleetSize, 0);
  // ✨ ฉายาเพิ่ม incomeBonus% ให้กับรายได้สุทธิ
  const netProfit = baseNetProfit * (1 + (titleBonus.incomeBonus || 0));

  useEffect(() => {
    stateRef.current = {
      fleetSize, reputation, brandHype, currentEvent, logs,
      businessType, portfolio, isIPO, displayName,
      inventory, activeTitle, debt
    };
    debtRef.current = debt;
  }, [fleetSize, reputation, brandHype, currentEvent, logs, businessType, portfolio, isIPO, displayName, inventory, activeTitle, debt]);

  // 🟢 แก้ไข syncDatabase: ห้ามล้างค่า multiplier ทิ้งถ้ายังไม่จบช่วงวิกฤต
  const syncDatabase = async (forceMoney = null) => {
    // 🛡️ หากผู้เล่นไม่ได้เข้าสู่ระบบ หรือ ถูกลบไปแล้ว (isDeletedRef) ระบบจะไม่พยายามบันทึกข้อมูลใดๆ กู้ชีพข้อมูลเก่า
    if (!username || isDeletedRef.current === true) return;
    const now = Date.now();
    const moneyToSave = forceMoney !== null ? forceMoney : moneyRef.current;

    // กรอง Event ก่อนเซฟ: ถ้าเป็นช่วงเลือกตัวเลือก ให้เซฟสถานะ "ติดโทษ" ไว้แทน
    let eventToSave = stateRef.current.currentEvent;
    if (eventToSave?.choices) {
      eventToSave = {
        msg: "🚨 กำลังเผชิญวิกฤต (ห้ามหนี!)",
        multiplier: eventToSave.timeoutPenalty.effectMulti
      };
    }

    try {
      await update(ref(db, `users/${username}`), {
        money: Math.floor(moneyToSave),
        fleetSize: stateRef.current.fleetSize,
        reputation: stateRef.current.reputation,
        brandHype: stateRef.current.brandHype,
        currentEvent: eventToSave,
        logs: stateRef.current.logs,
        businessType: stateRef.current.businessType,
        portfolio: stateRef.current.portfolio,
        isIPO: stateRef.current.isIPO,
        displayName: stateRef.current.displayName || "",
        // ดึงจาก stateRef เท่านั้นเพื่อป้องกันฉายาหาย
        inventory: stateRef.current.inventory || [],
        activeTitle: stateRef.current.activeTitle || null,
        debt: stateRef.current.debt || 0,
        serverTime: serverTimestamp()
      });

      if (stateRef.current.isIPO) {
        const cashValue = (moneyRef.current / 1000);
        const rawStockPrice = Math.max(10, Math.floor(
          ((netProfit * 10) + (stateRef.current.fleetSize * 50) + cashValue) * (stateRef.current.brandHype / 100)
        ));

        // 🛡️ ดึง ipoPrice จาก DB ถ้ายังไม่มีก็บันทึกครั้งแรก
        const existingSnap = await get(ref(db, `global_stocks/${username}/ipoPrice`));
        const ipoPrice = existingSnap.exists() ? existingSnap.val() : rawStockPrice;

        // 🛡️ Cap ราคา: ไม่ให้เกิน 3x ของ ipoPrice (กัน pump)
        const currentStockPrice = Math.min(rawStockPrice, ipoPrice * 3);

        const prevPrice = lastStockPriceRef.current || currentStockPrice;

        // 🛡️ สร้าง Symbol จาก DisplayName แทน Username เพื่อความปลอดภัย
        let safeSymbol = stateRef.current.displayName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        while (safeSymbol.length < 4) safeSymbol += 'X'; // เติม X ให้ครบ 4 ตัวถ้าชื่อสั้นหรือมีแต่อักขระพิเศษ

        await update(ref(db, `global_stocks/${username}`), {
          symbol: safeSymbol,
          name: `${stateRef.current.displayName} Corp`,
          price: currentStockPrice,
          prevPrice: prevPrice,
          owner: username,
          isPlayer: true,
          ipoPrice: ipoPrice,           // 🛡️ บันทึกราคา IPO ไว้เป็น reference
          marketCap: currentStockPrice * 10000,
          netProfit: Math.floor(netProfit),
          health: reputation > 50 ? "ดีเยี่ยม" : (reputation > 20 ? "ปกติ" : "เสี่ยง"),
          dividend: Math.floor(netProfit * 0.05)
        });
        lastStockPriceRef.current = currentStockPrice;
      }
    } catch (err) { }
  };

  const loadPlayerData = async (userLogin) => {
    try {
      const snap = await get(ref(db, `users/${userLogin}`));
      if (snap.exists()) {
        const data = snap.val();
        moneyRef.current = Math.floor(Number(data.money)) || GAME_CONF.INITIAL_MONEY;
        setMoney(moneyRef.current);
        setFleetSize(data.fleetSize || 1);
        setReputation(data.reputation || 10);
        setBrandHype(data.brandHype || 100);
        const currentBusiness = data.businessType || "homestay";
        setBusinessType(currentBusiness);
        if (data.portfolio) setPortfolio(data.portfolio);
        if (data.isIPO) setIsIPO(data.isIPO);
        if (data.inventory && Array.isArray(data.inventory)) {
          setInventory(data.inventory);
        } else {
          // If no array data, default it to empty array.
          setInventory([]);
        }
        if (data.activeTitle) setActiveTitle(data.activeTitle);
        if (data.debt) {
          setDebt(data.debt);
          debtRef.current = data.debt;
        }

        // 🟢 เพิ่มโค้ดส่วนนี้: เช็คว่าถ้าเข้าตลาดหุ้นแล้ว ให้ดึงราคาล่าสุดมาเก็บไว้ใน Ref เพื่อกันเปอเซ็นต์การขึ้นลงบัค
        if (data.isIPO) {
          const stockSnap = await get(ref(db, `global_stocks/${userLogin}`));
          if (stockSnap.exists()) {
            lastStockPriceRef.current = stockSnap.val().price; // ฟื้นฟูราคาหุ้นเดิม
          }
        }

        // 🚨 ระบบตรวจตราบาป: เช็คทั้ง Local และ Server
        const pendingKey = `homestay_pending_${userLogin}`;
        const localPenalty = localStorage.getItem(pendingKey);
        const serverPenalty = data.pendingPenalty;
        const penalty = localPenalty ? JSON.parse(localPenalty) : serverPenalty;

        if (penalty) {
          localStorage.removeItem(pendingKey);
          await update(ref(db, `users/${userLogin}`), { pendingPenalty: null });

          // บังคับติดลบกำไรทันที
          const penaltyEvent = { msg: "⚠️ คุณพยายามหนีวิกฤต! โดนสั่งปรับย้อนหลัง", multiplier: penalty.effectMulti };
          setCurrentEvent(penaltyEvent);
          setLogs([`💥 บทลงโทษย้อนหลัง: ${penalty.logMsg}`, ...(data.logs || [])].slice(0, 15));
        } else {
          // ถ้าไม่มีโทษ ให้โหลด Event ปกติ (แต่ถ้าใน DB เป็นอันที่ติด choices มา ให้ล้างทิ้ง)
          if (data.currentEvent && !data.currentEvent.choices) {
            setCurrentEvent(data.currentEvent);
          } else {
            setCurrentEvent({ msg: "ระบบพร้อมทำงาน...", multiplier: 1 });
          }
          if (data.logs) setLogs(data.logs);
        }

        if (data.displayName) {
          setDisplayName(data.displayName);
          setAuthStep("game");
        } else setAuthStep("setup_name");
      } else setAuthStep("setup_name");
    } catch (err) { setAuthStep("login"); }
  };

  const fetchGlobalMarket = () => {
    if (authStep !== "game") return;

    // Listen to Player Stocks
    const globalRef = ref(db, 'global_stocks');
    onValue(globalRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        // 🛡️ กรองเฉพาะหุ้นที่เป็นของ Player และมีข้อมูลจริง (ไม่เอา placeholder หรือข้อมูลที่ถูก null/ลบทิ้งไปแล้ว)
        const playerStocks = Object.keys(data)
          .filter(key => data[key] && data[key].isPlayer === true)
          .map(key => data[key]);
        setGlobalStocks(playerStocks);
      } else {
        setGlobalStocks([]); // กรณีโดนล้างเซิร์ฟเวอร์
      }
    });

    // Listen to System Stocks
    const sysRef = ref(db, 'global_market/sys_stocks');
    onValue(sysRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSysStocks(data.stocks);
      }
    });
  };

  const syncSystemStocks = async () => {
    if (authStep !== "game") return;
    try {
      const sysRef = ref(db, 'global_market/sys_stocks');
      const snap = await get(sysRef);
      const now = Date.now();

      if (snap.exists()) {
        const data = snap.val();
        // ถ้ามีการอัปเดตไปแล้วไม่เกิน 5 วินาที ไม่ต้องทำอะไร
        if (now - (data.lastUpdate || 0) < 5000) return;

        // อัปเดตราคาทุกตัว
        const newStocks = updateStockPrices(data.stocks);
        await update(sysRef, {
          stocks: newStocks,
          lastUpdate: now
        });
      } else {
        // เริ่มต้นตลาดหุ้นระบบครั้งแรก
        const initial = INITIAL_STOCKS.map(s => ({ ...s, price: s.basePrice, prevPrice: s.basePrice }));
        await update(sysRef, {
          stocks: initial,
          lastUpdate: now
        });
      }
    } catch (err) { }
  };

  const fetchLeaderboard = async () => {
    if (authStep !== "game") return;
    try {
      const snap = await get(ref(db, 'users'));
      if (snap.exists()) {
        const data = snap.val();
        const usersArray = Object.keys(data)
          .filter(key => typeof data[key] === 'object' && data[key] !== null && (data[key].money !== undefined || data[key].displayName !== undefined))
          .map(key => {
            const user = data[key];
            return {
              username: key,
              displayName: user.displayName || user.playerName || key,
              money: user.money || 0,
              businessType: user.businessType || 'homestay',
              activeTitle: user.activeTitle || null
            };
          }).sort((a, b) => b.money - a.money);
        setCompetitors(usersArray);
        const rankIndex = usersArray.findIndex(u => u.username === username);
        setMyRank(rankIndex !== -1 ? rankIndex + 1 : "-");
      }
    } catch (err) { }
  };

  useEffect(() => {
    const saved = localStorage.getItem('homestay_user');
    if (saved) {
      localStorage.setItem('homestay_device_owner', saved);
      loadPlayerData(saved);
    } else { setAuthStep("login"); }
  }, []);

  const handleLogin = async () => {
    if (!inputValue.trim()) return;
    const inputUser = inputValue.trim().toLowerCase();

    // (ส่วนที่เช็ค Regex ชื่อผู้ใช้คงไว้เหมือนเดิม)

    setIsLoggingIn(true);
    try {
      const userRef = ref(db, `users/${inputUser}`);
      const snapshot = await get(userRef);
      const allUsersSnap = await get(ref(db, 'users'));
      const allUsers = allUsersSnap.val() || {};

      // --- แก้ไขจุดนี้: เปลี่ยนจากเช็ค IP มาเช็ค DEVICE_ID ---
      const duplicateUser = Object.keys(allUsers).find(key =>
        key !== inputUser && allUsers[key].deviceId === DEVICE_ID
      );

      if (duplicateUser && !snapshot.exists()) {
        setConflictUser({
          username: duplicateUser,
          displayName: allUsers[duplicateUser].displayName || duplicateUser
        });
        setShowIPWarning(true);
        setIsLoggingIn(false);
        return;
      }
      // --------------------------------------------------

      await proceedLogin(inputUser);
    } catch (err) {
      console.error("Login error:", err);
      setIsLoggingIn(false);
    }
  };

  // แยกฟังก์ชันล็อกอินออกมาเพื่อให้เรียกใช้ซ้ำได้
  const proceedLogin = async (userLogin) => {
    localStorage.setItem('homestay_device_owner', userLogin);
    localStorage.setItem('homestay_user', userLogin);
    setUsername(userLogin);
    setInputValue("");

    // อัปเดต DEVICE_ID และ IP ล่าสุดลงใน DB
    await update(ref(db, `users/${userLogin}`), {
      lastIP: playerIP,
      deviceId: DEVICE_ID,
      lastLogin: serverTimestamp()
    });

    if (userLogin === "homestaywann") {
      setAuthStep("game");
      setIsLoggingIn(false);
      return;
    }

    const snap = await get(ref(db, `users/${userLogin}`));
    if (snap.exists() && snap.val().displayName) {
      loadPlayerData(userLogin);
    } else {
      setAuthStep("setup_name");
    }
    setIsLoggingIn(false);
  };

  const handleDeleteAndSwitch = async () => {
    if (conflictUser) {
      try {
        // ลบข้อมูล Account เก่าทิ้งทันที
        await remove(ref(db, `users/${conflictUser.username}`));
        // ลบหุ้นของ Account เก่าด้วย (ถ้ามี)
        await remove(ref(db, `global_stocks/${conflictUser.username}`));

        const newUser = inputValue.trim().toLowerCase();
        setShowIPWarning(false);
        setConflictUser(null);

        // เข้าสู่ระบบด้วย Account ใหม่ทันที
        proceedLogin(newUser);
      } catch (err) {
        alert("ไม่สามารถลบบัญชีเก่าได้ กรุณาลองใหม่");
      }
    }
  };

  const handleSetDisplayName = async () => {
    const newDisplayName = inputValue.trim();
    if (!newDisplayName) return;

    // ตรวจสอบ: ห้าม Display Name เหมือน Username
    if (newDisplayName.toLowerCase() === username.toLowerCase()) {
      alert("ชื่อแสดงผลห้ามซ้ำกับชื่อผู้ใช้ (Username) กรุณาใช้ชื่ออื่น");
      return;
    }

    setIsLoggingIn(true);
    try {
      await update(ref(db, `users/${username}`), {
        displayName: newDisplayName,
        money: moneyRef.current,
        fleetSize: fleetSize,
        reputation: reputation,
        businessType: businessType,
        portfolio: portfolio,
        isIPO: isIPO,
        lastLogin: Date.now()
      });
      setDisplayName(newDisplayName);
      setAuthStep("game");
    } catch (err) {
      console.error("Error saving display name:", err);
      alert("❌ ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const LOAN_THRESHOLD = 10000; // กู้ได้เหมือนเงินต่ำกว่าจำนวนนี้เท่านั้น

  const takeLoan = (amount) => {
    if (moneyRef.current >= LOAN_THRESHOLD) {
      alert(`❌ ยังไม่มีสิทธิ์กู้เงิน! \nว4 สามารถกู้ได้เมื่อเงินสดต่ำกว่า ฿${LOAN_THRESHOLD.toLocaleString()} เท่านั้น\nไม่สามารถใช้เงินกู้เพื่อปั่นผลกำไรได้`);
      return;
    }
    if (debt + amount <= loanLimit) {
      moneyRef.current += amount;
      setMoney(Math.floor(moneyRef.current));
      setDebt(prev => prev + amount);
      setLogs(prev => [`🏦 กู้เงินสำเร็จ: +฿${amount.toLocaleString()} (หนี้รวม: ฿${(debt + amount).toLocaleString()})`, ...prev].slice(0, 15));
      syncDatabase(moneyRef.current);
    } else {
      alert("❌ วงเงินกู้ของคุณเต็มแล้ว!");
    }
  };

  const repayLoan = (amount) => {
    if (moneyRef.current >= amount && debt >= amount) {
      moneyRef.current -= amount;
      setMoney(Math.floor(moneyRef.current));
      setDebt(prev => prev - amount);
      setLogs(prev => [`✅ ชำระหนี้: -฿${amount.toLocaleString()} (หนี้เหลือ: ฿${(debt - amount).toLocaleString()})`, ...prev].slice(0, 15));
      syncDatabase(moneyRef.current);
    } else {
      alert("❌ เงินไม่พอ หรือระบุยอดชำระเกินหนี้ที่มีอยู่");
    }
  };

  const handleAcceptIncome = async () => {
    if (!pendingIncome) return;
    const { netIncome, grossRevenue, tax, salary, debtPayment } = pendingIncome;

    moneyRef.current += netIncome;
    setMoney(Math.floor(moneyRef.current));

    // หักหนี้ออกจากตัวแปรหนี้จริง
    if (debtPayment > 0) {
      debtRef.current -= debtPayment;
      setDebt(debtRef.current);
    }

    setShowIncomeModal(false);
    setPendingIncome(null);

    const logMsg = `💰 รับเงินงวด: +฿${grossRevenue.toLocaleString()} | ภาษี -฿${tax.toLocaleString()} | เงินเดือน -฿${salary.toLocaleString()}${debtPayment > 0 ? ` | คืนหนี้ -฿${debtPayment.toLocaleString()}` : ''} | สุทธิ ${netIncome >= 0 ? '+' : ''}฿${netIncome.toLocaleString()}`;
    setLogs(prev => [logMsg, ...prev].slice(0, 15));

    await syncDatabase(moneyRef.current);
  };

  const handleLogout = () => {
    localStorage.removeItem('homestay_user');
    window.location.reload();
  };

  const handleBankruptcy = async () => {
    if (!window.confirm("⚠️ ยืนยันการยื่นล้มละลาย? หนี้จะหายไปแต่กิจการจะถูกรีเซ็ตทั้งหมด!")) return;

    const startingMoney = 2000;
    moneyRef.current = startingMoney;
    setMoney(startingMoney);
    setDebt(0);
    debtRef.current = 0;
    setFleetSize(1);
    setReputation(5);
    setBrandHype(50);
    setIsIPO(false);

    // 🛡️ ล้างพอร์ตโฟลิโอทั้งหมดและคลังฉายา
    setPortfolio({});
    setInventory([]);
    setActiveTitle(null);

    try {
      if (username) {
        // ลบหุ้นของเราในตลาดโลก
        await remove(ref(db, `global_stocks/${username}`));

        // ล้าง Portfolio และ Inventory ใน DB ด้วย (portfolio: null = ลบ node)
        await update(ref(db, `users/${username}`), {
          portfolio: {},
          inventory: [],
          activeTitle: null,
          isIPO: false,
          fleetSize: 1,
          reputation: 5,
          brandHype: 50,
          money: startingMoney,
          debt: 0
        });
      }

      const newLog = "🚨 คุณได้ยื่นล้มละลาย! หนี้สินถูกล้างออกแล้ว เริ่มต้นชีวิตใหม่อีกครั้ง";
      setLogs(prev => [newLog, ...prev].slice(0, 15));

      setShowLoanModal(false);
      alert("ยื่นล้มละลายสำเร็จ! ระบบได้ล้างหนี้, Portfolio, ฉายา และรีเซ็ตธุรกิจของคุณแล้ว");
    } catch (err) {
      console.error("Bankruptcy Error:", err);
    }
  };

  const showInfo = (type) => {
    // ดึงข้อมูลธุรกิจปัจจุบันมาไว้ในฟังก์ชันก่อน
    const currentBInfo = BUSINESS_TYPES[businessType] || BUSINESS_TYPES.homestay;

    const infoData = {
      unit: {
        title: `จำนวน ${currentBInfo.unitName}`,
        content: `แสดงปริมาณขนาดของธุรกิจ ยิ่งมี ${currentBInfo.unitName} มาก รายได้พื้นฐานจะยิ่งสูงขึ้น แต่ค่าดูแลรักษา (Expense) ก็จะเพิ่มขึ้นตามไปด้วย`
      },
      reputation: {
        title: "ค่าชื่อเสียง (Reputation)",
        content: "วัดจากความพึงพอใจของลูกค้า มีผลต่อตัวคูณรายได้โดยตรง ยิ่งชื่อเสียงสูง รายได้ต่อหน่วยก็จะยิ่งมากขึ้น"
      },
      hype: {
        title: "ค่ากระแส (Brand Hype)",
        content: "วัดความน่าตื่นเต้นของแบรนด์ในตลาด มีผลต่อราคาหุ้นมหาศาล! Hype จะลดลงถ้าคุณไม่ขยายกิจการหรือเลือกแต่ทางปลอดภัย"
      },
      profit: {
        title: "กำไรสุทธิ (Net Profit)",
        content: "คือ รายได้ทั้งหมด หักออกด้วย ค่าใช้จ่ายคงที่ และผลกระทบจากเหตุการณ์ปัจจุบัน ถ้าตัวเลขติดลบ เงินของคุณจะลดลงเรื่อยๆ!"
      },
      auction: {
        title: "📊 รายละเอียดฉายา (Titles)",
        content: Object.entries(TITLES).map(([id, t]) => (
          <div key={id} style={{ marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <strong style={{ color: t.color }}>{t.name}</strong> (โอกาส: {t.dropRate}%)
            <div style={{ fontSize: '0.8rem', display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
              {t.hypeBonus > 0 && <span style={{ color: '#ff4757' }}>🔥 +{t.hypeBonus}% Hype</span>}
              {t.repBonus > 0 && <span style={{ color: '#FFD700' }}>⭐ +{t.repBonus} Rep</span>}
              {t.incomeBonus > 0 && <span style={{ color: '#00ff88' }}>💰 +{t.incomeBonus}% รายได้</span>}
              {t.salaryBonus < 0 && <span style={{ color: '#00E1FF' }}>👔 {t.salaryBonus}% เงินเดือน</span>}
            </div>
          </div>
        ))
      },
      inventory: {
        title: "🎖️ คลังฉายาของคุณ",
        content: "เลือกฉายาเพื่อรับพลังเสริมให้กับธุรกิจของคุณ:"
      },
      expand: {
        title: "🏗️ การขยายกิจการ",
        content: `การเพิ่มจำนวน ${currentBInfo.unitName} จะช่วยเพิ่มรายได้พื้นฐานต่อวินาทีอย่างถาวร 
        
ยิ่งมีธุรกิจขนาดใหญ่ รายได้รวมจะยิ่งสูงขึ้น แต่ค่าดูแลรักษา (Expense) ก็จะเพิ่มขึ้นตามลำดับ และราคาการก่อสร้างครั้งถัดไปจะแพงขึ้นเรื่อยๆ`
      },
      ipo: {
        title: "🏦 การทำ IPO",
        content: `เมื่อธุรกิจของคุณเติบโตจนมีขนาด 10 ${currentBInfo.unitName} ขึ้นไป คุณสามารถนำบริษัทเข้าสู่ตลาดหลักทรัพย์ (Initial Public Offering)
        
สิทธิประโยชน์:
1. รับเงินทุนอัดฉีดทันที ฿500,000
2. เปิดขายหุ้นให้ผู้เล่นคนอื่นมาลงทุนได้
3. ราคาหุ้นจะผันผวนตาม กำไรสุทธิ และค่า Hype ของบริษัทคุณ`
      }
    };
    setInfoPopup({ show: true, ...infoData[type] });
  };

  // 🛡️ ระบบเตะผู้เล่นอัตโนมัติ (ฟังคำสั่ง Admin Reset)
  useEffect(() => {
    if (authStep !== "game" || !username || username === "homestaywann") return;

    const userRef = ref(db, `users/${username}`);
    const unsubscribe = onValue(userRef, (snap) => {
      // 🚨 ตรวจสอบ: ถ้า Data ผู้ใช้หลักเบื้องหลังหายไป = ถูกลบ/เตะ/เซิร์ฟเวอร์รีเซ็ต
      if (!snap.exists()) {
        isDeletedRef.current = true; // หยุดพักการเซฟข้อมูลทั้งหมด กันจังหวะ ghost save กลับไปบนเซิร์ฟ
        alert("🚨 [SYSTEM ALERT]\nแอคเคานต์ของคุณถูกลบจากเซิร์ฟเวอร์ หรือ มีการรีเซ็ตระบบทั้งหมด โปรดล็อกอินใหม่!");
        localStorage.removeItem('homestay_user');
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [authStep, username]);

  // 💰 ระบบรายได้รอบ 2 นาที — sync กับเวลาจริง (ไม่รีเซ็ตเมื่อ reload)
  useEffect(() => {
    if (authStep !== "game") return;

    const CYCLE_SECS = 120; // 2 นาที
    const lastTriggeredBucket = { current: -1 }; // ป้องกัน double trigger

    const cycleTimer = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const elapsedInCycle = nowSec % CYCLE_SECS;         // วินาทีที่ผ่านไปในรอบนี้
      const remaining = CYCLE_SECS - elapsedInCycle;       // วินาทีที่เหลือ
      const currentBucket = Math.floor(nowSec / CYCLE_SECS); // รอบปัจจุบัน

      setIncomeCycleSeconds(remaining);

      // อัปเดต preview รายได้แบบเรียลไทม์ (ทุก 1 วินาที)
      const activeTitleData = TITLES[stateRef.current.activeTitle];
      const baseIncome = calculateCycleIncome(
        stateRef.current.businessType,
        stateRef.current.fleetSize,
        stateRef.current.reputation,
        stateRef.current.currentEvent?.multiplier ?? 1,
        activeTitleData?.incomeBonus || 0,
        activeTitleData?.salaryBonus || 0
      );

      let previewDebtPay = 0;
      const balanceBeforeDebt = moneyRef.current + baseIncome.grossRevenue - baseIncome.tax - baseIncome.salary;
      if (debtRef.current > 0 && balanceBeforeDebt > 0) {
        previewDebtPay = Math.min(Math.ceil(debtRef.current * 0.05), balanceBeforeDebt, debtRef.current);
      }

      setUpcomingIncome({
        ...baseIncome,
        debtPayment: previewDebtPay,
        netIncome: baseIncome.netIncome - previewDebtPay
      });

      // ดอกเบี้ยหนี้ต่อวินาที (0.02% = ~1.2% ต่อนาที)
      if (debtRef.current > 0) {
        const interestPerSec = debtRef.current * 0.0002;
        debtRef.current += interestPerSec;
        setDebt(debtRef.current);
      }

      // เมื่อครบรอบใหม่ (elapsedInCycle === 0) และยังไม่ได้ trigger รอบนี้
      if (elapsedInCycle === 0 && lastTriggeredBucket.current !== currentBucket) {
        lastTriggeredBucket.current = currentBucket;

        // คำนวณรายได้งวดนี้
        const activeTitle = TITLES[stateRef.current.activeTitle];
        const titleBonus = activeTitle?.incomeBonus || 0;
        const titleSalaryBonus = activeTitle?.salaryBonus || 0;
        const eventMult = stateRef.current.currentEvent?.multiplier ?? 1;
        const baseIncome = calculateCycleIncome(
          stateRef.current.businessType,
          stateRef.current.fleetSize,
          stateRef.current.reputation,
          eventMult,
          titleBonus,
          titleSalaryBonus
        );

        // คำนวณจ่ายหนี้อัตโนมัติ 5% ของหนี้ หากมีเงินเหลือพอ
        let actualDebtPayment = 0;
        const balanceBeforeDebt = moneyRef.current + baseIncome.grossRevenue - baseIncome.tax - baseIncome.salary;
        if (debtRef.current > 0 && balanceBeforeDebt > 0) {
          actualDebtPayment = Math.min(Math.ceil(debtRef.current * 0.05), balanceBeforeDebt, debtRef.current);
        }

        const finalIncome = {
          ...baseIncome,
          debtPayment: actualDebtPayment,
          netIncome: baseIncome.netIncome - actualDebtPayment
        };

        // ✅ ล้มละลาย = เงินทั้งหมดหลังรับรายได้และหักค่าใช้จ่ายติบลบ (ไม่รวมการหักหนี้อัตโนมัติ)
        const canAfford = balanceBeforeDebt >= 0;

        // บันทึกรายได้ที่คาดหมายสำหรับแสดงใน UI
        setUpcomingIncome(finalIncome);
        setPendingIncome({ ...finalIncome, canAfford });
        setShowIncomeModal(true);
      }
    }, 1000);

    return () => clearInterval(cycleTimer);
  }, [authStep]);

  useEffect(() => {
    if (authStep !== "game") return;

    const stockTimer = setInterval(() => {
      syncSystemStocks();
    }, 5000);

    fetchLeaderboard();
    fetchGlobalMarket();

    const saveTimer = setInterval(() => syncDatabase(), 10000);
    const globalMarketTimer = setInterval(() => {
      fetchLeaderboard();
    }, 15000);

    const chartTimer = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString('th-TH'), value: Math.floor(moneyRef.current), isLoss: false }];
        return newData.length > 100 ? newData.slice(1) : newData;
      });
    }, 3000);

    return () => { clearInterval(saveTimer); clearInterval(chartTimer); clearInterval(globalMarketTimer); clearInterval(stockTimer); };
  }, [authStep, username]);

  useEffect(() => {
    if (authStep !== "game") return;

    const eventTimer = setInterval(() => {
      // 🔴 ตัดรอบเวลาทุกๆ 100 วินาที (100,000 ms)
      // วิธีนี้จะทำให้ผู้เล่นทุกคนบนโลกที่นาฬิกาตรงกัน ได้รับข่าวเดียวกันในวินาทีที่ 0 ของรอบ
      const currentBucket = Math.floor(Date.now() / 100000);

      if (currentBucket > lastEventBucket.current) {

        // 🚨 ด่านตรวจ: ถ้ายังมี Choice ค้างอยู่ (ผู้เล่นยังไม่ตัดสินใจ)
        // ให้ Skip การดึง Event ใหม่ไปก่อน เพื่อให้ตัวนับถอยหลังทำงานต่อจนจบ
        if (stateRef.current.currentEvent?.choices) {
          return;
        }

        // ถ้าไม่มีอะไรค้างแล้ว ถึงจะอนุญาตให้อัปเดต Bucket และดึงข่าวใหม่
        lastEventBucket.current = currentBucket;
        setCurrentBucketState(currentBucket);
        localStorage.setItem('homestay_last_bucket_v2', currentBucket);

        // สุ่มไอเทมประมูลใหม่ประจำรอบนี้
        const nextAuctionItem = getSynchronizedAuctionItem(currentBucket);
        setAuctionItem(nextAuctionItem);

        const newEvent = getSynchronizedEvent(businessType, currentBucket);
        setCurrentEvent(newEvent);

        if (newEvent.choices) {
          localStorage.setItem(`homestay_pending_${username}`, JSON.stringify(newEvent.timeoutPenalty));
          update(ref(db, `users/${username}`), { pendingPenalty: newEvent.timeoutPenalty });
        }

        if (newEvent.isNormal) {
          setLogs(prev => [newEvent.msg, ...prev].slice(0, 15));
          syncDatabase();
        }
      }
    }, 1000);

    return () => clearInterval(eventTimer);
  }, [authStep, businessType, username]);

  // 📢 ระบบแจ้งเตือน Event ใหม่
  useEffect(() => {
    if (currentEvent.msg && currentEvent.msg !== "ระบบพร้อมทำงาน..." && currentEvent.msg !== "ดำเนินการตามแผน..." && currentEvent.msg !== "หมดเวลาตัดสินใจ!") {
      const eventLog = `📢 ข่าวด่วน: ${currentEvent.msg}`;
      setLogs(prev => [eventLog, ...prev].slice(0, 15));
    }
  }, [currentEvent.msg]);

  // --- ระบบ sync ข้อมูลประมูล (เพื่ออัปเดต UI เท่านั้น) ---
  // เก็บข้อมูลล่าสุดจาก Firebase ใน ref เพื่อให้ interval ข้างล่างอ่านได้ทุกวินาที
  const latestAuctionDataRef = useRef(null);
  useEffect(() => {
    if (authStep !== "game" || !username) return;
    const auctionRef = ref(db, `global_auction`);
    const unsubscribe = onValue(auctionRef, (snap) => {
      latestAuctionDataRef.current = snap.exists() ? snap.val() : null;
    });
    return () => unsubscribe();
  }, [authStep, username]);

  // --- ระบบ Countdown + ตรวจสอบรางวัลประมูล (ทุก 1 วินาที) ---
  useEffect(() => {
    if (authStep !== "game" || !username) return;
    const auctionRef = ref(db, `global_auction`);

    const timer = setInterval(async () => {
      const now = Date.now();
      const nowSec = Math.floor(now / 1000);
      const timeLeftInBucket = 100 - (nowSec % 100);
      const currentBucket = Math.floor(nowSec / 100);

      setAuctionTimeLeft(timeLeftInBucket);

      // ช่วง 50 วินาทีสุดท้าย = ช่วงประมูล
      const isPhase = timeLeftInBucket <= 50 && timeLeftInBucket > 0;
      setIsAuctionPhase(isPhase);

      // เปิดหน้าต่างเมื่อเข้าช่วงประมูล (แค่ครั้งเดียวต่อรอบ)
      if (isPhase && !hasOpenedAuctionRef.current) {
        setShowAuction(true);
        hasOpenedAuctionRef.current = true;
      }

      // ปิดหน้าต่างเมื่อพ้นช่วงประมูล
      if (!isPhase) {
        hasOpenedAuctionRef.current = false;
        if (timeLeftInBucket === 100 || timeLeftInBucket === 99) {
          setShowAuction(false);
        }
      }

      // 🎁 ตรวจสอบรางวัลประมูลทุกวินาที (ทำงานแม้ Firebase ไม่มี event ใหม่)
      const auctionData = latestAuctionDataRef.current;
      if (!auctionData) return;

      // ยึด auctionBucket = รอบที่ bid ถูกวาง ไม่ใช่รอบที่รีเซ็ต
      const bidBucket = auctionData.auctionBucket || 0;
      // รางวัลจะให้ก็ต่อเมื่อ: หมดรอบประมูลนั้นแล้ว (bucket ปัจจุบัน > bucket ที่ bid)
      // หมายความว่าผ่านช่วง 10 วิสุดท้ายของรอบก่อนหน้าไปแล้ว
      const isPastAuction = bidBucket > 0 && currentBucket > bidBucket;

      if (
        isPastAuction &&
        auctionData.bidder === username &&
        !auctionData.isPaid &&
        auctionData.itemId &&
        auctionProcessedRef.current !== bidBucket
      ) {
        auctionProcessedRef.current = bidBucket;
        await update(auctionRef, { isPaid: true });

        if (moneyRef.current >= auctionData.price) {
          moneyRef.current -= auctionData.price;
          setMoney(Math.floor(moneyRef.current));

          const newTitleId = auctionData.itemId;
          const currentInv = stateRef.current.inventory || [];
          const updatedInventory = [...new Set([...currentInv, newTitleId])];

          setInventory(updatedInventory);
          setActiveTitle(newTitleId);

          await update(ref(db, `users/${username}`), {
            inventory: updatedInventory,
            money: Math.floor(moneyRef.current),
            activeTitle: newTitleId
          });

          setLogs(prev => [`🎊 ชนะประมูล! ได้รับ [${TITLES[newTitleId]?.name || 'ฉายาใหม่'}] หักเงิน ฿${auctionData.price.toLocaleString()}`, ...prev].slice(0, 15));
        } else {
          const penaltyAmount = Math.floor(auctionData.price * 0.2);
          moneyRef.current -= penaltyAmount;
          setMoney(Math.floor(moneyRef.current));

          await update(ref(db, `users/${username}`), {
            money: Math.floor(moneyRef.current)
          });

          setLogs(prev => [`🚫 ประมูลล้มเหลว! เงินไม่พอจ่าย โดนค่าปรับ ฿${penaltyAmount.toLocaleString()} (20%)`, ...prev].slice(0, 15));
        }
      }

      // 🔄 รีเซ็ตข้อมูลประมูลเมื่อใกล้เริ่มรอบใหม่ (วิ 50-52)
      // ⚠️ ข้ามการรีเซ็ตถ้ายังมีผู้ชนะที่ยังไม่ได้รับรางวัล! กันการล้างข้อมูลผู้ชนะก่อนรับของ
      const isAuctionStarting = timeLeftInBucket <= 52 && timeLeftInBucket >= 50;
      const hasUnpaidWinner = auctionData.bidder && auctionData.bidder !== "ไม่มี" && !auctionData.isPaid && auctionData.itemId;
      if (auctionData.lastResetBucket !== currentBucket && isAuctionStarting && !hasUnpaidWinner) {
        await update(auctionRef, {
          bidder: "ไม่มี",
          price: 0,
          isPaid: false,
          itemId: null,
          auctionBucket: null,
          lastResetBucket: currentBucket
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [authStep, username]);

  const handleEventChoice = useCallback((choice, isTimeout = false) => {
    localStorage.removeItem(`homestay_pending_${username}`);
    update(ref(db, `users/${username}`), { pendingPenalty: null });

    // 💰 หักเงินทันทีตามผลของเหตุการณ์ (แทนระบบ multiplier เดิม)
    const mult = choice.effectMulti ?? 1;
    if (mult !== 1) {
      // คำนวณผลกระทบ: ใช้ 20% ของเงินปัจจุบัน เป็นฐานในการหัก/เพิ่ม
      const baseImpact = Math.abs(moneyRef.current * 0.20);
      if (mult < 0) {
        // เหตุการณ์ร้ายแรงมาก (effectMulti ติดลบ) → หักเงินหนักมาก
        const penalty = Math.floor(baseImpact * Math.abs(mult));
        moneyRef.current = Math.max(0, moneyRef.current - penalty);
        setMoney(Math.floor(moneyRef.current));
        setLogs(prev => [`💸 เหตุการณ์วิกฤต: หักเงินทันที -฿${penalty.toLocaleString()}`, ...prev].slice(0, 15));
      } else if (mult < 1) {
        // เหตุการณ์แย่ (0 < mult < 1) → หักเงินปานกลาง
        const penalty = Math.floor(baseImpact * (1 - mult));
        moneyRef.current = Math.max(0, moneyRef.current - penalty);
        setMoney(Math.floor(moneyRef.current));
        setLogs(prev => [`💸 ผลเสีย: หักเงิน -฿${penalty.toLocaleString()}`, ...prev].slice(0, 15));
      } else if (mult > 1) {
        // เหตุการณ์ดี → รับเงินโบนัส
        const bonus = Math.floor(baseImpact * (mult - 1));
        moneyRef.current += bonus;
        setMoney(Math.floor(moneyRef.current));
        setLogs(prev => [`💰 โชคดี! ได้รับโบนัส +฿${bonus.toLocaleString()}`, ...prev].slice(0, 15));
      }
      setChartData(prev => [...prev, {
        time: new Date().toLocaleTimeString('th-TH'),
        value: Math.floor(moneyRef.current),
        isLoss: mult < 1,
        reason: isTimeout ? "หนีวิกฤตไม่พ้น!" : "ผลเหตุการณ์"
      }]);
    }

    // อัปเดต Hype
    if (choice.hypeChange) {
      setBrandHype(prev => Math.max(0, prev + choice.hypeChange));
    }

    setCurrentEvent({ msg: isTimeout ? "หมดเวลาตัดสินใจ!" : "ดำเนินการตามแผน...", multiplier: 1 });
    setLogs(prev => [choice.logMsg, ...prev].slice(0, 15));
    syncDatabase(moneyRef.current);
  }, [username]);

  const handleTitleSelect = async (e) => {
    const newTitle = e.target.value || null;
    setActiveTitle(newTitle);
    try {
      await update(ref(db, `users/${username}`), { activeTitle: newTitle });
    } catch (err) { }
  };

  const handleExpandRoom = async () => {
    const cost = getUpgradeCost(fleetSize);
    if (moneyRef.current >= cost) {
      moneyRef.current -= cost;
      const newSize = fleetSize + 1;
      setFleetSize(newSize);
      setMoney(Math.floor(moneyRef.current));
      lastExpandTime.current = Date.now(); // 🟢 อัปเดตเวลาขยายกิจการ
      const bInfo = BUSINESS_TYPES[businessType];
      setLogs(prev => [`ขยายสาขาที่ ${newSize} (จ่าย ฿${cost.toLocaleString()})`, ...prev].slice(0, 15));
      setChartData(prev => [...prev, { time: new Date().toLocaleTimeString('th-TH'), value: Math.floor(moneyRef.current), isLoss: true, reason: `ขยาย ${bInfo.unitName}` }]);
      await syncDatabase(moneyRef.current);
    }
  };

  const handleIPO = async () => {
    if (!isIPO && fleetSize >= 10) {
      setIsIPO(true);
      moneyRef.current += 500000;
      setMoney(Math.floor(moneyRef.current));
      setLogs(prev => [`🎉 IPO สำเร็จ! บริษัทเข้าตลาดหุ้น รับทุนอัดฉีด +฿500,000`, ...prev].slice(0, 15));
      setChartData(prev => [...prev, { time: new Date().toLocaleTimeString('th-TH'), value: Math.floor(moneyRef.current), isLoss: false, reason: "IPO Fund" }]);
      await syncDatabase(moneyRef.current);
    }
  };

  const buyStock = (symbol, price, amount) => {
    // 🛡️ ป้องกันซื้อหุ้นตัวเอง
    if (symbol === username) {
      alert("❌ ไม่สามารถซื้อหุ้นบริษัทตัวเองได้!");
      return;
    }

    // 🛡️ ตรวจสอบ Port Limit
    const currentShares = portfolio[symbol]?.shares || 0;
    if (currentShares + amount > 200) {
      alert(`❌ สามารถถือหุ้น ${symbol} ได้สูงสุด 200 หุ้น/ตัว`);
      return;
    }

    // 🛡️ หุ้นผู้เล่น: สวิงไม่เกิน 3x ของราคา IPO ที่เคย sync มา
    const stock = globalStocks.find(s => s.symbol === symbol || s.owner === symbol);
    if (stock?.isPlayer && stock?.ipoPrice && price > stock.ipoPrice * 3) {
      alert(`❌ ราคาหุ้น ${symbol} สูงเกินเพดานควบคุม (3x IPO price) ไม่อนุญาตให้ซื้อ`);
      return;
    }

    const costTotal = price * amount;
    if (moneyRef.current >= costTotal) {
      moneyRef.current -= costTotal;
      setMoney(Math.floor(moneyRef.current));
      setPortfolio(prev => {
        const old = prev[symbol] || { shares: 0, avgCost: 0 };
        const newShares = old.shares + amount;
        const newAvgCost = ((old.shares * old.avgCost) + costTotal) / newShares;
        return { ...prev, [symbol]: { shares: newShares, avgCost: newAvgCost } };
      });
      setLogs(prev => [`ซื้อหุ้น ${symbol} จำนวน ${amount} หุ้น (฿${costTotal.toLocaleString()})`, ...prev].slice(0, 15));
      syncDatabase(moneyRef.current);
    } else {
      alert("❌ เงินไม่พอ!");
    }
  };

  const CAPITAL_GAINS_TAX = 0.15; // ภาษีกำไร 15%

  const sellStock = (symbol, price, amount) => {
    const myStock = portfolio[symbol];
    if (myStock && myStock.shares >= amount) {
      const rawRevenue = price * amount;
      const costBasis = myStock.avgCost * amount; // ต้นทุนจริง
      const profit = rawRevenue - costBasis;

      // 🛡️ Cap กำไรสูงสุด 3x ของต้นทุน
      const maxPayout = costBasis * 3;
      const cappedRevenue = Math.min(rawRevenue, maxPayout);

      // 🛡️ หักภาษี 15% จากกำไรเท่านั้น
      const cappedProfit = Math.max(0, cappedRevenue - costBasis);
      const tax = Math.floor(cappedProfit * CAPITAL_GAINS_TAX);
      const revenueTotal = Math.floor(cappedRevenue - tax);

      moneyRef.current += revenueTotal;
      setMoney(Math.floor(moneyRef.current));
      setPortfolio(prev => {
        const old = prev[symbol];
        const newShares = old.shares - amount;
        if (newShares === 0) {
          const newPort = { ...prev };
          delete newPort[symbol];
          return newPort;
        }
        return { ...prev, [symbol]: { ...old, shares: newShares } };
      });

      const logMsg = tax > 0
        ? `ขายหุ้น ${symbol} ได้เงิน ฿${revenueTotal.toLocaleString()} (ภาษีกำไรหัก ฿${tax.toLocaleString()})`
        : `ขายหุ้น ${symbol} จำนวน ${amount} หุ้น ได้เงิน ฿${revenueTotal.toLocaleString()}`;
      setLogs(prev => [logMsg, ...prev].slice(0, 15));

      // 🛡️ ป้องกันบัคเงินหาย: ดึง state จากการทำงานมาเซฟลง DB ทันที
      const updatedPortfolio = { ...portfolio };
      if (updatedPortfolio[symbol]) {
        updatedPortfolio[symbol].shares -= amount;
        if (updatedPortfolio[symbol].shares <= 0) delete updatedPortfolio[symbol];
      }

      update(ref(db, `users/${username}`), {
        money: Math.floor(moneyRef.current),
        portfolio: updatedPortfolio
      }).then(() => syncDatabase(moneyRef.current));
    }
  };

  const bInfo = BUSINESS_TYPES[businessType] || BUSINESS_TYPES.homestay;
  const combinedStocks = [...sysStocks, ...globalStocks];

  if (authStep === "loading" || authStep === "login" || authStep === "setup_name") {
    return (
      <div className="game-container login-layout">
        <div className="glass-panel auth-box">
          {authStep === "login" ? (
            <>
              <h3>SYSTEM ACCESS</h3>
              <p style={{ fontSize: '0.8rem', color: '#aaa' }}>กรุณาใส่ Username เพื่อเข้าสู่ระบบ</p>
              <input
                className="glass-input"
                type="text"
                placeholder="Username"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                className="primary-btn full-width"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "CONNECTING..." : "NEXT"}
              </button>
            </>
          ) : (
            <>
              <h3>ตั้งค่าบริษัท</h3>
              <p style={{ fontSize: '0.8rem', color: '#00ff88' }}>ผู้ใช้: {username}</p>

              <div style={{ marginBottom: '15px', position: 'relative', textAlign: 'left' }}>
                <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>เลือกประเภทธุรกิจ:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    className="glass-input"
                    value={businessType}
                    onChange={(e) => {
                      setBusinessType(e.target.value);
                      setIsConfirmed(false); // รีเซ็ตการยืนยันเมื่อเปลี่ยนธุรกิจ
                    }}
                    style={{ padding: '10px', flex: 1, margin: 0 }}
                  >
                    {Object.values(BUSINESS_TYPES).map(b => (
                      <option key={b.id} value={b.id} style={{ color: '#000' }}>{b.icon} {b.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => showBusinessInfo(businessType)}
                    style={{
                      background: 'rgba(0, 225, 255, 0.2)',
                      border: '1px solid #00E1FF',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      minWidth: '35px',
                      color: '#00E1FF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >i</button>
                </div>
              </div>

              <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '5px', textAlign: 'left' }}>ชื่อแสดงผล (ห้ามซ้ำกับ Username):</label>
              <input
                className="glass-input"
                type="text"
                placeholder="ชื่อบริษัท/ชื่อของคุณ"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ marginBottom: '15px' }}
              />

              <div style={{ marginBottom: '15px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="confirm-biz"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                />
                <label htmlFor="confirm-biz" style={{ fontSize: '0.75rem', color: '#fff', cursor: 'pointer' }}>
                  ฉันเข้าใจความเสี่ยงและพร้อมแบกรับความสูญเสีย
                </label>
              </div>

              <button
                className="primary-btn full-width"
                onClick={handleSetDisplayName}
                disabled={!isConfirmed || isLoggingIn}
                style={{ opacity: isConfirmed && !isLoggingIn ? 1 : 0.5 }}
              >
                {isLoggingIn ? "PREPARING..." : "START BUSINESS"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 🛡️ Admin Dashboard Bypass
  if (authStep === "game" && username === "homestaywann") {
    return <AdminDashboard username={username} onLogout={handleLogout} />;
  }

  return (
    <div className="game-container">
      {/* Header - จะกลายเป็น 2x2 บนมือถืออัตโนมัติ */}
      <header className="stats-bar">
        <div className="stat-group">
          <span className="section-title">
            {bInfo.name} CEO
            (<span onClick={handleLogout} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#ff4757' }}>ออก</span> |
            <span onClick={() => setShowUpdateLog(true)} style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '3px', color: '#00E1FF' }}>แพทช์โน้ต</span>)
          </span>
          <h2 className="success" style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1rem' }}>{displayName}</h2>
          <div className="active-title-display" style={{ color: TITLES[activeTitle]?.color || '#aaa', fontSize: '0.7rem', marginTop: '2px', fontWeight: 'bold' }}>
            {activeTitle ? `🏆 ${TITLES[activeTitle].name}` : "🌑 ยังไม่มีฉายา"}
          </div>
        </div>

        <div className="stat-group" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px', padding: '5px', position: 'relative' }}>
          <span className="section-title">สินทรัพย์ปัจจุบัน</span>
          <h2 className={money < 0 ? "danger" : "success"} style={{ fontSize: '1.1rem', margin: 0 }}>฿{money.toLocaleString()}</h2>
          {debt > 0 && <p style={{ fontSize: '0.6rem', color: '#ff4757', position: 'absolute', bottom: '-15px', right: '5px' }}>หนี้: ฿{Math.floor(debt).toLocaleString()}</p>}
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div className="business-status">
          <div className="info-card">
            <span onClick={() => showInfo('unit')} style={iStyle}>i</span>
            <span style={{ fontSize: '1.2rem' }}>{bInfo.icon}</span>
            <strong>{fleetSize}</strong>
            <p>{bInfo.unitName}</p>
          </div>
          <div className="info-card">
            <span onClick={() => showInfo('reputation')} style={iStyle}>i</span>
            <span style={{ fontSize: '1.2rem' }}>⭐</span>
            <strong>{reputation}%</strong>
            <p>ชื่อเสียง</p>
          </div>
          <div className="info-card">
            <span onClick={() => showInfo('hype')} style={iStyle}>i</span>
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <strong className={brandHype < 80 ? "danger" : "success"}>{brandHype}%</strong>
            <p>Hype</p>
          </div>
          <div className="info-card" style={{ boxShadow: '0 4px 15px rgba(0, 225, 255, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            <strong style={{ color: incomeCycleSeconds <= 15 ? '#ff4757' : '#00E1FF', fontSize: incomeCycleSeconds <= 15 ? '1.3rem' : '1rem' }}>
              {Math.floor(incomeCycleSeconds / 60)}:{String(incomeCycleSeconds % 60).padStart(2, '0')}
            </strong>
            <p>รับเงินใน</p>
            {/* progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ height: '100%', width: `${((120 - incomeCycleSeconds) / 120) * 100}%`, background: incomeCycleSeconds <= 15 ? '#ff4757' : '#00E1FF', transition: 'width 1s linear' }} />
            </div>
          </div>
        </div>

        {/* สถานะรายจ่ายงวดถัดไป */}
        {upcomingIncome && (
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            fontSize: '0.72rem',
            color: '#aaa',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>งวดถัดไป:</span>
            <span>💵 รายได้: <strong style={{ color: '#00ff88' }}>+฿{upcomingIncome.grossRevenue.toLocaleString()}</strong></span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span>🏩 ภาษี 10%: <strong style={{ color: '#ff4757' }}>-฿{upcomingIncome.tax.toLocaleString()}</strong></span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span>👔 ค่าแรง: <strong style={{ color: '#ff4757' }}>-฿{upcomingIncome.salary.toLocaleString()}</strong></span>
            {upcomingIncome.debtPayment > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span>🏦 หักหนี้อัตโนมัติ 5%: <strong style={{ color: '#00E1FF' }}>-฿{upcomingIncome.debtPayment.toLocaleString()}</strong></span>
              </>
            )}
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span>สุทธิ์: <strong style={{ color: upcomingIncome.netIncome >= 0 ? '#00ff88' : '#ff4757' }}>{upcomingIncome.netIncome >= 0 ? '+' : ''}฿{upcomingIncome.netIncome.toLocaleString()}</strong></span>
            {upcomingIncome.netIncome < 0 && (
              <span style={{ color: '#ffa502', fontWeight: 'bold', marginLeft: '4px' }}>
                ⚠️ รายจ่ายเกินรายรับ
              </span>
            )}
          </div>
        )}

        {/* กราฟจะยืดเต็มพื้นที่ที่เหลือ */}
        <section className="chart-panel">
          <BusinessChart data={chartData} />
        </section>

        {/* แผงควบคุมด้านล่าง */}
        <div className="action-grid">
          <div className="intel-panel" style={{ overflow: 'hidden', padding: '10px', display: 'flex', flexDirection: 'column' }}>
            <InteractiveNews currentEvent={currentEvent}
              logs={logs}
              onChoiceSelect={handleEventChoice}
              auctionTimeLeft={auctionTimeLeft}
              isAuctionPhase={isAuctionPhase}
            /></div>
          <div className="control-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
            {/* ปุ่ม i สำหรับอธิบายการก่อสร้าง/ขยายกิจการ */}
            <span onClick={() => showInfo('expand')} style={iStyle}>i</span>

            <span className="section-title">ขยาย (+1 {bInfo.unitName})</span>
            <h3 className={money >= getUpgradeCost(fleetSize) ? "success" : "danger"}>
              ฿{getUpgradeCost(fleetSize).toLocaleString()}
            </h3>
            <p style={{ fontSize: '0.6rem', color: '#00ff88' }}>
              (+฿{Math.floor(calculateRevenue(businessType, fleetSize + 1, reputation, 1) - calculateRevenue(businessType, fleetSize, reputation, 1)).toLocaleString()}/รอบ)
            </p>

            <button
              className="primary-btn"
              onClick={handleExpandRoom}
              disabled={money < getUpgradeCost(fleetSize)}
              style={{ padding: '8px', fontSize: '0.7rem' }}
            >
              ก่อสร้าง
            </button>

            {/* ส่วนของ IPO */}
            <div style={{ position: 'relative', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {/* ปุ่ม i สำหรับอธิบาย IPO */}
              <span onClick={() => showInfo('ipo')} style={{ ...iStyle, top: '10px' }}>i</span>

              {isIPO ? (
                <p style={{ color: '#FFD700', fontSize: '0.6rem', margin: 0 }}>👑 IPO แล้ว</p>
              ) : (
                <button
                  onClick={handleIPO}
                  disabled={fleetSize < 10}
                  style={{
                    fontSize: '0.6rem',
                    background: fleetSize >= 10 ? 'linear-gradient(45deg, #FFD700, #FFA500)' : '#333',
                    color: fleetSize >= 10 ? 'black' : '#888',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '4px 15px',
                    cursor: fleetSize >= 10 ? 'pointer' : 'not-allowed',
                    opacity: fleetSize >= 10 ? 1 : 0.5,
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  จดทะเบียน IPO
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-status">
        <div>● {username.toUpperCase()}</div>
        <div>IP: {playerIP}</div>
      </footer>

      {/* 📱 แถบเมนูด้านล่าง (Bottom Nav) */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => setShowStockMarket(true)}>
          <span className="nav-icon">📈</span>
          <span>ตลาดหุ้น</span>
        </button>

        <button className="nav-button" onClick={() => setShowLoanModal(true)}>
          <span className="nav-icon">🏦</span>
          <span>ธนาคาร</span>
        </button>

        <button
          className={`nav-button ${auctionItem ? 'auction-active-pulse' : ''}`}
          onClick={() => setShowAuction(true)}
        >
          <span className="nav-icon">🔨</span>
          <span>{auctionItem ? 'กำลังประมูล!' : 'ประมูล'}</span>
        </button>

        <button className="nav-button" onClick={() => setShowLeaderboard(true)}>
          <span className="nav-icon">🏆</span>
          <span>อันดับ #{myRank}</span>
        </button>

        <button className="nav-button" onClick={() => showInfo('inventory')}>
          <span className="nav-icon">🎒</span>
          <span>กระเป๋า ({inventory.length})</span>
        </button>
      </nav>

      {/* Modals อื่นๆ */}
      <InfoModal
        show={infoPopup.show}
        title={infoPopup.title}
        content={
          <div style={{ textAlign: 'left' }}>
            {/* ถ้าเป็นหน้าต่างคลังฉายา */}
            {infoPopup.title.includes("คลังฉายา") ? (
              <div className="inventory-glass-panel">
                <p style={{ marginBottom: '15px', color: '#aaa' }}>เลือกฉายาเพื่อรับโบนัสพิเศษ:</p>

                <div className="title-grid" style={{ display: 'grid', gap: '10px' }}>
                  {inventory.map(id => {
                    const t = TITLES[id];
                    const isActive = activeTitle === id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          setActiveTitle(id);
                          update(ref(db, `users/${username}`), { activeTitle: id });
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          background: isActive ? 'rgba(0, 225, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: isActive ? `1px solid ${t.color}` : '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div>
                          <span style={{ color: t.color, fontWeight: 'bold' }}>{t.name}</span>
                          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.rarity}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.72rem', display: 'grid', gap: '2px' }}>
                          {t.hypeBonus > 0 && <div style={{ color: '#ff9f43' }}>🔥 +{t.hypeBonus}% Hype</div>}
                          {t.repBonus > 0 && <div style={{ color: '#00d2d3' }}>⭐ +{t.repBonus} Rep</div>}
                          {t.incomeBonus > 0 && <div style={{ color: '#00ff88' }}>💰 +{(t.incomeBonus * 100).toFixed(0)}% Income</div>}
                          {t.loanBonus > 0 && <div style={{ color: '#00E1FF' }}>🏦 +฿{t.loanBonus.toLocaleString()}</div>}
                          {t.stockBonus > 1 && <div style={{ color: '#a335ee' }}>📈 x{t.stockBonus.toFixed(2)} หุ้น</div>}
                        </div>
                      </div>
                    );
                  })}

                  {/* ปุ่มถอดฉายา */}
                  <div
                    onClick={() => handleTitleSelect({ target: { value: '' } })}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: !activeTitle ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      fontSize: '0.8rem',
                      marginTop: '5px'
                    }}
                  >
                    {!activeTitle ? '● ไม่ได้ใช้งานฉายา' : 'ถอดฉายาออก'}
                  </div>
                </div>

                {inventory.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>ยังไม่มีฉายาในครอบครอง</p>}
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                {Array.isArray(infoPopup.content) ? (
                  infoPopup.content
                ) : (
                  <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{infoPopup.content}</p>
                )}
              </div>
            )}
          </div>
        }
        onClose={() => setInfoPopup({ ...infoPopup, show: false })}
      />

      {/* 🏦 Loan & Bank Modal */}
      {showLoanModal && (
        <div className="glass-overlay" style={{ zIndex: 10005, background: 'rgba(0,0,0,0.85)' }}>
          <div className="bank-section" style={{ maxWidth: '450px', width: '92%', textAlign: 'center' }}>
            <h3 className="bank-title">🏦 Financial Services</h3>

            <div className="bank-row">
              <div className="bank-info">
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>ยอดหนี้คงเหลือ</p>
                <div className="debt-amount">
                  ฿{Math.floor(debt).toLocaleString()}
                </div>
                <p style={{ fontSize: '0.65rem', color: '#d4af37', marginTop: '5px' }}>
                  * ดอกเบี้ย 0.1% ต่อวินาที (ทบต้น)
                </p>
                <p style={{ fontSize: '0.65rem', color: '#666' }}>
                  วงเงินกู้สูงสุด: ฿{loanLimit.toLocaleString()}
                </p>
              </div>

              <div className="bank-actions">
                {/* สถานะสิทธิ์กู้เงิน */}
                {money >= 10000 ? (
                  <div style={{ padding: '10px 14px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.4)', borderRadius: '10px', marginBottom: '10px', fontSize: '0.75rem', color: '#ff4757', textAlign: 'center' }}>
                    🔒 <strong>ยังไม่มีสิทธิ์กู้เงิน</strong><br />
                    <span style={{ color: '#aaa', fontSize: '0.7rem' }}>เงินสดต้องต่ำกว่า ฿10,000 จึงจะกู้ได้<br />(เงินปัจจุบัน ฿{Math.floor(money).toLocaleString()})</span>
                  </div>
                ) : (
                  <div style={{ padding: '8px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '10px', marginBottom: '10px', fontSize: '0.75rem', color: '#00ff88', textAlign: 'center' }}>
                    ✅ <strong>มีสิทธิ์กู้เงิน</strong> — เงินสดต่ำกว่า ฿10,000
                  </div>
                )}

                <button
                  className="btn-loan"
                  onClick={() => takeLoan(100000)}
                  disabled={debt + 100000 > loanLimit || money >= 10000}
                >
                  กู้เงิน ฿100,000
                </button>

                <button
                  className="btn-repay"
                  onClick={() => repayLoan(Math.min(debt, 100000))}
                  disabled={debt <= 0 || money < 10}
                >
                  ชำระหนี้คืน
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: '0.7rem', color: '#ff4757', marginBottom: '10px' }}>
                * หากไม่สามารถชำระหนี้ได้ คุณสามารถยื่นเรื่องล้มละลายเพื่อล้างหนี้ทั้งหมด
              </p>
              <button
                onClick={handleBankruptcy}
                style={{
                  background: 'transparent',
                  border: '1px solid #ff4757',
                  color: '#ff4757',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  marginBottom: '10px',
                  width: '100%'
                }}
              >
                🏛️ ยื่นคำร้องล้มละลาย
              </button>
              <p style={{ fontSize: '0.7rem', color: '#aaa' }}>
                {money < 0 ? "⚠️ บัญชีติดลบ! ระบบธนาคารอนุญาตให้กู้เงินเพื่อรักษาสภาพคล่อง" : money < 10000 ? "🟢 บัญชีของคุณอยู่ในเกณฑ์ฉุกเฉิน พร้อมอนุมัติสินเชื่อ" : "🔴 รายได้ดีเกินไป ธนาคารยังไม่อนุมัติเงินกู้ในขณะนี้"}
              </p>
              <button className="nav-button" onClick={() => setShowLoanModal(false)} style={{ width: '100%', marginTop: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                ออกจากระบบธนาคาร
              </button>
            </div>
          </div>
        </div>
      )}
      <AuctionHouse
        show={showAuction}
        item={auctionItem}
        username={username}
        money={moneyRef.current}
        inventory={inventory}
        isAuctionPhase={isAuctionPhase}
        onClose={() => setShowAuction(false)}
      />
      <IncomeModal
        show={showIncomeModal}
        incomeData={pendingIncome}
        onAccept={handleAcceptIncome}
        onBankrupt={() => {
          setShowIncomeModal(false);
          setPendingIncome(null);
          handleBankruptcy();
        }}
      />
      <UpdateLogModal
        show={showUpdateLog}
        onClose={() => setShowUpdateLog(false)}
      />
      <Leaderboard show={showLeaderboard} onClose={() => setShowLeaderboard(false)} competitors={competitors} username={username} businessTypes={BUSINESS_TYPES} />
      <StockMarket show={showStockMarket} onClose={() => setShowStockMarket(false)} money={moneyRef.current} marketStocks={combinedStocks} portfolio={portfolio} onBuy={buyStock} onSell={sellStock} username={username} />

      {/* IP Conflict Warning Modal */}
      {showIPWarning && (
        <div className="glass-overlay" style={{ zIndex: 9999 }}>
          <div className="glass-panel auth-box" style={{ maxWidth: '400px', textAlign: 'center', border: '1px solid #ff4757' }}>
            <h3 style={{ color: '#ff4757' }}>⚠️ พบการใช้งานซ้ำซ้อน</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              IP นี้ถูกใช้งานโดยบัญชี: <br />
              <strong>{conflictUser?.displayName} (@{conflictUser?.username})</strong>
            </p>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
              นโยบายระบบ: 1 IP ต่อ 1 บัญชีเท่านั้น <br />
              หากต้องการใช้บัญชีปัจจุบัน **บัญชีเก่าจะถูกลบทิ้งถาวร**
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="primary-btn"
                style={{ background: '#ff4757', flex: 1 }}
                onClick={handleDeleteAndSwitch}
              >
                ลบบัญชีเก่า & เข้าเกม
              </button>
              <button
                className="glass-input"
                style={{ flex: 1, margin: 0 }}
                onClick={() => {
                  setShowIPWarning(false);
                  setInputValue("");
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iStyle = {
  position: 'absolute',
  top: '5px',
  right: '8px',
  fontSize: '0.6rem',
  background: 'rgba(255,255,255,0.1)',
  width: '14px',
  height: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.5)',
  border: '1px solid rgba(255,255,255,0.2)'
};

export default App;