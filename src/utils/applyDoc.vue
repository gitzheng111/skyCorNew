<!-- applyDoc.vue -->
<template>


    <el-dialog title="申请文件生成中" width="100%" v-model="visible" :close-on-click-modal="false" :before-close="handleClose" >
        <!-- 内容区域 -->
        <div v-if="loading" class="loading-container">
            <el-progress :percentage="progressPercent" />
            <p>模板加载中，请稍候...</p>
        </div>
        <div v-else style="   display: flex; flex-direction: column;   gap: 20px;height: 700px;">

            <!-- 预览区域 -->
            <div style=" flex: 1;  border: 1px solid #ccc;  overflow: auto; background: #fff; ">

                <!-- docx -->
                <filePreview v-if="fileGenerated && previewGenerate?.type === 'docx'" :file="previewGenerate"
                    v-model:visible="previewVisible" :inline="true" />

                <!-- xlsx -->
                <VueOfficeExcel v-else-if="fileGenerated && previewGenerate?.type === 'xlsx'" :src="previewGenerate.URL"
                    style="width: 100%; min-height: 100%;" />

            </div>


            <!-- 底部结果 -->
            <div style="text-align:center">

                <el-result icon="success" title="生成成功">

                    <template #extra>

                        <p>申请文件已生成，点击下方按钮下载。</p>

                        <el-button type="primary" @click="downloadDoc" :loading="downloading">
                            下载并上传申请文件
                        </el-button>

                    </template>

                </el-result>

            </div>

        </div>
        <!-- <div v-else class="result-layout" style="gap: 20px; min-height: 500px;">
            <div style="border: 1px solid #ccc; overflow: hidden;width: 100%;">
                <filePreview  v-if="fileGenerated && previewGenerate?.type === 'docx'" :file="previewGenerate"
                    v-model:visible="previewVisible" :inline="true" />

                <VueOfficeExcel v-else-if="fileGenerated && previewGenerate?.type === 'xlsx'"
                    :src="previewGenerate.URL" />
            </div>

            <div>
                <el-result icon="success" title="生成成功">
                    <template #extra>
                        <p>申请文件已生成，点击下方按钮下载。</p>
                        <el-button type="primary" @click="downloadDoc" :loading="downloading">下载并上传申请文件</el-button>
                    </template>
                </el-result>
            </div>
        </div> -->
    </el-dialog>
</template>


<script setup>
import { ref, watch, nextTick } from 'vue'
import { saveAs } from 'file-saver'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import mammoth from "mammoth";
// import { isFullUrl } from '@/utils/tools' // 你已有的工具函数
import { baseFileURL, updateTaskList, airportCodeList, generateExcel } from '../api.js' // 全局文件前缀
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import filePreview from '../utils/filePreview.vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { beijingToUTC, formatTimeWithoutColon, formatDateToCountry } from '../utils/timeTransfer.js';
// import XlsxTemplate from 'xlsx-template'
import * as XLSX from 'xlsx'
import VueOfficeExcel from "@vue-office/excel"
// import * as airportData from '../../node_modules/airport-data-js';
// import { saveAs } from "file-saver";
const props = defineProps({
    show: Boolean,
    curCountryInfo: Object,
    curCountryData: Object,
    attribution: String,
    curTaskData: Object,
    templatePath: Object,
})
const emit = defineEmits(['update:show'])
function isFullUrl(url) {
    return /^http?:\/\//.test(url)
}
const visible = ref(false)
const loading = ref(false)
const docBlob = ref(null)
const curCountryApplyData = ref()
watch(() => props.curCountryData, (newValue, oldValue) => {
    // 当 curCountryData 发生变化时，更新 curCountryApplyData
    console.log('curCountryData changed:', newValue)
    if (newValue) {
        curCountryApplyData.value = newValue || {};  // 假设 applyData 是需要的部分
        // console.log('curCountryApplyData.value',curCountryApplyData.value)
        // console.log('curCountryInfo.value',props.curCountryInfo)
        // console.log('curTaskData.value',props.curTaskData)

    }
}, { immediate: true });

const handleClose = () => {
    emit('update:show', false)
    emit('close')
}

const docBlobUrl = ref()
const previewVisible = ref(false)
const fileGenerated = ref(false)
function normalizeDays(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String);
    if (typeof input === "string") return input.split(""); // "1234567" → ["1","2","3","4","5","6","7"]
    return [];
}
function arrayToDaysObject(arr) {
    const obj = {};
    (arr || []).forEach((val, idx) => {
        obj[`day${idx + 1}`] = val;
    });
    return obj;
}
const returnCityName = (airport, code) => {
    // console.log('airportCodeList', airportCodeList, 'info', airport, code)
    // console.log('结果', airportCodeList.value.find(item => item[code] == airport)?.englishName)
    const match = airportCodeList.value.find(item => item[code] === airport);

    return match?.englishName ?? '无数据';
}
function calcFlightDuration(departureTime, arrivalTime) {
    if (!departureTime || !arrivalTime) return "00:00";

    const [depH, depM] = departureTime.split(":").map(Number);
    const [arrH, arrM] = arrivalTime.split(":").map(Number);

    let depMinutes = depH * 60 + depM;
    let arrMinutes = arrH * 60 + arrM;

    // 跨天情况
    if (arrMinutes < depMinutes) {
        arrMinutes += 24 * 60; // 加一天
    }

    const durationMinutes = arrMinutes - depMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    // 格式化为 HH:mm
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
function calcActualTime(departureTime, offsetTime) {
    if (!departureTime || !offsetTime) return "";

    // 统一格式去掉冒号
    const dep = departureTime.replace(":", "");
    const depH = parseInt(dep.slice(0, 2), 10);
    const depM = parseInt(dep.slice(2), 10);

    const offH = parseInt(offsetTime.slice(0, 2), 10);
    const offM = parseInt(offsetTime.slice(2), 10);

    let totalMinutes = (depH + offH) * 60 + (depM + offM);

    totalMinutes = totalMinutes % (24 * 60);

    const h = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");

    const depMinutes = depH * 60 + depM;
    // const arrMinutes = arrH * 60 + arrM;

    if (totalMinutes < depMinutes) {
        return `${h}${m}+1`; // 跨天
    }
    return `${h}${m}`;
    // return `${h}${m}`;
}
function transformFlightNumber(flightNumber) {
    if (!flightNumber) return "";
    // 提取数字部分
    const digits = flightNumber.match(/\d+$/);
    return digits ? `CXA${digits[0]}` : `CXA`;
}
//跨天处理
function getShowArrivalTime(departureTime, arrivalTime) {
    if (!departureTime || !arrivalTime) return "";
    const depUTC = beijingToUTC(departureTime)
    const arrUTC = beijingToUTC(arrivalTime)

    // 去掉冒号
    const dep = depUTC.replace(":", "");
    const arr = arrUTC.replace(":", "");
    // const arrUTC = formatTimeWithoutColon(beijingToUTC(arrivalTime))
    const depH = parseInt(dep.slice(0, 2), 10);
    const depM = parseInt(dep.slice(2), 10);
    const arrH = parseInt(arr.slice(0, 2), 10);
    const arrM = parseInt(arr.slice(2), 10);

    const depMinutes = depH * 60 + depM;
    const arrMinutes = arrH * 60 + arrM;

    if (arrMinutes < depMinutes) {
        return `${arr}+1`; // 跨天
    }
    return arr;
}
async function generateExcelFromTemplate(templateUrl, flightList) {
    // 1. 读取模板
    const res = await fetch(templateUrl)
    const arrayBuffer = await res.arrayBuffer()

    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // 2. 转成二维数组
    const sheetData = XLSX.utils.sheet_to_json(sheet, {
        header: 1, // 保留为二维数组
        defval: '',
    })

    // 3. 找到模板行（含 {{flightNumber}} 的那一行）
    const templateRowIndex = sheetData.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.includes('{{flightNumber}}'))
    )

    if (templateRowIndex === -1) {
        throw new Error('未找到模板行')
    }

    const templateRow = sheetData[templateRowIndex]

    // 4. 根据 flightList 循环生成新行
    const newRows = flightList.map(flight =>
        templateRow.map(cell => {
            if (typeof cell !== 'string') return cell

            return cell
                .replace('{{flightNumber}}', flight.flightNumber || '')
                .replace('{{departure}}', flight.departure || '')
                .replace('{{arrival}}', flight.arrival || '')
                .replace('{{startDate}}', flight.startDate || '')
                .replace('{{endDate}}', flight.endDate || '')
        })
    )

    // 5. 删除模板行，插入新行
    sheetData.splice(templateRowIndex, 1, ...newRows)

    // 6. 写回 worksheet
    const newSheet = XLSX.utils.aoa_to_sheet(sheetData)
    workbook.Sheets[sheetName] = newSheet

    // 7. 导出 Excel
    const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    return blob
}
// const generateExcel = async (data, templatePath) => {
//   // 1. 获取模板
//   const response = await fetch(templatePath);
//   const arrayBuffer = await response.arrayBuffer();

//   // 2. 初始化模板
//   const template = new XlsxTemplate(arrayBuffer);

//   // 3. 填充数据（第一个 sheet）
//   template.substitute(1, data);

//   // 4. 生成文件
//   const out = template.generate({ type: 'blob' });

//   return out;
// };
const excelBlobUrl = ref()
const previewGenerate = ref(null)
const generateDocNew = async () => {
    loading.value = true;
    console.log('变化前的申请数据curCountryApplyData.value', curCountryApplyData.value)

    if (!props.curCountryInfo || !props.curCountryInfo.scheduleTemplate) {
        console.error("scheduleTemplate 数据缺失!");
        loading.value = false;
        return;  // 如果缺少 scheduleTemplate，直接返回
    }

    try {
        console.log('传入的文档链接', props.templatePath)
        const templatePath = baseFileURL + props.templatePath.url;
        const ext = props.templatePath.url.split('.').pop().toLowerCase();
        console.log('templatePath', templatePath)

        const transformedFlightList = (curCountryApplyData.value.flightList || []).map(flight => {
            // console.log('111',formatDateToCountry(flight.startDate,props.curCountryData.overflyCountry,'blank'))
            const daysArray = normalizeDays(flight.days);
            return {
                ...flight,
                flightNumber: transformFlightNumber(flight.flightNumber),
                startDate: formatDateToCountry(flight.startDate, curCountryApplyData.value.overflyCountry, 'blank'),
                endDate: formatDateToCountry(flight.endDate, curCountryApplyData.value.overflyCountry, 'blank'),
                days: daysArray.join(""),
                daysArray,
                daysObject: arrayToDaysObject(daysArray),
                departureTime: formatTimeWithoutColon(beijingToUTC(flight.departureTime)),
                // arrivalTime: formatTimeWithoutColon(beijingToUTC(flight.arrivalTime)),
                arrivalTime: getShowArrivalTime(flight.departureTime, flight.arrivalTime),//实际显示的到达时间，会显示+1
                flyTime: formatTimeWithoutColon(calcFlightDuration(flight.departureTime, flight.arrivalTime))
            };
        });
        console.log('transformedFlightList', transformedFlightList)
        const uniqueSectors = [];
        const seen = new Set();

        transformedFlightList.forEach(flight => {
            const sector = `${flight.departure}-${flight.arrival}`;
            if (!seen.has(sector)) {
                seen.add(sector);
                uniqueSectors.push(sector);
            }
        });
        const sortedRouteList = [];
        uniqueSectors.forEach(sector => {
            const matched = (curCountryApplyData.value.overflyDetails || [])
                .filter(detail => detail.sector === sector);
            sortedRouteList.push(...matched);
        });
        // console.log('uniqueSectors', uniqueSectors)

        // console.log('sortedRouteList', sortedRouteList)
        const mergedFlights = transformedFlightList.map((flight, index) => {
            const sector = `${flight.departure}-${flight.arrival}`;
            const matchedRoute = (curCountryApplyData.value.overflyDetails || [])
                .find(detail => detail.sector === sector);

            return {
                id: index + 1,
                ...flight,
                cityNameOfDep: returnCityName(flight.departure, 'ICAOCode') || "无数据",
                cityNameOfArr: returnCityName(flight.arrival, 'ICAOCode') || "无数据",

                route: {
                    entryPoint: matchedRoute?.entryPoint || "无数据",
                    entryTime: matchedRoute?.entryTime || "无数据",
                    exitPoint: matchedRoute?.exitPoint || "无数据",
                    exitTime: matchedRoute?.exitTime || "无数据",
                    ATSroute: matchedRoute?.ATSroute || "无数据",
                    speed: matchedRoute?.speed || "无数据",
                    flightLevel: matchedRoute?.flightLevel || "无数据",
                    EET: matchedRoute?.EET || "无数据",
                    actualEntryTime: calcActualTime(flight.departureTime, matchedRoute?.entryTime),
                    actualExitTime: calcActualTime(flight.departureTime, matchedRoute?.exitTime),

                    altEntryPoint: Array.isArray(matchedRoute?.altEntryPoint)
                        ? matchedRoute.altEntryPoint.join(" ")
                        : "无数据",
                    altExitPoint: Array.isArray(matchedRoute?.altExitPoint)
                        ? matchedRoute.altExitPoint.join(" ")
                        : "无数据",

                },
                date: formatDateToCountry(new Date().toISOString().split("T")[0], curCountryApplyData.value.overflyCountry, 'outside'),

            };
        });
        console.log('mergedFlights', mergedFlights)
        // 3. 替换字段的数据
        const data = {
            // season:curS,
            country: props.curCountryInfo.country,
            date: formatDateToCountry(new Date().toISOString().split("T")[0], curCountryApplyData.value.overflyCountry, 'outside'),
            flightList: transformedFlightList || [],
            season: curCountryApplyData.value.season.toUpperCase() || '',
            attribution: props.attribution === 'SCHEDULED' ? 'SCHEDULED' : 'NONSCHEDULED',
             routeList: sortedRouteList || [],
            // routeList: curCountryApplyData.value.overflyDetails || [],
            routeList: sortedRouteList || [],
            aircraftTypeAll: curCountryApplyData.value?.aircraftTypeAll,
            mergedFlights,
            templatePath
        };
        console.log('ext', ext, '用来模板的data', data)
        if (ext == 'xlsx') {
            const blob = await handleXlsxTemplate(
                templatePath,
                data
            )
            console.log('bolb', blob)
            const url = URL.createObjectURL(blob)

            // handleXlsxTemplate(templatePath, data)
            // handleXlsxTemplateTest()
            // const excelResponse = await generateExcel(data)
            // console.log('excelResponse', excelResponse)
            // const excelBlob = new Blob(
            //     [excelResponse.data],
            //     {
            //         type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            //     }
            // )


            previewGenerate.value = {
                name: '预览申请文件',
                type: 'xlsx',
                URL: url,
                source: 'local',
                blob: blob,
            }
            loading.value = false;
            console.log('previewGenerate', previewGenerate.value)
            // console.log('excelResponse.data type:', typeof excelResponse.data)
            // console.log('is ArrayBuffer:', excelResponse.data instanceof ArrayBuffer)
            // console.log('is Uint8Array:', excelResponse.data instanceof Uint8Array)

        } else if (ext == 'docx') {
            // 1. 获取模板文件
            const response = await fetch(templatePath);
            const arrayBuffer = await response.arrayBuffer();
            const zip = new PizZip(arrayBuffer);

            // 2. 创建 Docxtemplater 实例
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
            // 4. 渲染模板
            doc.setData(data);

            try {
                doc.render();
            } catch (error) {
                console.error("模板渲染出错:", error);
                loading.value = false;
                return;
            }

            // 5. 输出为 Blob
            const out = doc.getZip().generate({
                type: "blob",
                mimeType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            docBlob.value = out;
            loading.value = false;
            previewGenerate.value = {
                name: '预览申请文件', type: 'docx', URL: URL.createObjectURL(out), source: 'local', blob: docBlob.value,
            }
            // docBlobUrl.value = { name: '预览申请文件', type: 'docx', URL: URL.createObjectURL(out), source: 'local', }
        }

        fileGenerated.value = true
        // console.log('docBlobUrl设置后', docBlobUrl.value)
        previewVisible.value = true

    } catch (err) {
        console.error("生成文档失败:", err);
        loading.value = false;
    }
};
import { renderXlsxTemplate, placeholderRange } from "exceljs-xlsx-template";

function handleXlsxTemplateTest() {
    console.log('测试')
    const xlsxFile =
        "https://raw.githubusercontent.com/cshaptx4869/exceljs-xlsx-template/refs/heads/main/test/assets/template.xlsx";
    const officialsealFile =
        "https://raw.githubusercontent.com/cshaptx4869/exceljs-xlsx-template/refs/heads/main/test/assets/officialseal.png";
    const imageUrl = "https://s2.loli.net/2025/03/07/ELZY594enrJwF7G.png";
    const data = [
        {
            name: "John",
            items: [
                { no: "No.1", name: "JavaScript" },
                { no: "No.2", name: "CSS" },
                { no: "No.3", name: "HTML" },
                { no: "No.4", name: "Node.js" },
                { no: "No.5", name: "Three.js" },
                { no: "No.6", name: "Vue" },
                { no: "No.7", name: "React" },
                { no: "No.8", name: "Angular" },
                { no: "No.9", name: "UniApp" },
            ],

            projects: [
                { name: "Project 1", description: "Description 1", image: imageUrl },
                { name: "Project 2", description: "Description 2", image: imageUrl },
                { name: "Project 3", description: "Description 3", image: imageUrl },
            ],
        },
        {
            invoice_number: "54548",
            last_name: "John",
            first_name: "Doe",
            phone: "00874****",
            invoice_date: "15/05/2008",
            items: [
                { name: "description", unit_price: 300 },
                { name: "HTML", unit_price: 400 },
            ],
            subtotal: 700,
            tax: 140,
            grand_total: 840,
        },
    ];

    try {
        renderXlsxTemplate(xlsxFile, data, `${Date.now()}.xlsx`, {
            parseImage: true,
            async beforeSave(workbook) {
                // 获取工作表
                const worksheet = workbook.getWorksheet("新报关单");
                if (worksheet) {
                    // 加载图片印章
                    const officialsealRresponse = await fetch(officialsealFile);
                    if (!officialsealRresponse.ok) {
                        console.error(`Failed to download image file, status code: ${officialsealRresponse.status}`);
                        return;
                    }
                    const officialsealArrayBuffer = await officialsealRresponse.arrayBuffer();
                    // 将图片添加到工作簿
                    const imageId = workbook.addImage({
                        buffer: officialsealArrayBuffer,
                        extension: "png",
                    });
                    // 获取印章占位符位置信息
                    const range = placeholderRange(worksheet, "{{#officialseal}}");
                    if (range) {
                        // 插入图片到表格中
                        worksheet.addImage(imageId, {
                            tl: { col: range.start.col, row: range.start.row - 4 },
                            ext: { width: 200, height: 200 },
                        });
                    }
                }
            },
        });
    } catch (error) {
        console.error("Error processing Excel file:", error);
    }
}
async function handleXlsxTemplate(template, data) {

    // const officialsealFile =
    //     "https://raw.githubusercontent.com/cshaptx4869/exceljs-xlsx-template/refs/heads/main/test/assets/officialseal.png";
        const officialsealFile = baseFileURL+"uploads/stamp/厦航印章.PNG"
    const res = await fetch(template)
    const buffer = await res.arrayBuffer()

    let outputBuffer = null

    await renderXlsxTemplate(
        buffer,
        [data],
        null,
        {
            parseImage: true,

            async beforeSave(workbook) {

                const worksheet =
                    workbook.getWorksheet("Sheet1");

                if (worksheet) {

                    const imgRes =
                        await fetch(officialsealFile)

                    const imgBuffer =
                        await imgRes.arrayBuffer()

                    const imageId =
                        workbook.addImage({
                            buffer: imgBuffer,
                            extension: "png",
                        })

                    const range =
                        placeholderRange(
                            worksheet,
                            "{{#officialseal}}"
                        )

                    if (range) {

                        worksheet.addImage(
                            imageId,
                            {
                                tl: {
                                    col: range.start.col,
                                    row: range.start.row - 4,
                                },
                                ext: {
                                    width: 200,
                                    height: 200,
                                },
                            }
                        )
                    }
                }

                // ⭐关键：自己生成buffer
                outputBuffer =
                    await workbook.xlsx.writeBuffer()
            },
        }
    )

    // ⭐这里才有值
    return new Blob(
        [outputBuffer],
        {
            type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
    )
}

// async function handleXlsxTemplate(template, data) {
//     console.log('template', template, 'data', data)
//     const xlsxFile = template
//     // "https://raw.githubusercontent.com/cshaptx4869/exceljs-xlsx-template/refs/heads/main/test/assets/template.xlsx";
//     const officialsealFile =
//         "https://raw.githubusercontent.com/cshaptx4869/exceljs-xlsx-template/refs/heads/main/test/assets/officialseal.png";
//     const imageUrl = "https://s2.loli.net/2025/03/07/ELZY594enrJwF7G.png";

//     try {
//         const res = await fetch(template)
//         const buffer = await res.arrayBuffer()
//         const result = await renderXlsxTemplate(buffer, [data], null, {
//             parseImage: true,
//             async beforeSave(workbook) {
//                 // 获取工作表
//                 const worksheet = workbook.getWorksheet("Sheet1");
//                 if (worksheet) {
//                     // 加载图片印章
//                     const officialsealRresponse = await fetch(officialsealFile);
//                     console.log('officialsealRresponse', officialsealRresponse)
//                     if (!officialsealRresponse.ok) {
//                         console.error(`Failed to download image file, status code: ${officialsealRresponse.status}`);
//                         return;
//                     }
//                     const officialsealArrayBuffer = await officialsealRresponse.arrayBuffer();
//                     // 将图片添加到工作簿
//                     const imageId = workbook.addImage({
//                         buffer: officialsealArrayBuffer,
//                         extension: "png",
//                     });
//                     // 获取印章占位符位置信息
//                     const range = placeholderRange(worksheet, "{{#officialseal}}");
//                     if (range) {
//                         // 插入图片到表格中
//                         worksheet.addImage(imageId, {
//                             tl: { col: range.start.col, row: range.start.row - 4 },
//                             ext: { width: 200, height: 200 },
//                         });
//                     }
//                 }
//             },
//         });

//         return new Blob(
//             [result],
//             {
//                 type:
//                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//             }
//         )
//     } catch (error) {
//         console.error("Error processing Excel file:", error);
//     }
// }
const docContentHtml = ref()
const templateUrl = baseFileURL + props.curCountryInfo.scheduleTemplate.url;
const readDocxContent = async () => {
    const res = await fetch(templateUrl);
    const arrayBuffer = await res.arrayBuffer();
    const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });
    // htmlContent 就是转换后的 html 字符串，里面包含文本和表格的html

    // 你可以赋值给一个ref，绑定到模板中显示
    docContentHtml.value = htmlContent;
    console.log('docContentHtml', docContentHtml)

};
// async function generateTemplate(type) {
//   const data = buildTemplateData();

//   if (type === 'word') return generateDocx(data);
//   if (type === 'excel') return generateExcel(data);
// }
function parseHtmlToDocxChildren(html, flights = []) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    const children = [];

    for (let node of body.childNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // 处理段落
        if (node.tagName === "P") {
            children.push(parseParagraph(node));
        }

        // 处理表格
        if (node.tagName === "TABLE") {
            const rows = [];
            const trElements = node.querySelectorAll("tr");

            let templateRowIndex = -1;

            trElements.forEach((tr, index) => {
                const hasVariable = tr.innerHTML.includes("{{");

                if (hasVariable && templateRowIndex === -1) {
                    templateRowIndex = index; // 记录模板行位置
                }

                if (!hasVariable) {
                    // 普通静态行
                    rows.push(parseTableRow(tr));
                }
            });

            if (templateRowIndex >= 0) {
                const templateTr = trElements[templateRowIndex];
                // 按 flightList 循环生成行
                flights.forEach((flight) => {
                    const row = parseTableRow(templateTr, flight);
                    rows.push(row);
                });
            }

            children.push(new Table({ rows }));
        }
    }

    return children;
}


// 处理段落 <p>
function parseParagraph(pNode) {
    const runs = [];
    pNode.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun(node.textContent));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const style = window.getComputedStyle(node);
            const text = node.textContent || "";
            const run = new TextRun({
                text,
                bold: style.fontWeight === "700" || node.tagName === "B",
                italics: node.tagName === "I",
                size: 24,
            });
            runs.push(run);
        }
    });

    return new Paragraph({ children: runs });
}

// 处理表格行 <tr>
function parseTableRow(tr, data = null) {
    const cells = [];
    tr.querySelectorAll("td,th").forEach((td) => {
        let text = td.textContent || "";

        if (data) {
            // 替换变量
            text = text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const trimmed = key.trim();
                return data[trimmed] || "";
            });
        }

        cells.push(
            new TableCell({
                children: [new Paragraph(text)],
            })
        );
    });

    return new TableRow({ children: cells });
}

// const downloadDoc = async () => {
//     if (!previewGenerate.value) return
//     //生成文件名的名字

//     const fileBolb = previewGenerate.value.blob
//     const fileType = previewGenerate.value.type

//     console.log('fileBolb', fileBolb)
//     console.log('fileType', fileType)

//     const currentDate = new Date();
//     const formattedDate = currentDate.toISOString().split('T')[0];
//     const timestamp = currentDate.getTime()
//     saveAs(fileBolb, `${curCountryApplyData.value.overflyCountry}-applicationForm-${timestamp}.${fileType}`)
//     // const encodedFileName = encodeURIComponent(fileName);
//     const file = new File([fileBolb], encodeURIComponent(`${curCountryApplyData.value.overflyCountry}-applicationForm-${timestamp}.${fileType}`), {
//         type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     });
//     console.log('上传的文件信息', file)
//     // console.log('curTaskData', props.curTaskData)

//     const formData = new FormData();

//     formData.append('taskKey', props.curTaskData.taskKey);
//     formData.append('id', props.curTaskData.id);
//     formData.append('country', curCountryApplyData.value.overflyCountry);
//     formData.append('file', file);
//     formData.append('updateTime', new Date().toISOString().split("T")[0]);
//     formData.append('action', 'upload');
//     console.log('taskData', props.curTaskData)
//     console.log('FormData 内容:');
//     for (let [key, val] of formData.entries()) {
//         console.log(`${key}:`, val);
//     }
//     try {
//         const res = await updateTaskList(formData)
//         console.log('res', res)
//         // const result = await res.json();
//         if (res.data.success) {
//             console.log('上传成功并更新 applyData:', res.data);
//             ElMessage.success(res.data.message)
//         } else {
//             console.error('上传失败:', res.message);
//         }
//     } catch (err) {
//         console.error('上传接口异常:', err);
//     }
// }
const downloadDoc = async () => {
    const { blob, type } = previewGenerate.value

    const timestamp = Date.now()
    const filename = `${curCountryApplyData.value.overflyCountry}-applicationForm-${timestamp}.${type}`

    // 1️⃣ 本地下载
    saveAs(blob, filename)

    // 2️⃣ 直接上传 blob（关键）
    const formData = new FormData()


    formData.append('taskKey', props.curTaskData.taskKey)
    formData.append('id', props.curTaskData.id)
    formData.append('country', curCountryApplyData.value.overflyCountry)
    formData.append('updateTime', new Date().toISOString().split("T")[0])
    formData.append('action', 'upload')
    formData.append('file', blob, filename)

    await updateTaskList(formData)
}
watch(() => props.show, (val) => {
    if (val) {
        visible.value = true
        nextTick(() => generateDocNew())
    } else {
        visible.value = false
    }
})

</script>