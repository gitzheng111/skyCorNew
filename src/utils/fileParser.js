import * as XLSX from 'xlsx';
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, updateRoutes, getOverflyData } from '../api.js';


/**
 * 从 Excel 文件中读取并解析飞越数据
 * @param {File} file - 上传的 Excel 文件
 * @returns {Object} - sheetDataMap：每个国家的飞越数据
 */
export const parseOverflyData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetDataMap = {};

        // 读取所有 sheet，并存入 sheetDataMap
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            sheetDataMap[sheetName] = rows;
        });

        return sheetDataMap;
    };
    reader.readAsArrayBuffer(file);
};

/**
 * 解析总表，结合飞越数据表中的规则，合并每条航线的飞越国家数据
 * @param {Array} totalRoutes - 总表的航线数据
 * @param {Object} overflyData - 飞越数据表中的数据（按国家分类）
 * @returns {Array} - 合并后的航线数据
 */

export const mergeRouteWithOverflyData = (totalRoutes, overflyData) => {
    return totalRoutes.map(route => {
        // Step 1: 处理 overflyCountry，确保是一个数组
        const countries = Array.isArray(route.overflyCountry)
            ? route.overflyCountry
            : String(route.overflyCountry).split(/\s+/).map(country => ({ country }));

        // Step 2: 逐个国家匹配飞越航路数据
        const overflyCountry = countries.map(country => {
            const countrySheetName = `${country.country}`;
            const countryData = overflyData[countrySheetName] || [];
            const normalizeRouteCode = (routeCode) => routeCode.replace(/\s+/g, '').toUpperCase();  // 去除空格并转换为大写

            // console.log(`${country.country}的countryData`, countryData)
            // Step 3: 查找匹配的航路数据
            const matchedData = countryData.filter(entry => {
                // 在匹配规则时可以根据需要增加条件
                // 比如基于 ATSroute 和 routeCode 进行筛选
                // console.log(`${route.routeCode}里${country.country}的entry`,entry)

                return (
                    entry.routeCode.includes(route.routeCode) && route.sector === entry.sector || route.sector === entry.sector       // 确保sector匹配
                );
            }).map(entry => {
                console.log('entry', entry)
                return {
                    ATSroute: entry['ATSroute'] || entry['ATSRoute'],
                    entryPoint: entry['entryPoint'] || entry['Entry Point'],
                    exitPoint: entry['exitPoint'] || entry['Exit Point'],
                    routeCode: entry['routeCode'] || entry['航线代号'],
                    EET: entry['EET'] || '',
                    entryTime: entry['entryTime'] || '',
                    exitTime: entry['exitTime'] || '',
                    speed: entry['speed'] || '',
                    flightLevel: entry['flightLevel'] || '',
                    altEntryPoint: entry['altEntryPoint'] || '',
                    altExitPoint: entry['altExitPoint'] || '',

                    season: entry['season'] || route.season,  // 默认使用当前航路的season
                    sector: entry['sector'] || route.sector   // 默认使用当前航路的sector
                };
            });
            // if(country.country=='越南'&&country.routeCode=='WIIIZUCK1'){
            //     console.log('越南countryData matchedData',country.routeCode,matchedData)
            // }
            // console.log(`${route.routeCode}里${country.country}的matchedData`,matchedData)
            return {
                country: country.country,
                overflyDetails: matchedData,
                needPermit: false,
                isPermit: false
            };
        });

        // Step 4: 返回合并后的数据
        return {
            ...route,
            overflyCountry
        };
    });
};

export const mergeNewOverflyData = async () => {
    const newOverflyResponse = await getOverflyData()
    const newOverflyData = newOverflyResponse.data

    const newRoutesResponse = await getRoutes()
    const newRoutesData = newRoutesResponse.data

    console.log('newOverflyData', newOverflyData)
    console.log('newRoutesData', newRoutesData)

    return newRoutesData.map(route => {
        // Step 1: 处理 overflyCountry，确保是一个数组
        const countries = Array.isArray(route.overflyCountry)
            ? route.overflyCountry
            : String(route.overflyCountry).split(/\s+/).map(country => ({ country }));

        // Step 2: 逐个国家匹配飞越航路数据
        const overflyCountry = countries.map(country => {
            const countryName = `${country.country}`;
            
            console.log('newOverflyData类型',typeof newOverflyData)
            const countryData = newOverflyData.find(item=>item.country === countryName || []);
            const normalizeRouteCode = (routeCode) => routeCode.replace(/\s+/g, '').toUpperCase();  // 去除空格并转换为大写
            console.log(`${country.country}的countryData`, countryData)

            // Step 3: 查找匹配的航路数据
            const matchedData = countryData.data.filter(entry => {
                // 在匹配规则时可以根据需要增加条件
                // 比如基于 ATSroute 和 routeCode 进行筛选
                // console.log(`${route.routeCode}里${country.country}的entry`,entry)

                return (
                    entry.data.routeCode.includes(route.routeCode) && route.sector === entry.sector || route.sector === entry.sector       // 确保sector匹配
                );
            }).map(entry => {
                console.log('entry', entry)
                return {
                    ATSroute: entry['ATSroute'] || entry['ATSRoute'],
                    entryPoint: entry['entryPoint'] || entry['Entry Point'],
                    exitPoint: entry['exitPoint'] || entry['Exit Point'],
                    routeCode: entry['routeCode'] || entry['航线代号'],
                    EET: entry['EET'] || '',
                    entryTime: entry['entryTime'] || '',
                    exitTime: entry['exitTime'] || '',
                    speed: entry['speed'] || '',
                    flightLevel: entry['flightLevel'] || '',
                    altEntryPoint: entry['altEntryPoint'] || '',
                    altExitPoint: entry['altExitPoint'] || '',

                    season: entry['season'] || route.season,  // 默认使用当前航路的season
                    sector: entry['sector'] || route.sector   // 默认使用当前航路的sector
                };
            });
            // if(country.country=='越南'&&country.routeCode=='WIIIZUCK1'){
            //     console.log('越南countryData matchedData',country.routeCode,matchedData)
            // }
            // console.log(`${route.routeCode}里${country.country}的matchedData`,matchedData)
            return {
                country: country.country,
                overflyDetails: matchedData,
                needPermit: false,
                isPermit: false
            };
        });

        // Step 4: 返回合并后的数据
        return {
            ...route,
            overflyCountry
        };
    });

}