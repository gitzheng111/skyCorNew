import { airportCodeList } from '../api'

/**
 * @param {string} input - 用户输入的内容，如 "PEK"、"ZBAA"、"北京"、"Beijing Capital"
 * @param {Array} airportCodeList - 机场列表数据，包含中文名、英文名、IATA、ICAO等字段
 * @returns {object|null} - 返回匹配到的机场对象，如果没找到则返回 null
 */
const emptyAirportForm = () => ({
    chineseName: '',
    englishName: '',
    ICAOCode: '',
    IATACode: ''
})
export const disMatchList = [] 

const matchAirport = (input) => {
    const airportCode = airportCodeList.value
    if (!input || !Array.isArray(airportCode)) return null
    const normalized = input.trim().toUpperCase()

    return airportCode.find(airport =>
        airport.IATACode?.toUpperCase() === normalized ||
        airport.ICAOCode?.toUpperCase() === normalized ||
        airport.chineseName === input ||
        airport.englishName?.toUpperCase() === normalized
    ) || null
}

const IATARegex = /^[A-Z]{3}$/
const ICAORegex = /^[A-Z]{4}$/

/**
 * @param {string} input - 用户输入值
 * @param {string} output - 需要的输出字段（IATACode、ICAOCode、chineseName、englishName）
 * @returns {string|null} - 匹配结果，或者 null
 */
export const transferToOutput = (input, output) => {
    const airportCode = airportCodeList.value
    // let disMatchList = {}

    if (!input || !output || !Array.isArray(airportCode)) return null
    input = input.trim()

    const match = matchAirport(input)

    if (match) {
        // 找到则返回指定字段，如果该字段不存在就返回原始输入
        return match[output] || input
    } else {
        // 没找到，放进 disMatchList
        const newEntry = emptyAirportForm()

        if (IATARegex.test(input.toUpperCase())) {
            newEntry.IATACode = input.toUpperCase()
        } else if (ICAORegex.test(input.toUpperCase())) {
            newEntry.ICAOCode = input.toUpperCase()
        } else if (/[\u4e00-\u9fa5]/.test(input)) {
            newEntry.chineseName = input
        } else {
            newEntry.englishName = input
        }
        const exists = disMatchList.some(item =>
            item.IATACode === newEntry.IATACode &&
            item.ICAOCode === newEntry.ICAOCode &&
            item.chineseName === newEntry.chineseName &&
            item.englishName === newEntry.englishName
        )

        if (!exists) {
            disMatchList.push(newEntry)
        }
        // disMatchList.push(newEntry)
        console.log('未匹配机场:', disMatchList)
        return input
    }
}
