import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { db } from './firebase';
import { ref, update, get, serverTimestamp, remove, onValue } from "firebase/database";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { GAME_CONF, calculateRevenue, calculateExpense, getUpgradeCost } from './logic/gameLogic';

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
  const [auctionItem, setAuctionItem] = useState(null);
  const [currentBucketState, setCurrentBucketState] = useState(0);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState(0);
  const [isAuctionPhase, setIsAuctionPhase] = useState(false);
  const [conflictUser, setConflictUser] = useState(null);
  const [showIPWarning, setShowIPWarning] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [debt, setDebt] = useState(0);
  const [baseLoanLimit] = useState(1000000); // วงเงินกู้สูงสุดพื้นฐาน 1 ล้านบาท
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showUpdateLog, setShowUpdateLog] = useState(false);

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
    if (!username) return;
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
        await update(ref(db, `global_stocks/${username}`), {
          symbol: username.substring(0, 4).toUpperCase(),
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
        const playerStocks = Object.keys(data).map(key => data[key]);
        setGlobalStocks(playerStocks);
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

  const takeLoan = (amount) => {
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

    // 🛡️ ล้างพอร์ตโฟลิโอทั้งหมด (ปัญหาหลัก!)
    setPortfolio({});

    try {
      if (username) {
        // ลบหุ้นของเราในตลาดโลก
        await remove(ref(db, `global_stocks/${username}`));

        // ล้าง Portfolio ใน DB ด้วย (portfolio: null = ลบ node)
        await update(ref(db, `users/${username}`), {
          portfolio: {},
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
      alert("ยื่นล้มละลายสำเร็จ! ระบบได้ล้างหนี้, Portfolio และรีเซ็ตธุรกิจของคุณแล้ว");
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
            <div style={{ fontSize: '0.8rem', color: '#00ff88' }}>
              {t.hypeBonus > 0 && `🔥 +${t.hypeBonus}% Hype `}
              {t.repBonus > 0 && `⭐ +${t.repBonus} Rep`}
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
        alert("🚨 [SYSTEM ALERT]\nแอคเคานต์ของคุณถูกลบจากเซิร์ฟเวอร์ หรือ มีการรีเซ็ตระบบทั้งหมด โปรดล็อกอินใหม่!");
        localStorage.removeItem('homestay_user');
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [authStep, username]);

  useEffect(() => {
    if (authStep !== "game") return;
    const profitPerTick = netProfit / (1000 / GAME_CONF.TICK_RATE);
    const timer = setInterval(() => {
      // 🟢 ระบบ "ภาษีคนรวยที่ขี้ขลาด" (Idle Cash Tax)
      // ทุกๆ 1 นาที (60000ms) ถ้าเงินสดเกิน 1,000,000 และไม่ขยายสาขาเลย
      if (moneyRef.current > 1000000 && (Date.now() - lastExpandTime.current) > 60000) {
        moneyRef.current *= 0.95;
        setLogs(prev => ["💸 โดนภาษีเงินเฟ้อหัก 5% (เนื่องจากธุรกิจไม่มีการเคลื่อนไหว)", ...prev].slice(0, 15));
        lastExpandTime.current = Date.now(); // รีเซ็ตเพื่อไม่ให้โดนรัวๆ ใน tick ถัดไปทันที (จริงๆ ควรมีระบบแยกแต่ใส่ตรงนี้ประหยัด)
      }

      moneyRef.current += profitPerTick;
      setMoney(Math.floor(moneyRef.current));

      // 🏦 ระบบคิดดอกเบี้ย (0.1% ต่อวินาที)
      if (debtRef.current > 0) {
        // 0.1% ต่อวินาที คือ 0.001 / (1000 / TICK_RATE) ต่อ tick
        const interestPerTick = (debtRef.current * 0.001) / (1000 / GAME_CONF.TICK_RATE);
        setDebt(prev => prev + interestPerTick);
      }
    }, GAME_CONF.TICK_RATE);
    return () => clearInterval(timer);
  }, [netProfit, authStep]);

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

    return () => clearInterval(timer);
  }, [authStep, businessType, username]);

  // 📢 ระบบแจ้งเตือน Event ใหม่
  useEffect(() => {
    if (currentEvent.msg && currentEvent.msg !== "ระบบพร้อมทำงาน..." && currentEvent.msg !== "ดำเนินการตามแผน..." && currentEvent.msg !== "หมดเวลาตัดสินใจ!") {
      const eventLog = `📢 ข่าวด่วน: ${currentEvent.msg}`;
      setLogs(prev => [eventLog, ...prev].slice(0, 15));
    }
  }, [currentEvent.msg]);

  // --- ระบบจัดการผู้ชนะประมูล: ใช้ onValue listener แบบ Real-time แทน ---
  useEffect(() => {
    if (authStep !== "game" || !username) return;

    const auctionRef = ref(db, `global_auction`);

    const unsubscribe = onValue(auctionRef, async (snap) => {
      if (!snap.exists()) return;
      const auctionData = snap.val();

      // ตรวจสอบ: ช่วงเวลานอกประมูล และมีคนชนะประมูล
      const now = Date.now();
      const timeLeftInBucket = 100 - (Math.floor(now / 1000) % 100);
      const isOutsideAuction = timeLeftInBucket > 10;

      // 🎁 มอบรางวัลทันทีเมื่อ: เป็นเราชนะ + ยังไม่จ่าย + พ้นช่วงประมูลแล้ว
      const currentBucket = Math.floor(Date.now() / 100000);
      if (
        auctionData.bidder === username &&
        !auctionData.isPaid &&
        auctionData.itemId &&
        isOutsideAuction &&
        auctionProcessedRef.current !== currentBucket // ยังไม่ได้ประมวลผลรอบนี้
      ) {
        auctionProcessedRef.current = currentBucket; // Mark ว่าประมวลผลรอบนี้แล้ว
        // ✅ Mark isPaid ก่อนเลยเพื่อกัน Double-trigger
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

      // 🔄 รีเซ็ตรอบใหม่: คนแรกที่เจอ bucket ใหม่ทำหน้าที่รีเซ็ต
      if (auctionData.lastResetBucket !== currentBucket && isOutsideAuction) {
        await update(auctionRef, {
          bidder: "ไม่มี",
          price: 0,
          isPaid: false,
          itemId: null,
          lastResetBucket: currentBucket
        });
      }
    });

    return () => unsubscribe();
  }, [authStep, username]);

  // --- ระบบ Countdown สำหรับ MARKET และ AUCTION ---
  useEffect(() => {
    if (authStep !== "game") return;
    const timer = setInterval(() => {
      const now = Date.now();
      const timeLeftInBucket = 100 - (Math.floor(now / 1000) % 100);
      setAuctionTimeLeft(timeLeftInBucket);

      // ช่วง 10 วินาทีสุดท้ายของ 100 วินาที คือช่วงประมูล
      const isPhase = timeLeftInBucket <= 10;
      setIsAuctionPhase(isPhase);

      // เปิดหน้าต่างเฉพาะวินาทีที่ 10 เท่านั้น
      if (timeLeftInBucket === 10) {
        setShowAuction(true);
      }

      // ปิดหน้าต่างเมื่อพ้นช่วงประมูล (วินาทีที่ 99 = เริ่มรอบใหม่)
      if (timeLeftInBucket === 99 || timeLeftInBucket === 100) {
        setShowAuction(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [authStep]);

  const handleEventChoice = useCallback((choice, isTimeout = false) => {
    localStorage.removeItem(`homestay_pending_${username}`);
    update(ref(db, `users/${username}`), { pendingPenalty: null });

    // คำนวณ Hype Change
    if (choice.hypeChange) {
      setBrandHype(prev => Math.max(0, prev + choice.hypeChange));
    }

    setCurrentEvent({ msg: isTimeout ? "หมดเวลาตัดสินใจ!" : "ดำเนินการตามแผน...", multiplier: choice.effectMulti });
    setLogs(prev => [choice.logMsg, ...prev].slice(0, 15));
    if (isTimeout || choice.effectMulti < 1) {
      setChartData(prev => [...prev, { time: new Date().toLocaleTimeString('th-TH'), value: Math.floor(moneyRef.current), isLoss: true, reason: isTimeout ? "หนีวิกฤตไม่พ้น!" : "เสียเงินลงทุน" }]);
    }
    syncDatabase();
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
      syncDatabase(moneyRef.current);
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
          <div className="info-card" style={{ boxShadow: netProfit >= 0 ? '0 4px 15px rgba(0, 225, 255, 0.1)' : '0 4px 15px rgba(255, 71, 87, 0.1)' }}>
            <span onClick={() => showInfo('profit')} style={iStyle}>i</span>
            <span style={{ fontSize: '1.2rem' }}>💰</span>
            <strong className={netProfit >= 0 ? "success" : "danger"}>
              {netProfit > 0 ? '+' : ''}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 1 })}
            </strong>
            <p>กำไร/วิ</p>
          </div>
        </div>

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
              (+฿{((calculateRevenue(businessType, fleetSize + 1, reputation, 1) - calculateRevenue(businessType, fleetSize, reputation, 1))).toFixed(1)}/วิ)
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
                <button
                  className="btn-loan"
                  onClick={() => takeLoan(100000)}
                  disabled={debt + 100000 > loanLimit}
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
                {money < 0 ? "⚠️ บัญชีติดลบ! ระบบธนาคารอนุญาตให้กู้เงินเพื่อรักษาสภาพคล่อง" : "เงินกู้อนุมัติไว พร้อมใช้งานทันที"}
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
        inventory={inventory} // ส่ง inventory ไปให้ AuctionHouse
        onClose={() => setShowAuction(false)}
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