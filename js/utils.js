import { i18n } from "./config.js";

/** 根據稀有度回傳 CSS 樣式 */
export function getRarityStyle(r) {
    const styles = { 
        Legend: 'bg-amber-50 text-amber-600 border-amber-200', 
        Hero: 'bg-red-50 text-red-600 border-red-200', 
        Rare: 'bg-purple-50 text-purple-600 border-purple-200', 
        High: 'bg-blue-50 text-blue-600 border-blue-200', 
        Constellation: 'bg-indigo-900 text-white border-indigo-950', 
        Goddess: 'bg-sky-50 text-sky-600 border-sky-200', 
        Normal: 'bg-emerald-50 text-emerald-600 border-emerald-200', 
        Training: 'bg-slate-100 text-slate-500 border-slate-300' 
    };
    return styles[r] || 'bg-slate-50 text-slate-400 border-slate-200';
}

/** 取得稀有度的在地化名稱 */
export function getRarityName(rarityVal, lang) {
    const rarityObj = i18n[lang].rarityOptions.find(o => o.val === rarityVal);
    return rarityObj ? rarityObj.lab : rarityVal;
}

/** 處理數值計算（Lv.11後跳轉邏輯） */
export function calculateValue(item, level) {
    const baseValue = item.valueBase || 0;
    const m1 = item.valuePerLevel || 0;
    const m2 = item.valuePerLevelLv11 !== undefined ? item.valuePerLevelLv11 : m1;
    
    if (level <= 10) {
        return baseValue + (level - 1) * m1;
    } else {
        return (baseValue + 9 * m1) + (level - 10) * m2;
    }
}