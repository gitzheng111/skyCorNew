<template>
    <el-dialog v-model="showAddRoute" :title="isEditing ? '批量编辑航路' : '新增航路'" width="95%">
        <!-- 模式选择 -->

        <div class="dialog-body">



            <el-select v-model="mode" placeholder="请选择输入方式" style="margin-bottom: 20px;">
                <el-option v-for="item in modeOption" :key="item" :label="modeLabels[item]" :value="item" />
            </el-select>

            <!-- 手动新增 -->
            <div v-if="mode == 'manAdd'">
                <div v-for="(form, index) in addRouteForms" :key="index"
                    style="border-bottom: 1px solid #eee; padding: 10px 0">
                    <el-form ref="formRef" :model="form" label-width="100px">
                        <el-form-item label="航季">
                            <SeasonSelect v-model="form.season" />
                        </el-form-item>
                        <el-form-item label="起飞机场">
                            <AirportAutocomplete v-model="form.departure" @select="handleDepartureSelect" />
                        </el-form-item>
                        <el-form-item label="目的机场">
                            <AirportAutocomplete v-model="form.arrival" @select="handleArrivalSelect" />
                        </el-form-item>
                        <el-form-item label="航段">
                            <el-input v-model="form.sector" placeholder="航段" />
                        </el-form-item>
                        <el-form-item label="航路">
                            <el-input v-model="form.ATSroute" placeholder="航路" />
                        </el-form-item>
                        <el-form-item label="航线代码">
                            <el-input v-model="form.routeCode" placeholder="航线代码" />
                        </el-form-item>

                        <!-- 飞越国家 -->
                        <el-form-item label="飞越国家">
                            <el-select v-model="form.overflyCountryNames" multiple filterable remote
                                :reserve-keyword="false" placeholder="飞越国家" :remote-method="countrySearch"
                                :loading="loadingCountries" @change="val => onCountryChange(val, index)"
                                class="inline-input w-50">
                                <el-option v-for="item in countryOptions" :key="item.country" :label="item.country"
                                    :value="item.country" />
                            </el-select>

                            <el-table v-if="form.overflyCountry.length" :data="form.overflyCountry" style="width: 100%">
                                <el-table-column prop="country" label="国家" />
                                <el-table-column v-for="field in allFieldsList[index]" :key="field" :label="field">
                                    <template #default="{ row }">
                                        <el-input v-model="row.data[field]" size="small" />
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-form-item>
                    </el-form>
                </div>
                <div v-if="!isEditing" style="margin: 10px 0">
                    <el-button type="primary" :icon="Plus" @click="addRow">
                        <el-icon class="el-icon--right">
                            <Plus />
                        </el-icon>
                        添加一条航路
                    </el-button>
                </div>
            </div>

            <!-- Excel 导入 -->
            <div v-if="mode == 'byExcel'">
                <SeasonSelect v-model="curSeason" />

                <el-upload :auto-upload="false" accept=".xlsx, .xls" :on-change="handleExcelMain">
                    <el-button type="primary">上传航路总表</el-button>
                </el-upload>
                <el-upload :auto-upload="false" accept=".xlsx, .xls" :on-change="handleExcelOverfly">
                    <el-button type="primary">上传各国飞越数据</el-button>
                </el-upload>
                <el-button @click="submitOverflyData">提交飞越</el-button>
                <el-row>
                    <!-- 左边：总表 -->
                    <el-col :span="12" style="max-height: 400px;overflow-y: scroll;">
                        <h3>航路总表</h3>
                        <el-table :data="totalRoutes" border style="width: 100%">
                            <el-table-column prop="sector" label="航段" />
                            <el-table-column prop="routeCode" label="航线代码" />
                            <el-table-column prop="departure" label="起飞机场" />
                            <el-table-column prop="arrival" label="目的机场" />
                            <el-table-column prop="overflyCountry" label="飞越国家" />
                        </el-table>
                    </el-col>

                    <!-- 右边：飞越国境表 -->
                    <el-col :span="12" style="max-height: 400px;overflow-y: scroll;">
                        <h3>各国飞越数据</h3>
                        <el-collapse>
                            <el-collapse-item v-for="(rows, sheetName) in overflyData" :key="sheetName"
                                :title="sheetName">
                                <el-table :data="rows" border style="width: 100%">
                                    <el-table-column v-for="(v, k) in rows[0] || {}" :key="k" :prop="k" :label="k" />
                                </el-table>
                            </el-collapse-item>
                        </el-collapse>
                    </el-col>
                </el-row>

                <!-- 下方：合并后的结果 -->
                <h3 style="margin-top:20px">合并结果</h3>
                <div style="max-height: 400px;overflow-y: scroll;">
                    <el-table :data="mergedRoutes" border style="width: 100%">
                        <el-table-column prop="sector" label="航段" />
                        <el-table-column prop="routeCode" label="航线代码" />
                        <el-table-column label="飞越国家数据">
                            <template #default="{ row }">
                                <div v-for="detail in row.overflyCountry" :key="detail.country" class="mb-4">
                                    <p class="font-bold">{{ detail.country }}:</p>

                                    <el-table v-if="detail.overflyDetails && detail.overflyDetails.length"
                                        :data="detail.overflyDetails" border style="width: 100%">
                                        <!-- 动态表头 -->
                                        <el-table-column v-for="col in getColumns(detail.overflyDetails)" :key="col"
                                            :prop="col" :label="col" min-width="120" />
                                    </el-table>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>



            </div>

            <!-- 自动识别 -->
            <div v-if="mode == 'autoRead'" style="text-align:center; padding:20px;">
                <p>自动识别功能开发中...</p>
            </div>

            <!-- 底部操作 -->
            <div style="text-align: right; margin-top:20px;">
                <el-button @click="showAddRoute = false">取消</el-button>
                <el-button type="primary" @click="onSubmit">
                    {{ isEditing ? '更新' : '创建' }}
                </el-button>
            </div>
            <div v-if="props.uploading" class="progressMask">

                <el-progress type="circle"></el-progress>
            </div>
        </div>
    </el-dialog>

    <div>
        <!-- 冲突对话框 -->
        <el-dialog v-model="conflictDialogVisible" title="数据冲突处理" width="80%">
            <div>
                <el-alert type="warning" :closable="false" show-icon>
                    检测到以下航路存在冲突，请选择保留或替换。
                </el-alert>
            </div>

            <el-table :data="conflicts" border stripe style="margin-top: 12px;">
                <el-table-column prop="country" label="国家" width="120" />
                <el-table-column prop="sector" label="航路 Sector" width="160" />

                <!-- 原数据 -->
                <el-table-column label="原数据">
                    <template #default="{ row }">
                        <div>
                            <div>起点: {{ row.oldData.departure }}</div>
                            <div>终点: {{ row.oldData.arrival }}</div>
                            <div>航路: {{ row.oldData.ATSroute }}</div>
                        </div>
                    </template>
                </el-table-column>

                <!-- 新数据 -->
                <el-table-column label="新数据">
                    <template #default="{ row }">
                        <div>
                            <div>起点: {{ row.newData.departure }}</div>
                            <div>终点: {{ row.newData.arrival }}</div>
                            <div>航路: {{ row.newData.ATSroute }}</div>
                        </div>
                    </template>
                </el-table-column>

                <!-- 操作 -->
                <el-table-column label="操作" width="160">
                    <template #default="{ row }">
                        <el-radio-group v-model="row.action">
                            <el-radio label="keep">保留原来</el-radio>
                            <el-radio label="replace">替换为新</el-radio>
                        </el-radio-group>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 全局操作按钮 -->
            <div style="margin-top: 12px; text-align: right;">
                <el-button @click="applyAll('keep')">全部保留</el-button>
                <el-button type="primary" @click="applyAll('replace')">全部替换</el-button>
            </div>

            <!-- 底部操作 -->
            <template #footer>
                <el-button @click="conflictDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmConflict">确定提交</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import * as XLSX from "xlsx";
import { ref, watch, nextTick, toRaw } from 'vue'
import { addOverflyData, getOverflyData, updateOverflyData } from '../api.js'
import { ElMessage } from 'element-plus'
import { parseOverflyData, mergeRouteWithOverflyData } from './fileParser.js'; // 引入解析文件的工具函数
import SeasonSelect from '../utils/seasonSelect.vue'

const props = defineProps({
    showAddRoute: Boolean,
    isEditing: Boolean,
    selectedRoutes: {
        type: Array,
        default: () => []
    },
    countryData: {
        type: Array,
        default: () => []
    },
    uploading: Boolean
})
const totalRoutes = ref([]);       // 总表
const overflyData = ref({});       // 飞越国境表 (所有 sheet)
const mergedRoutes = ref([]);      // 合并后的结果
const curSeason = ref(null)
const emit = defineEmits(['update:showAddRoute', 'submit'])

const showAddRoute = ref(props.showAddRoute)
watch(() => props.showAddRoute, val => showAddRoute.value = val)
watch(showAddRoute, val => emit('update:showAddRoute', val))
const emptyRoute = () => ({
    season: '',
    departure: '',
    arrival: '',
    sector: '',
    ATSroute: '',
    routeCode: '',
    overflyCountry: [],
    autoRoutePrefix: ''
})
const addRouteForms = ref([])

// 编辑模式：根据 selectedRoutes 初始化
watch(() => props.selectedRoutes, (val) => {
    if (props.isEditing && val.length) {
        addRouteForms.value = val.map(route => ({
            ...route,
            overflyCountry: route.overflyCountry.map(item => {
                const { country, ...rest } = item
                return { country, data: rest }
            }),
            autoRoutePrefix: '',
            overflyCountryNames: route.overflyCountry.map(i => i.country)
        }))
    }
}, { immediate: true })

// 新增模式：初始化一个空表单
watch(() => props.isEditing, (val) => {
    if (!val) {
        addRouteForms.value = [emptyRoute()]
    }
}, { immediate: true })
const getColumns = (rules) => {
    if (!Array.isArray(rules) || !rules.length) return [];
    return [...new Set(rules.flatMap(rule => Object.keys(rule)))];
};

const modeOption = ref(['manAdd', 'byExcel', 'autoRead'])
const modeLabels = {
    manAdd: "手动新增",
    byExcel: "Excel 导入",
    autoRead: "自动识别"
}
const mode = ref('byExcel')

// === Excel 处理逻辑 ===

const regexRules = {
    // 航段 Sector，例如：ZSAM-LFPG
    sector: /^[A-Z]{4}-[A-Z]{4}$/,

    // 航路代码 RouteCode，例如：ZSAMLFPG1
    routeCode: /^[A-Z]{4}[A-Z]{4}\d+$/,

    // 机场四字码，例如：ZSAM、LFPG
    airport: /^[A-Z]{4}$/,

    // ATS 路径串，例如：SARIN M166 KRG T523 ATBAN L994 TITUR
    // ATSroute: /^(?=.*\d)(?:[A-Z0-9]+\s+)*[A-Z0-9]+$/,
    ATSroute: /^(?:[A-Z]{2,5}\s+[A-Z]\d{1,3}\s+)+[A-Z]{2,5}$/,
    // 航路点（Entry/Exit），通常是大写 3~6 个字母
    waypoint: /^[A-Z]{3,6}$/,

    // 飞行速度，例如：N0480（表示 480 节）
    speed: /^N\d{4}$/,

    // 飞行高度层，例如：F400（表示飞行高度 40000 英尺）
    flightLevel: /^F\d{3}$/,

    // 出发时间/过点时间，例如：ETD+0520
    etdTime: /^ETD\+\d{4}$/,

    // 预计越区时间，例如：EET/UAAA0520 或 EET/UACN0555
    EET: /^(EET\/[A-Z]{4}\d{4})(\sEET\/[A-Z]{4}\d{4})*$/,

    // 例如：BISUN SIMLI BISIV ANIMO LUMIN ODERI
    altPointSeq: /^(?:[A-Z]{5})(?:\s+[A-Z]{5})+$/,

};
// console.log(regexRules.ATSroute.test("ABCDE A123 FGHIJ DCT FGHIJ B20 KLMNO")); // true
function parseRowToRoute(row, curSeason) {
    const route = {
        season: curSeason || '',
        departure: '',
        arrival: '',
        sector: '',
        ATSroute: '',
        routeCode: '',
        overflyCountry: [],
    };

    // row 可能是对象（xlsx 解析） -> 提取所有值
    const values = Object.values(row).map(v => String(v).trim());

    values.forEach(val => {
        if (regexRules.sector.test(val)) {
            route.sector = val;
        } else if (regexRules.routeCode.test(val)) {
            route.routeCode = val;
        }
        else if (regexRules.ATSroute.test(val)) {
            // 简单判断 ATSRoute：含有字母航路点/编号
            route.ATSroute = val;
        }
        else if (regexRules.airport.test(val)) {
            // 如果 departure 为空，先塞 departure，否则塞 arrival
            if (!route.departure) route.departure = val;
            else if (!route.arrival) route.arrival = val;
        } else if (/[\u4e00-\u9fa5]/.test(val)) {
            // 中文 -> 飞越国家（可能有多个）
            route.overflyCountry = val.split(/\s+/).map(c => ({ country: c }));
        }
    });

    return route;
}
// 上传总表
const handleExcelMain = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const curSeasonChoose = curSeason.value;

        totalRoutes.value = rows.map(r => parseRowToRoute(r, curSeasonChoose));
        console.log("totalRoutes", totalRoutes.value);
        console.log("overflyData", overflyData.value);

        // 如果飞越表已加载，尝试合并
        if (Object.keys(overflyData.value).length) {
            mergedRoutes.value = mergeRouteWithOverflyData(
                totalRoutes.value,
                overflyData.value
            );
        }
        console.log('mergedRoutes', mergedRoutes)
    };
    reader.readAsArrayBuffer(file.raw);
};
function normalize(input) {
    if (!input) return "";
    return input
        .toString()
        .trim()
        // 全角数字转半角
        .replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
        // 全角字母转半角
        .replace(/[Ａ-Ｚ]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
        // 异体N/F等替换成标准 ASCII
        .replace(/[ⁿＮℕ𝑁𝗡𝐍𝙽𝑵𝒩𝘕𝓝]/g, "N")
        .replace(/[Ｆ𝑭𝗙𝐅𝙁𝑓𝒇𝘧𝓯]/g, "F")
        // 去掉零宽字符、控制符
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // 合并奇怪空格
        .replace(/\s+/g, " ");
}
console.log('测试', regexRules.speed.test(normalize("N0480"))); // true
function debugChars(str) {
    if (!str) return "EMPTY";
    return Array.from(str).map(c => {
        const code = c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0");
        return `${c} (U+${code})`;
    }).join(" | ");
}


// 上传飞越国境表
function parseRowToModel(row, curSeason) {
    const route = {
        season: curSeason || '',
        departure: '',
        arrival: '',
        sector: '',
        ATSroute: '',
        routeCode: [],
        entryPoint: '',
        exitPoint: '',
        entryTime: '',
        exitTime: '',
        speed: '',
        flightLevel: '',
        EET: [],
        altEntryPoint: '',
        altExitPoint: '',
    };

    const values = Object.values(row).map(v => String(v).trim());
    const waypoints = []; // 先存航路点，后面结合 ATSroute 判定 entry/exit

    values.forEach(val => {
        // console.log("原始：", val);
        // console.log("调试debugChars：", debugChars(val));
        // console.log("调试normalize：", normalize(val));

        if (regexRules.sector.test(val)) {
            route.sector = val;
            const [dep, arr] = val.split("-");
            route.departure = dep;
            route.arrival = arr;
        }
        else if (regexRules.ATSroute.test(val)) {
            route.ATSroute = val;
        }
        else if (regexRules.speed.test(normalize(val))) {
            // console.log('speedRow',val)
            route.speed = normalize(val); // N0480
        } else if (regexRules.flightLevel.test(normalize(val))) {
            route.flightLevel = normalize(val); // F400
        }
        else if (regexRules.routeCode.test(val)) {
            route.routeCode.push(val);
        } else if (regexRules.airport.test(val)) {
            // departure/arrival 已由 sector 拆出，这里可忽略或做校验
        } else if (regexRules.waypoint.test(val)) {
            if (!route.entryPoint) {
                route.entryPoint = val;   // 第一个 → 入境点
            } else if (!route.exitPoint) {
                route.exitPoint = val;    // 第二个 → 出境点
            }
        } else if (regexRules.etdTime.test(val)) {
            // ETD+0520 -> 0520
            const t = val.match(/\d{4}/)[0];
            if (!route.entryTime) route.entryTime = t;
            else route.exitTime = t;
        } else if (regexRules.EET.test(val)) {
            route.EET.push(val);
        }
        else if (regexRules.altPointSeq.test(val)) {
            const tokens = val.split(/\s+/).filter(t => /^[A-Z]{5}$/.test(t));
            if (tokens.length > 1) {
                if (!route.altEntryPoint) {
                    // 第一次出现 → 整个数组
                    route.altEntryPoint = tokens;
                } else if (!route.altExitPoint) {
                    // 第二次出现 → 整个数组
                    route.altExitPoint = tokens;
                }
            }
        }
    });

    return route;
}

const handleExcelOverfly = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // 保存所有 sheet
        const sheetDataMap = {};
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);
            console.log('rows', rows)
            sheetDataMap[sheetName] = rows.map(r => parseRowToModel(r));
        });

        overflyData.value = sheetDataMap;
        console.log('overflyData', overflyData.value)

        // 如果总表已加载，尝试合并
        if (totalRoutes.value.length) {
            mergedRoutes.value = mergeRouteWithOverflyData(
                totalRoutes.value,
                sheetDataMap
            );
            console.log('mergedRoutes.value', mergedRoutes.value)
        }
    };
    reader.readAsArrayBuffer(file.raw);
};


const overflyDataToUpload = ref(null)

function mergeRouteWithOverfly(sheetDataMap, mainSheetName = "2025年夏秋季CFP大表") {
    const mainSheet = sheetDataMap[mainSheetName] || [];

    return mainSheet.map(row => {
        // 统一转换 overflyCountry
        let countries = [];
        if (Array.isArray(row.overflyCountry)) {
            countries = row.overflyCountry.map(c => (typeof c === "string" ? { country: c } : c));
        } else if (typeof row.overflyCountry === "string") {
            countries = row.overflyCountry.split(/\s+/).map(c => ({ country: c }));
        }
        console.log('countries', countries)

        // 遍历每个飞越国，找到对应的 sheet
        const overflyDetails = countries.map(c => {
            const sheetKey = `${c.country}`;
            const rules = sheetDataMap[sheetKey] || [];
            console.log('rules', rules)

            return {
                country: c.country,
                rules: rules.filter(rule => {
                    // 如果 excel 中有 routeCode/航段，可以在这里做匹配
                    return (
                        !row.routeCode ||
                        rule.routeCode === row.routeCode ||
                        rule.航段 === row.航段
                    );
                })
            };
        });
        overflyDataToUpload.value = overflyDetails
        console.log('overflyDetails', overflyDetails)
        return {
            ...row,
            overflyCountry: countries,
            overflyDetails
        };
    });
}

function compareData(curOverflyData, newData, curSeason) {
    console.log('curOverflyData',curOverflyData,'newData',newData)
    const conflicts = []
    const nonConflicts = []

    const oldMap = new Map()
    curOverflyData.forEach(d => {
        if (d.season === curSeason) {
            oldMap.set(d.sector, d)
        }
    })

    Object.entries(newData).forEach(d => {
        const old = oldMap.get(d.sector)
        if (old) {
            conflicts.push({
                country: d.country,
                sector: d.sector,
                oldData: old,
                newData: d
            })
        } else {
            nonConflicts.push(d)
        }
    })
    console.log('conflicts', conflicts, 'nonConflicts', nonConflicts)
    return { conflicts, nonConflicts }
}


const submitOverflyData = async () => {
    // const formData = new FormData();
    // formData.append('overflyData', overflyDataToUpload.value);
    const payload = {
        curseason: curSeason.value,   // 当前季节
        data: overflyData.value       // 各国家的航路数据
    };
    console.log('提交的数据 ', payload)
    const curOverflyData = await getOverflyData()
    console.log('curOverflyData', curOverflyData.data)

    if (curOverflyData.data) {
        const { conflicts, nonConflicts } = compareData(curOverflyData.data, payload.data, curSeason.value)
        console.log('conflicts', conflicts)

        if (conflicts.length > 0) {
            console.log('冲突展示')

            showConflictDialog(conflicts, nonConflicts)
        }else {
        console.log('新增')
        // 没有冲突直接提交
        const addResponse = await addOverflyData(payload)
        console.log('addResponse', addResponse)
    }
        // 弹出对话框，展示冲突项

    } else {
        console.log('新增')
        // 没有冲突直接提交
        const addResponse = await addOverflyData(payload)
        console.log('addResponse', addResponse)
    }
}
const conflicts = ref([]) // [{ country, sector, oldData, newData, action }]
const nonConflicts = ref([])
const conflictDialogVisible = ref(false)

const showConflictDialog = (conflictList, nonConflictList) => {
    conflicts.value = conflictList.map(item => ({
        ...item,
        action: 'keep' // 默认保留原数据
    }))
    nonConflicts.value = nonConflictList
    conflictDialogVisible.value = true
}
// 批量设置
const applyAll = (action) => {
    conflicts.value.forEach(item => {
        item.action = action
    })
}
const confirmConflict = async () => {
    const toUpdate = conflicts.value
        .filter(item => item.action === 'replace')
        .map(item => item.newData)

    const toAdd = nonConflicts.value

    console.log('非冲突数据 → 新增:', toAdd)
    console.log('冲突替换 → 更新:', toUpdate)
    console.log('冲突保留 → 不处理')

    if (toAdd.length > 0) {
        await addOverflyData({ data: toAdd })
    }
    if (toUpdate.length > 0) {
        await updateOverflyData({ data: toUpdate })
    }

    conflictDialogVisible.value = false
}
// 提交
const onSubmit = async () => {
    const submitData = mergedRoutes.value.map(row => {
        return {
            ...toRaw(row),
            overflyCountry: JSON.stringify(row.overflyCountry || [])
        }
    });
    console.log('submitData', submitData)
    emit('submit', submitData)
}
</script>
<style scoped>
.dialog-body {
    position: relative;
    /* 给子元素 absolute 提供定位参考 */
    min-height: 300px;
    /* 给点高度，不然mask可能太小 */
}

.progressMask {
    position: absolute;
    inset: 0;
    /* 等同于 top:0; right:0; bottom:0; left:0; */
    background: rgba(0, 0, 0, 0.82);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>