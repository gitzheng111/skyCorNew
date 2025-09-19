<!-- applyDoc.vue -->
<template>


    <el-dialog title="申请文件生成中" width="98%" v-model="visible" :close-on-click-modal="false" :before-close="handleClose">
        <!-- 内容区域 -->
        <div v-if="loading" class="loading-container">
            <el-progress :percentage="progressPercent" />
            <p>模板加载中，请稍候...</p>
        </div>

        <div v-else class="result-layout" style="display: flex; gap: 20px; min-height: 500px;">
            <!-- 左侧预览 -->
            <div style="flex: 1; border: 1px solid #ccc; overflow: hidden;">
                <filePreview v-if="fileGenerated && docBlobUrl" :file="docBlobUrl" v-model:visible="previewVisible"
                    :inline="true" />
            </div>

            <!-- 右侧成功提示 -->
            <div style="flex: 1;">
                <el-result icon="success" title="生成成功">
                    <template #extra>
                        <p>申请文件已生成，点击下方按钮下载。</p>
                        <el-button type="primary" @click="downloadDoc" :loading="downloading">下载申请文件</el-button>
                    </template>
                </el-result>
            </div>
        </div>
    </el-dialog>
</template>


<script setup>
import { ref, watch, nextTick } from 'vue'
import { saveAs } from 'file-saver'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import mammoth from "mammoth";
// import { isFullUrl } from '@/utils/tools' // 你已有的工具函数
import { baseFileURL, updateTaskList, airportCodeList } from '../api.js' // 全局文件前缀
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import filePreview from '../utils/filePreview.vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { beijingToUTC, formatTimeWithoutColon, formatDateToCountry } from '../utils/timeTransfer.js';
// import * as airportData from '../../node_modules/airport-data-js';
// import { saveAs } from "file-saver";
const props = defineProps({
    show: Boolean,
    curCountryInfo: Object,
    curCountryData: Object,
    attribution: String,
    curTaskData: Object,
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
    if (newValue) {
        curCountryApplyData.value = newValue|| {};  // 假设 applyData 是需要的部分
        console.log('curCountryApplyData.value',curCountryApplyData.value)
        // console.log('curCountryInfo.value',props.curCountryInfo)
        // console.log('curTaskData.value',props.curTaskData)

    }
}, { immediate: true });  
// watch(
//     [() => props.curCountryInfo, () => props.curTaskData], // 监听 curCountryInfo 和 curTaskData
//     (newValues, oldValues) => {
//         const [newCountryInfo, newTaskData] = newValues;
//         // 如果 curCountryInfo 和 curTaskData 都有值
//         if (newCountryInfo && newTaskData) {
//             // 根据 curTaskData 中的数据找到对应的 country
//             const countryData = newTaskData.data.find(
//                 (item) => item.overflyCountry === newCountryInfo.country
//             );
//             if (countryData) {
//                 curCountryApplyData.value = countryData; // 更新 curCountryApplyData
//                 console.log('更新后的 curCountryApplyData:', curCountryApplyData.value);
//             } else {
//                 console.log('没有找到匹配的 country 数据');
//             }
//         }

//         // console.log('curCountryInfo:', newCountryInfo);
//         // console.log('curTaskData:', newTaskData);
//     },
//     { immediate: true } // 立即执行回调
// );
const handleClose = () => {
    emit('update:show', false)
    emit('closed')
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
    console.log('airportCodeList', airportCodeList, 'info', airport, code)
    console.log('结果', airportCodeList.value.find(item => item[code] == airport)?.englishName)
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
const generateDocNew = async () => {
    loading.value = true;
    console.log('变化前的申请数据curCountryApplyData.value', curCountryApplyData.value)

    if (!props.curCountryInfo || !props.curCountryInfo.scheduleTemplate) {
        console.error("scheduleTemplate 数据缺失!");
        loading.value = false;
        return;  // 如果缺少 scheduleTemplate，直接返回
    }

    try {
        const templatePath = baseFileURL + props.curCountryInfo.scheduleTemplate.url;

        // 1. 获取模板文件
        const response = await fetch(templatePath);
        const arrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(arrayBuffer);

        // 2. 创建 Docxtemplater 实例
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });
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
                arrivalTime: formatTimeWithoutColon(beijingToUTC(flight.arrivalTime)),
                showArrivalTime: getShowArrivalTime(flight.departureTime, flight.arrivalTime),//实际显示的到达时间，会显示+1
                flyTime: formatTimeWithoutColon(calcFlightDuration(flight.departureTime, flight.arrivalTime))
            };
        });
        console.log('transformedFlightList', transformedFlightList)
        const sortedRouteList = [];
        transformedFlightList.forEach(flight => {
            const sector = `${flight.departure}-${flight.arrival}`;
            const matched = (curCountryApplyData.value.overflyDetails || [])
                .filter(detail => detail.sector === sector);
            sortedRouteList.push(...matched);
        });
        console.log('sortedRouteList', sortedRouteList)
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
                // entryPoint: matchedRoute?.entryPoint || "无数据",
                // entryTime: matchedRoute?.entryTime || "无数据",
                // exitPoint: matchedRoute?.exitPoint || "无数据",
                // exitTime: matchedRoute?.exitTime || "无数据",
            };
        });
        console.log('mergedFlights', mergedFlights)
        // 3. 替换字段的数据
        const data = {
            country: props.curCountryInfo.country,
            date: formatDateToCountry(new Date().toISOString().split("T")[0], curCountryApplyData.value.overflyCountry, 'outside'),
            flightList: transformedFlightList || [],
            // routeList: curCountryApplyData.value.overflyDetails || [],
            routeList: sortedRouteList || [],
            aircraftTypeAll: curCountryApplyData.value?.aircraftTypeAll,
            mergedFlights
        };
        console.log('用来模板的data', data)
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
        console.log('docBlobUrl.value 设置前', docBlobUrl.value)

        docBlobUrl.value = { type: 'docx', URL: URL.createObjectURL(out), source: 'local', }
        fileGenerated.value = true
        console.log('docBlobUrl设置后', docBlobUrl.value)
        previewVisible.value = true

    } catch (err) {
        console.error("生成文档失败:", err);
        loading.value = false;
    }
};
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

const downloadDoc = async () => {
    if (!docBlob.value) return
    //生成文件名的名字
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const timestamp = currentDate.getTime()
    saveAs(docBlob.value, `${curCountryApplyData.value.overflyCountry}-applicationForm-${timestamp}.docx`)
    console.log('docBlob.value', docBlob.value)
    // const encodedFileName = encodeURIComponent(fileName);
    const file = new File([docBlob.value], encodeURIComponent(`${curCountryApplyData.value.overflyCountry}-applicationForm-${timestamp}.docx`), {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    console.log('上传的文件信息', file)
    // console.log('curTaskData', props.curTaskData)

    const formData = new FormData();

    formData.append('taskKey', props.curTaskData.taskKey);
    formData.append('id', props.curTaskData.id);
    formData.append('country', curCountryApplyData.value.overflyCountry);
    formData.append('file', file);
    formData.append('updateTime', new Date().toISOString().split("T")[0]);
    formData.append('action', 'upload');
    console.log('taskData', props.curTaskData)
    console.log('FormData 内容:');
    for (let [key, val] of formData.entries()) {
        console.log(`${key}:`, val);
    }
    try {
        const res = await updateTaskList(formData)
        console.log('res', res)
        // const result = await res.json();
        if (res.data.success) {
            console.log('上传成功并更新 applyData:', res.data);
            ElMessage.success(res.data.message)
        } else {
            console.error('上传失败:', res.message);
        }
    } catch (err) {
        console.error('上传接口异常:', err);
    }
}

watch(() => props.show, async (val) => {
    visible.value = val
    console.log('开始生成', visible)
    if (val) {
        await nextTick()
        // await generateDoc()
        await generateDocNew()

    }
})
</script>