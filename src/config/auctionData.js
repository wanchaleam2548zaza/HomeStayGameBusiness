export const TITLES = {
    // 🔴 LEGENDARY (หายากมาก - เน้นพลังมหาศาล)
    WORLD_MONOPOLY: { id: 'WORLD_MONOPOLY', name: '👑 ผู้ผูกขาดโลก', rarity: 'Legendary', hypeBonus: 200, repBonus: 100, color: '#ff0055', dropRate: 0.01, minBid: 100000000 },
    ILLUMINATI_CEO: { id: 'ILLUMINATI_CEO', name: '👁️ ผู้อยู่เบื้องหลัง', rarity: 'Legendary', hypeBonus: 150, repBonus: 150, color: '#ff0055', dropRate: 0.01, minBid: 75000000 },

    // 🟣 EPIC (หายาก - โบนัสสูง)
    DIAMOND_HANDS: { id: 'DIAMOND_HANDS', name: '💎 มือเพชร', rarity: 'Epic', hypeBonus: 60, repBonus: 40, color: '#a335ee', dropRate: 5, minBid: 25000000 },
    CRYPTO_WHALE: { id: 'CRYPTO_WHALE', name: '🐋 วาฬพิฆาต', rarity: 'Epic', hypeBonus: 80, repBonus: 20, color: '#a335ee', dropRate: 5, minBid: 20000000 },
    UNICORN_FOUNDER: { id: 'UNICORN_FOUNDER', name: '🦄 ยูนิคอร์นตัวท็อป', rarity: 'Epic', hypeBonus: 50, repBonus: 50, color: '#a335ee', dropRate: 5, minBid: 15000000 },

    // 🔵 RARE (ปานกลาง - สำหรับผู้เล่นเริ่มมีฐานะ)
    MARKET_MAKER: { id: 'MARKET_MAKER', name: '📈 เจ้ามือ', rarity: 'Rare', hypeBonus: 25, repBonus: 20, color: '#0070dd', dropRate: 15, minBid: 5000000 },
    WALLSTREET_WOLF: { id: 'WALLSTREET_WOLF', name: '🐺 หมาป่าแห่งตลาด', rarity: 'Rare', hypeBonus: 30, repBonus: 10, color: '#0070dd', dropRate: 15, minBid: 3000000 },
    BULL_RIDER: { id: 'BULL_RIDER', name: '🐂 นักขี่กระทิง', rarity: 'Rare', hypeBonus: 20, repBonus: 25, color: '#0070dd', dropRate: 15, minBid: 2000000 },

    // 🟢 COMMON (พบง่าย - โบนัสเริ่มต้น)
    SAVVY_INVESTOR: { id: 'SAVVY_INVESTOR', name: '🧠 นักลงทุนอัจฉริยะ', rarity: 'Common', hypeBonus: 12, repBonus: 8, color: '#1eff00', dropRate: 74.98, minBid: 500000 },
    DAY_TRADER: { id: 'DAY_TRADER', name: '☕ เทรดเดอร์สายชิล', rarity: 'Common', hypeBonus: 10, repBonus: 10, color: '#1eff00', dropRate: 74.98, minBid: 300000 },
    SMART_SAVER: { id: 'SMART_SAVER', name: '💰 นักออมมือโปร', rarity: 'Common', hypeBonus: 5, repBonus: 15, color: '#1eff00', dropRate: 74.98, minBid: 100000 }
};

const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const getSynchronizedAuctionItem = (timeBucket) => {
    const rand = seededRandom(timeBucket + 999);
    const keys = Object.keys(TITLES);

    // กรองแยกตามความหายาก
    const legendary = keys.filter(k => TITLES[k].rarity === 'Legendary');
    const epic = keys.filter(k => TITLES[k].rarity === 'Epic');
    const rare = keys.filter(k => TITLES[k].rarity === 'Rare');
    const common = keys.filter(k => TITLES[k].rarity === 'Common');

    // สุ่มตาม Rate ที่กำหนด
    if (rand <= 0.0002) return TITLES[legendary[Math.floor(seededRandom(timeBucket + 1) * legendary.length)]]; // 0.02%
    if (rand <= 0.05) return TITLES[epic[Math.floor(seededRandom(timeBucket + 2) * epic.length)]];           // 5%
    if (rand <= 0.20) return TITLES[rare[Math.floor(seededRandom(timeBucket + 3) * rare.length)]];           // 15%

    // สุ่มในกลุ่ม Common
    return TITLES[common[Math.floor(seededRandom(timeBucket + 4) * common.length)]];
};

export const getRandomAuctionItem = getSynchronizedAuctionItem;
