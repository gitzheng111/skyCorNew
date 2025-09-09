import { airportCodeList } from '../api'
/**
 * @param {string} input - 用户输入的内容，如 "PEK"、"ZBAA"、"北京"、"Beijing Capital"
 * @param {string} output - 你希望输出的字段，例如 'IATACode'、'ICAOCode'、'chineseName'、'englishName'
 * @param {Array} airportCodeList - 机场列表数据，包含中文名、英文名、IATA、ICAO等字段
 */
export const transferToOutput = (input, output) => {
    // console.log('使用')
    const airportCode = airportCodeList.value
    console.log('input',input,'output',output)
    console.log('airportCodeList',airportCode)

    if (!input || !output || !Array.isArray(airportCode)) return null;
    input = input.trim().toUpperCase();

    const match = airportCode.find(airport => {
        return (
            airport.IATACode?.toUpperCase() === input ||
            airport.ICAOCode?.toUpperCase() === input ||
            airport.chineseName === input ||
            airport.englishName?.toLowerCase() === input.toLowerCase()
        );
    });
    console.log('match',match)

    return match ? match[output] || null : null;
};
