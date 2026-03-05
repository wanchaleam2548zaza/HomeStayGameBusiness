export const TITLES = {
    // 🔴 LEGENDARY (หายากมาก — พลังมหาศาล ต่อรอบ 2 นาที)
    WORLD_MONOPOLY: {
        id: 'WORLD_MONOPOLY', name: '👑 ผู้ผูกขาดโลก', rarity: 'Legendary',
        hypeBonus: 200,
        repBonus: 100,
        incomeBonus: 50,      // +50% รายได้ต่อรอบ
        salaryBonus: -30,     // ลดเงินเดือนพนักงาน 30%
        loanBonus: 5000000,
        stockBonus: 2.0,
        color: '#ff0055', dropRate: 0.01, minBid: 100000000
    },
    ILLUMINATI_CEO: {
        id: 'ILLUMINATI_CEO', name: '👁️ ผู้อยู่เบื้องหลัง', rarity: 'Legendary',
        hypeBonus: 150,
        repBonus: 150,
        incomeBonus: 40,      // +40% รายได้ต่อรอบ
        salaryBonus: -25,
        loanBonus: 3000000,
        stockBonus: 1.8,
        color: '#ff0055', dropRate: 0.01, minBid: 75000000
    },

    // 🟣 EPIC
    DIAMOND_HANDS: {
        id: 'DIAMOND_HANDS', name: '💎 มือเพชร', rarity: 'Epic',
        hypeBonus: 60,
        repBonus: 40,
        incomeBonus: 20,      // +20% รายได้ต่อรอบ
        salaryBonus: -10,
        loanBonus: 500000,
        stockBonus: 1.3,
        color: '#a335ee', dropRate: 5, minBid: 25000000
    },
    CRYPTO_WHALE: {
        id: 'CRYPTO_WHALE', name: '🐋 วาฬพิฆาต', rarity: 'Epic',
        hypeBonus: 80,
        repBonus: 20,
        incomeBonus: 25,      // +25% รายได้ต่อรอบ
        salaryBonus: 0,
        loanBonus: 700000,
        stockBonus: 1.4,
        color: '#a335ee', dropRate: 5, minBid: 20000000
    },
    UNICORN_FOUNDER: {
        id: 'UNICORN_FOUNDER', name: '🦄 ยูนิคอร์นตัวท็อป', rarity: 'Epic',
        hypeBonus: 50,
        repBonus: 50,
        incomeBonus: 15,
        salaryBonus: -15,
        loanBonus: 600000,
        stockBonus: 1.25,
        color: '#a335ee', dropRate: 5, minBid: 15000000
    },

    // 🔵 RARE
    MARKET_MAKER: {
        id: 'MARKET_MAKER', name: '📈 เจ้ามือ', rarity: 'Rare',
        hypeBonus: 25,
        repBonus: 20,
        incomeBonus: 8,       // +8% รายได้ต่อรอบ
        salaryBonus: -5,
        loanBonus: 200000,
        stockBonus: 1.1,
        color: '#0070dd', dropRate: 15, minBid: 5000000
    },
    WALLSTREET_WOLF: {
        id: 'WALLSTREET_WOLF', name: '🐺 หมาป่าแห่งตลาด', rarity: 'Rare',
        hypeBonus: 30,
        repBonus: 10,
        incomeBonus: 10,      // +10% รายได้ต่อรอบ
        salaryBonus: 0,
        loanBonus: 150000,
        stockBonus: 1.12,
        color: '#0070dd', dropRate: 15, minBid: 3000000
    },
    BULL_RIDER: {
        id: 'BULL_RIDER', name: '🐂 นักขี่กระทิง', rarity: 'Rare',
        hypeBonus: 20,
        repBonus: 25,
        incomeBonus: 7,
        salaryBonus: -5,
        loanBonus: 100000,
        stockBonus: 1.08,
        color: '#0070dd', dropRate: 15, minBid: 2000000
    },

    // 🟢 COMMON
    SAVVY_INVESTOR: {
        id: 'SAVVY_INVESTOR', name: '🧠 นักลงทุนอัจฉริยะ', rarity: 'Common',
        hypeBonus: 12,
        repBonus: 8,
        incomeBonus: 3,       // +3% รายได้ต่อรอบ
        salaryBonus: -2,
        loanBonus: 50000,
        stockBonus: 1.02,
        color: '#1eff00', dropRate: 74.98, minBid: 500000
    },
    DAY_TRADER: {
        id: 'DAY_TRADER', name: '☕ เทรดเดอร์สายชิล', rarity: 'Common',
        hypeBonus: 10,
        repBonus: 10,
        incomeBonus: 3,
        salaryBonus: 0,
        loanBonus: 30000,
        stockBonus: 1.02,
        color: '#1eff00', dropRate: 74.98, minBid: 300000
    },
    SMART_SAVER: {
        id: 'SMART_SAVER', name: '💰 นักออมมือโปร', rarity: 'Common',
        hypeBonus: 5,
        repBonus: 15,
        incomeBonus: 5,       // +5% รายได้ต่อรอบ (เน้นออม ลดเงินเดือนด้วย)
        salaryBonus: -8,
        loanBonus: 80000,
        stockBonus: 1.03,
        color: '#1eff00', dropRate: 74.98, minBid: 100000
    },

    // ⚪ STARTER
    ROOKIE_CEO: {
        id: 'ROOKIE_CEO', name: '🐣 CEO มือใหม่', rarity: 'Starter',
        hypeBonus: 3, repBonus: 2,
        incomeBonus: 1,       // +1%
        salaryBonus: 0,
        loanBonus: 10000, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 10000
    },
    SIDE_HUSTLE: {
        id: 'SIDE_HUSTLE', name: '🛵 สายรับจ้าง', rarity: 'Starter',
        hypeBonus: 2, repBonus: 5,
        incomeBonus: 2,
        salaryBonus: -2,
        loanBonus: 15000, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 15000
    },
    BUDGET_BOSS: {
        id: 'BUDGET_BOSS', name: '📋 บอสงบน้อย', rarity: 'Starter',
        hypeBonus: 5, repBonus: 0,
        incomeBonus: 2,
        salaryBonus: -5,      // ลดเงินเดือน 5% (เน้นประหยัด)
        loanBonus: 20000, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 20000
    },
    STREET_VENDOR: {
        id: 'STREET_VENDOR', name: '🍜 เจ้าพ่อหาบเร่', rarity: 'Starter',
        hypeBonus: 4, repBonus: 3,
        incomeBonus: 2,
        salaryBonus: 0,
        loanBonus: 0, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 25000
    },
    INTERN_MOGUL: {
        id: 'INTERN_MOGUL', name: '👔 เด็กฝึกงานมหาเศรษฐี', rarity: 'Starter',
        hypeBonus: 6, repBonus: 1,
        incomeBonus: 1,
        salaryBonus: -3,
        loanBonus: 30000, stockBonus: 1.01,
        color: '#aaaaaa', dropRate: 99, minBid: 30000
    },
    LOCAL_HERO: {
        id: 'LOCAL_HERO', name: '🌟 ฮีโร่ชุมชน', rarity: 'Starter',
        hypeBonus: 3, repBonus: 8,
        incomeBonus: 2,
        salaryBonus: -2,
        loanBonus: 25000, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 40000
    },
    HUSTLER: {
        id: 'HUSTLER', name: '⚡ นักสู้ชีวิต', rarity: 'Starter',
        hypeBonus: 7, repBonus: 0,
        incomeBonus: 3,       // ทำงานหนักได้เงินมากกว่าเพื่อน Starter
        salaryBonus: 0,
        loanBonus: 20000, stockBonus: 1.0,
        color: '#aaaaaa', dropRate: 99, minBid: 50000
    },
    LONE_WOLF: {
        id: 'LONE_WOLF', name: '🐺 หมาป่าโดดเดี่ยว', rarity: 'Starter',
        hypeBonus: 5, repBonus: 4,
        incomeBonus: 2,
        salaryBonus: -4,
        loanBonus: 35000, stockBonus: 1.01,
        color: '#aaaaaa', dropRate: 99, minBid: 60000
    },
    FRUGAL_TYCOON: {
        id: 'FRUGAL_TYCOON', name: '🪙 เจ้าสัวขี้เหนียว', rarity: 'Starter',
        hypeBonus: 2, repBonus: 5,
        incomeBonus: 3,
        salaryBonus: -8,      // ลดเงินเดือนพนักงาน 8%
        loanBonus: 50000, stockBonus: 1.01,
        color: '#aaaaaa', dropRate: 99, minBid: 75000
    },
    RISING_STAR: {
        id: 'RISING_STAR', name: '🌠 ดาวรุ่งพุ่งแรง', rarity: 'Starter',
        hypeBonus: 8, repBonus: 5,
        incomeBonus: 3,
        salaryBonus: 0,
        loanBonus: 40000, stockBonus: 1.01,
        color: '#aaaaaa', dropRate: 99, minBid: 90000
    }
};

const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const getSynchronizedAuctionItem = (timeBucket) => {
    const rand = seededRandom(timeBucket + 999);
    const keys = Object.keys(TITLES);

    const legendary = keys.filter(k => TITLES[k].rarity === 'Legendary');
    const epic = keys.filter(k => TITLES[k].rarity === 'Epic');
    const rare = keys.filter(k => TITLES[k].rarity === 'Rare');
    const common = keys.filter(k => TITLES[k].rarity === 'Common');
    const starter = keys.filter(k => TITLES[k].rarity === 'Starter');

    // Legendary 0.02% | Epic 5% | Rare 14.98% | Common 30% | Starter 50%
    if (rand <= 0.0002) return TITLES[legendary[Math.floor(seededRandom(timeBucket + 1) * legendary.length)]];
    if (rand <= 0.05) return TITLES[epic[Math.floor(seededRandom(timeBucket + 2) * epic.length)]];
    if (rand <= 0.20) return TITLES[rare[Math.floor(seededRandom(timeBucket + 3) * rare.length)]];
    if (rand <= 0.50) return TITLES[common[Math.floor(seededRandom(timeBucket + 4) * common.length)]];

    // 50% ที่เหลือ → Starter
    return TITLES[starter[Math.floor(seededRandom(timeBucket + 5) * starter.length)]];
};

export const getRandomAuctionItem = getSynchronizedAuctionItem;
