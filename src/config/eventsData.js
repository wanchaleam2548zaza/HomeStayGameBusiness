export const BUSINESS_TYPES = {
  homestay: {
    id: 'homestay',
    name: 'โฮมสเตย์',
    icon: '🏠',
    unitName: 'ห้องพัก',
    desc: "เน้นการบริการและชื่อเสียง เหมาะสำหรับผู้เริ่มต้น",
    risks: "พายุเข้า, โรคระบาด, รีวิวแง่ลบ",
    maxLoss: "80% ของรายได้หากโดนสั่งปิด"
  },
  logistics: {
    id: 'logistics',
    name: 'บริษัทขนส่ง',
    icon: '🚛',
    unitName: 'รถขนส่ง',
    desc: "เน้นความเร็วและต้นทุนเชื้อเพลิง รายได้สูงแต่ค่าใช้จ่ายผันผวน",
    risks: "น้ำมันพุ่งสูง, อุบัติเหตุ, ระบบไอทีล่ม",
    maxLoss: "ขาดทุนต่อเนื่องจนล้มละลายได้ถ้าคุมต้นทุนไม่อยู่"
  },
  cafe: {
    id: 'cafe',
    name: 'คาเฟ่',
    icon: '☕',
    unitName: 'สาขา',
    desc: "เน้นกระแสสังคมและวัตถุดิบคุณภาพ รายได้คงที่",
    risks: "วัตถุดิบขาดแคลน, ฝนตกหนัก, คู่แข่งเปิดใหม่",
    maxLoss: "70% ของกำไรสะสมในรอบนั้น"
  },
  tech: {
    id: 'tech',
    name: 'บริษัทไอที',
    icon: '💻',
    unitName: 'เซิร์ฟเวอร์',
    desc: "เน้นนวัตกรรมและเทคโนโลยี รายรับมหาศาลถ้าเป็นไวรัล",
    risks: "การโดนแฮก, ลิขสิทธิ์ซอฟต์แวร์, ระบบล่ม",
    maxLoss: "350% ของรายได้ (เสียค่าปรับมหาศาล)"
  },
  farm: {
    id: 'farm',
    name: 'ฟาร์มเกษตร',
    icon: '🌾',
    unitName: 'ไร่',
    desc: "เน้นธรรมชาติและโควต้าส่งออก ธุรกิจพื้นฐานที่ยั่งยืน",
    risks: "โรคระบาดในพืช, ภัยแล้ง, ราคาตลาดโลกตกต่ำ",
    maxLoss: "300% ของผลผลิตในรอบถัดไป"
  }
};

// 🟢 เหตุการณ์สุ่มปกติ (เพิ่มให้หลากหลายขึ้น)
const NORMAL_EVENTS = {
  homestay: [
    { msg: "🌞 ไฮซีซั่น: นักท่องเที่ยวแห่จองที่พัก!", multi: 1.5 },
    { msg: "⛈️ พายุเข้า: ลูกค้ายกเลิกการจองบางส่วน", multi: 0.7 },
    { msg: "📸 บล็อกเกอร์รีวิว: ที่พักกลายเป็นไวรัล!", multi: 2.0 },
    { msg: "🛠️ ปัญหาท่อประปา: ต้องปิดซ่อมบางห้อง", multi: 0.8 },
    { msg: "🏆 ได้รางวัลที่พักดีเด่น: คนเชื่อมั่นมากขึ้น", multi: 1.3 }
  ],
  logistics: [
    { msg: "📦 เทศกาลช้อปปิ้ง 11.11: ออเดอร์ล้นมือ!", multi: 1.8 },
    { msg: "⛽ วิกฤตน้ำมันแพง: ต้นทุนค่าขนส่งพุ่งสูง", multi: 0.6 },
    { msg: "🛣️ ทางด่วนเปิดใหม่: ส่งของได้ไวขึ้น", multi: 1.3 },
    { msg: "🚧 อุบัติเหตุทางหลวง: รถติดส่งของล่าช้า", multi: 0.8 },
    { msg: "🤝 เซ็นสัญญาแบรนด์ใหญ่: รับส่งของผูกขาด", multi: 1.5 }
  ],
  cafe: [
    { msg: "📸 เมนูใหม่เป็นไวรัลใน TikTok!", multi: 1.8 },
    { msg: "🥛 วัตถุดิบขาดแคลน: นมสดขาดตลาด", multi: 0.7 },
    { msg: "☕ เมล็ดกาแฟนำเข้าได้ราคาถูก: กำไรเพิ่ม", multi: 1.3 },
    { msg: "🌧️ ฝนตกหนักทั้งสัปดาห์: คนไม่ออกจากบ้าน", multi: 0.6 },
    { msg: "⭐ ดาราแวะมากิน: แฟนคลับแห่ตามรอย", multi: 2.0 }
  ],
  tech: [
    { msg: "🚀 AI ตัวใหม่ทำงานได้ดีเยี่ยม: ยอดใช้งานพุ่ง!", multi: 1.8 },
    { msg: "👾 เซิร์ฟเวอร์ล่มจากการโดนแฮ็ก: ระบบดาวน์", multi: 0.5 },
    { msg: "💡 เปิดตัวฟีเจอร์ใหม่: ผู้ใช้งานตอบรับดี", multi: 1.4 },
    { msg: "⚖️ โดนฟ้องร้องเรื่องลิขสิทธิ์: เสียค่าทนาย", multi: 0.7 },
    { msg: "🤝 บริษัทยักษ์ใหญ่ขอเป็นพาร์ทเนอร์!", multi: 2.0 }
  ],
  farm: [
    { msg: "🌧️ ฝนตกต้องตามฤดูกาล: ผลผลิตงอกงาม!", multi: 1.5 },
    { msg: "🐛 ภัยแล้งและแมลงระบาด: ผลผลิตเสียหายหนัก", multi: 0.5 },
    { msg: "🌱 ค้นพบปุ๋ยสูตรใหม่: เร่งโตได้ไวขึ้น", multi: 1.3 },
    { msg: "📉 ราคาพืชผลตกต่ำทั่วประเทศ", multi: 0.7 },
    { msg: "✈️ ได้โควต้าส่งออกต่างประเทศ: กำไรมหาศาล", multi: 2.0 }
  ]
};

// 🚨 ข่าวด่วนที่มีเวลาจำกัด (Global Interactive Events - เพิ่มเพียบ!)
const GLOBAL_BREAKING_NEWS = [
  {
    id: "pandemic",
    msg: "🚨 วิกฤตระดับโลก: โรคระบาดสายพันธุ์ใหม่! รัฐสั่งคุมเข้ม",
    affectedTypes: ['homestay', 'cafe', 'logistics', 'tech', 'farm'], // ทุกอาชีพโดนหมด
    duration: 60,
    choices: [
      { text: "ล็อกดาวน์ชั่วคราว (ปลอดภัย)", effectMulti: 0.5, hypeChange: -10, logMsg: "คุณเลือกล็อกดาวน์: รายได้ลดลงแต่ปลอดภัย (Hype -10%)" },
      { text: "ฝืนเปิดโปรสู้กระแส (เสี่ยง)", isRisky: true, successRate: 0.5, success: { effectMulti: 2.5, hypeChange: +30, logMsg: "🎉 รอดตัว! กำไรพุ่งกระฉูด! (Hype +30%)" }, fail: { effectMulti: -2.0, hypeChange: -20, logMsg: "💥 พังพินาศ! โดนสั่งปิดและปรับหนัก! (Hype -20%)" } }
    ],
    timeoutPenalty: { effectMulti: -5.0, hypeChange: -40, logMsg: "💥 หายนะ! เพิกเฉยต่อคำสั่งจนโดนยึดทรัพย์! (Hype -40%)" }
  },
  {
    id: "cyber_attack",
    msg: "👾 ไวรัสเรียกค่าไถ่: ระบบธนาคารและไอทีทั่วโลกถูกโจมตี!",
    affectedTypes: ['tech', 'logistics'],
    duration: 60,
    choices: [
      { text: "จ่ายค่าไถ่ (เสียเงินทันที)", effectMulti: 0.7, hypeChange: -5, logMsg: "คุณยอมจ่ายเพื่อกู้ระบบกลับมาอย่างรวดเร็ว (Hype -5%)" },
      { text: "จ้างแฮกเกอร์สู้ (เสี่ยง)", isRisky: true, successRate: 0.4, success: { effectMulti: 1.8, hypeChange: +40, logMsg: "🛡️ สำเร็จ! ระบบปลอดภัยและได้รับเงินรางวัลนำจับ (Hype +40%)" }, fail: { effectMulti: -3.5, hypeChange: -30, logMsg: "💸 ล้มเหลว! ข้อมูลสูญหายและโดนดูดเงินหมดพอร์ต! (Hype -30%)" } }
    ],
    timeoutPenalty: { effectMulti: -4.0, hypeChange: -40, logMsg: "💀 ระบบล่มสลาย! ข้อมูลลูกค้าถูกทำลายหมดสิ้น (Hype -40%)" }
  },
  {
    id: "solar_flare",
    msg: "☀️ พายุสุริยะ: ระบบดาวเทียมและไฟฟ้าขัดข้องทั่วโลก!",
    affectedTypes: ['tech', 'logistics', 'farm'],
    duration: 60,
    choices: [
      { text: "ใช้ระบบสำรองอนาล็อก", effectMulti: 0.6, hypeChange: -15, logMsg: "งานเดินช้าลงแต่ไม่หยุดชะงัก (Hype -15%)" },
      { text: "เดินเครื่องเต็มกำลัง (เสี่ยง)", isRisky: true, successRate: 0.3, success: { effectMulti: 3.0, hypeChange: +50, logMsg: "⚡ ปาฏิหาริย! เครื่องจักรไม่พัง แถมทำงานไวขึ้นเท่าตัว (Hype +50%)" }, fail: { effectMulti: -4.5, hypeChange: -40, logMsg: "🔥 หม้อแปลงระเบิด! กิจการหยุดชะงักถาวร (Hype -40%)" } }
    ],
    timeoutPenalty: { effectMulti: -3.0, hypeChange: -30, logMsg: "📟 ไฟดับทั้งบริษัท! รายได้เป็นศูนย์ชั่วคราว (Hype -30%)" }
  },
  {
    id: "olympic_games",
    msg: "🏅 กีฬาโอลิมปิก: เมืองของคุณได้รับเลือกเป็นเจ้าภาพ!",
    affectedTypes: ['homestay', 'cafe'],
    duration: 60,
    choices: [
      { text: "ปรับปรุงสาขาต้อนรับ", effectMulti: 1.5, hypeChange: +20, logMsg: "ยอดจองล้นหลามจากการเตรียมตัวที่ดี (Hype +20%)" },
      { text: "ปั่นราคาสามเท่า (เสี่ยง)", isRisky: true, successRate: 0.6, success: { effectMulti: 4.5, hypeChange: +60, logMsg: "💰 รวยเละ! นักท่องเที่ยวรวยๆ ยอมจ่ายไม่อั้น (Hype +60%)" }, fail: { effectMulti: -1.0, hypeChange: -50, logMsg: "👎 โดนประณาม! ติดแบล็คลิสต์จนไม่มีใครเข้าอีกเลย (Hype -50%)" } }
    ],
    timeoutPenalty: { effectMulti: 0.8, hypeChange: -10, logMsg: "🐌 เตรียมตัวไม่ทัน! เสียโอกาสรับลูกค้ามหาศาล (Hype -10%)" }
  },
  {
    id: "oil_crisis",
    msg: "⛽ วิกฤตน้ำมัน: ราคาน้ำมันโลกพุ่งขึ้น 300%!",
    affectedTypes: ['logistics', 'farm'],
    duration: 60,
    choices: [
      { text: "ปรับขึ้นค่าบริการ", effectMulti: 1.1, hypeChange: -5, logMsg: "ลูกค้าบ่นนิดหน่อยแต่ธุรกิจยังไปได้ (Hype -5%)" },
      { text: "เปลี่ยนใช้รถไฟฟ้า (เสี่ยง)", isRisky: true, successRate: 0.5, success: { effectMulti: 2.2, hypeChange: +45, logMsg: "🌱 คุมค่า! ประหยัดค่าเชื้อเพลิงได้ถาวร (Hype +45%)" }, fail: { effectMulti: -2.0, hypeChange: -10, logMsg: "🔌 แบตเตอรี่ระเบิด! ค่าซ่อมแพงกว่าค่าน้ำมัน 10 เท่า (Hype -10%)" } }
    ],
    timeoutPenalty: { effectMulti: 0.4, hypeChange: -25, logMsg: "🚚 ขนส่งชะงัก! โดนค่าปรับส่งของล่าช้า (Hype -25%)" }
  },
  {
    id: "green_energy",
    msg: "🌱 นโยบายสีเขียว: รัฐบาลแจกเงินอุดหนุนธุรกิจรักษ์โลก!",
    affectedTypes: ['farm', 'tech', 'logistics', 'homestay', 'cafe'],
    duration: 60,
    choices: [
      { text: "ติดตั้งโซลาร์เซลล์", effectMulti: 1.3, hypeChange: +25, logMsg: "ลดต้นทุนระยะยาวและได้ภาพลักษณ์ดี (Hype +25%)" },
      { text: "ปลอมแปลงเอกสารขอทุน (เสี่ยง)", isRisky: true, successRate: 0.2, success: { effectMulti: 5.0, hypeChange: +70, logMsg: "🎰 สำเร็จ! ได้เงินก้อนโตมาขยายกิจการฟรีๆ (Hype +70%)" }, fail: { effectMulti: -6.0, hypeChange: -40, logMsg: "👮 โดนจับ! ติดคุกและโดนสั่งปิดบริษัททันที (Hype -40%)" } }
    ],
    timeoutPenalty: { effectMulti: 1.0, hypeChange: -5, logMsg: "💨 พลาดโอกาสทอง! รัฐบาลปิดรับสมัครทุนแล้ว (Hype -5%)" }
  }
];

// 🟢 ฟังก์ชัน Seeded Random (สร้างสุ่มจากตัวเลขเวลา)
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// 🟢 ระบบดึง Event ให้ทุกคน "เหมือนกันเป๊ะ" และ "ลดโอกาสการเกิดซ้ำ"
export const getSynchronizedEvent = (businessType, timeBucket) => {
  const rand = seededRandom(timeBucket);

  // โอกาส 40% ที่จะเกิดข่าวด่วนในรอบเวลานั้น
  const isInteractive = rand < 0.40;

  if (isInteractive) {
    const poolSize = GLOBAL_BREAKING_NEWS.length;
    // ใช้รหัสรอบเวลาในการเลือกข่าว เพื่อให้ทุกคนได้ข่าวเดียวกัน
    const finalIndex = timeBucket % poolSize;
    const event = GLOBAL_BREAKING_NEWS[finalIndex];

    // ตรวจสอบว่าสายธุรกิจนี้ได้รับผลกระทบหรือไม่
    if (event.affectedTypes && !event.affectedTypes.includes(businessType)) {
      // ถ้าไม่โดนผลกระทบจากข่าวโลก ให้ดึงเหตุการณ์ปกติของธุรกิจนั้นแทน
      const bEvents = NORMAL_EVENTS[businessType] || NORMAL_EVENTS.homestay;
      const normalIndex = Math.floor(seededRandom(timeBucket + 123) * bEvents.length);
      return { ...bEvents[normalIndex], isNormal: true };
    }

    return event;
  } else {
    // ถ้าไม่เกิดข่าวด่วน ให้เป็นเหตุการณ์ปกติของธุรกิจนั้นๆ
    const bEvents = NORMAL_EVENTS[businessType] || NORMAL_EVENTS.homestay;
    const normalIndex = Math.floor(seededRandom(timeBucket + 123) * bEvents.length);
    return { ...bEvents[normalIndex], isNormal: true };
  }
};
