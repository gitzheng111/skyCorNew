<template>
    <el-dialog v-model="showAddRoute" :title="isEditing ? '批量编辑航路' : '新增航路'" width="95%">
        <!-- 模式选择 -->

        <div class="dialog-body">



            <el-select v-if="!isEditing" v-model="mode" placeholder="请选择输入方式" style="margin-bottom: 20px;">
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
                        <el-form-item label="飞越国家">
                            <el-tabs v-model="clickCountry" @tab-click="changeCountry">
                                <el-tab-pane v-for="(c, idx) in form.overflyCountry" :key="idx" :name="c.country">
                                    <template #label>
                                        <span>
                                            {{ c.country }}
                                        </span>
                                    </template>
                                    <div>
                                        <overflyDataView :mode="'forever'" :editShow="true"
                                            :overflyDataFromFather="c.overflyDetails" :allData="form.overflyCountry"
                                            :curSeason="curSeason" :countryData="selectCountryData(c.country)"
                                            @updateFinish="refreshOverflyData" />
                                    </div>
                                    <el-button type="danger" @click="form.overflyCountry.splice(idx, 1)">删除 {{ c.country
                                        }}</el-button>
                                </el-tab-pane>

                            </el-tabs>

                            <el-button type="primary" link @click="addCountry(form)">+ 添加国家</el-button>

                        </el-form-item>
                        <el-button @click="deleteRow(index)">删除</el-button>

                        <!-- 飞越国家 -->
                        <!-- <el-form-item label="飞越国家">
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
</el-form-item> -->
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




                <el-button @click="submitAllRoute">提交所有航路数据</el-button>
                <el-button @click="submitOverflyData">只提交飞越数据</el-button>


                <el-row>
                    <!-- 左边：总表 -->
                    <el-col :span="12" style="max-height: 400px;overflow-y: scroll;">
                        <h3>航路总表</h3>
                        <div style="display: flex;justify-content: center;margin: auto;gap: 12px;">
                            <el-upload :auto-upload="false" accept=".xlsx, .xls" :on-change="handleExcelMain">
                                <el-button type="primary">上传航路总表</el-button>

                            </el-upload>
                            <el-button type="warning" @click="deleteTemRouteData">清除航路数据</el-button>
                        </div>

                        <el-table :data="totalRoutes" border style="width: 100%">
                            <el-table-column prop="sector" label="航段" />
                            <el-table-column prop="routeCode" label="航线代码" />
                            <el-table-column prop="departure" label="起飞机场" />

                            <el-table-column prop="arrival" label="目的机场" />
                            <el-table-column prop="ATSroute" label="航路" />

                            <el-table-column label="飞越国家">

                                <template #default="{ row }">
                                    <span>
                                        <!-- overflyCountry 可能是数组 -->
                                        {{Array.isArray(row.overflyCountry)
                                            ? row.overflyCountry.map(c => c.country).join(',')
                                            : ''}}
                                    </span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-col>

                    <!-- 右边：飞越国境表 -->
                    <el-col :span="12" style="max-height: 400px;overflow-y: scroll;">
                        <h3>各国飞越数据</h3>
                        <div style="display: flex;justify-content: center;margin: auto;gap: 12px;">
                            <el-upload :auto-upload="false" accept=".xlsx, .xls" :on-change="handleExcelOverfly">
                                <el-button type="primary">上传各国飞越数据</el-button>
                            </el-upload>


                            <el-button type="warning" @click="deleteTemOverflyData">清除飞越数据</el-button>

                        </div>

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
                <h3 style="margin-top:20px">交叉匹配结果</h3>
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
                    {{ isEditing ? '更新数据' : '提交数据' }}
                </el-button>
            </div>
            <!-- <div v-if="props.uploading" class="progressMask">

                <el-progress type="circle"></el-progress>
            </div> -->
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
import { ref, watch, nextTick, toRaw, onMounted, computed } from 'vue'
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import { addOverflyData, getOverflyData, updateOverflyData, getCountryRules } from '../api.js'
import { ElMessage } from 'element-plus'
import { parseOverflyData, mergeRouteWithOverflyData } from './fileParser.js'; // 引入解析文件的工具函数
import SeasonSelect from '../utils/seasonSelect.vue'
import overflyDataView from '../utils/overflyDataView.vue'
import { useSeasonData } from '../components/useSeasonUtils'

const { todaySeason } = useSeasonData()
const clickCountry = ref()
const curCountry = ref()
const countryData = ref()
// const selectCountryData = ref()
const selectCountryData = (country) => {
    return countryData.value.find(
        item => item.country === country
    )
}
const changeCountry = (country) => {
    const index = clickCountry.value
    const selectedItem = overflyData.value[index]
    curCountry.value = selectedItem.country;
    selectCountryData.value = countryData.value.find(item => item.country == selectedItem.country)
    console.log('点击后的country', selectedItem)
    console.log('所有国家数据', countryData.value)

    console.log('selectCountryData', selectCountryData.value)

    //当前国家申请数据
    // curCountry.value = selectedItem.overflyCountry


    console.log('切换后的国家', curCountry.value)
}

const isEditing = ref(false)
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
    uploading: Boolean,
    editData: Array,
    filteredData: Array
})
const totalRoutes = ref([]);       // 总表
const overflyData = ref({});       // 飞越国境表 (所有 sheet)
const mergedRoutes = ref([]);      // 合并后的结果
const curSeason = ref(null)
const emit = defineEmits(['update:showAddRoute', 'submit'])
const filteredData = ref([])
const showAddRoute = ref(props.showAddRoute)

watch(() => props.showAddRoute, val => showAddRoute.value = val)
watch(() => props.filteredData, val => filteredData.value = val)

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
const addRow = () => {

    addRouteForms.value.push(emptyRoute())
}

const deleteRow = (index) => {
    addRouteForms.value.splice(index, 1)
}
const refreshOverflyData = async (data) => {
    console.log('子组件传回来的data', data)
    // loading.show('加载飞越航路数据')

    // const overflyResponse = await getOverflyData()
    // overflyData.value = overflyResponse.data
    // const routeResponse = await getRoutes()
    // // console.log('overflyData.value ', overflyData.value)
    // console.log('routeResponse', routeResponse.data)
    // const { routes: updatedRoutes, updatedRouteIds } = updateRoutesWithOverflyData(routeResponse.data, overflyData.value, curCountry.value, curSeason.value)

    // mergedRoutes.value = updatedRoutes
    // console.log('mergedRoutes', mergedRoutes.value)
    // console.log('updatedRouteIds', updatedRouteIds)
    // const payload = mergedRoutes.value
    //     .filter(r => updatedRouteIds.includes(r.route_id))
    //     .map(r => ({
    //         route_id: r.route_id,
    //         departure: r.departure,
    //         arrival: r.arrival,
    //         ATSroute: r.ATSroute || null,
    //         sector: r.sector || null,
    //         routeCode: normalizeJSONField(r.routeCode),// 如果是数组，转 JSON
    //         overflyCountry: normalizeJSONField(r.overflyCountry), // ✅ 必须转 JSON
    //         season: r.season
    //     }))
    // console.log('payload', payload)
    // const updateResponse = await updateRoutes(payload)
    // console.log('updateResponse', updateResponse)

    // // 正确写法
    // overflyStore.setNeedRefresh(true)
    // console.log('overflyStore', overflyStore.needRefresh) // true
    // loading.hide()
}
const mapEditData = (data) => {
    const arrayData = Array.isArray(data) ? data : [data];
    const transferRoute = arrayData.map(item => {
        if (typeof item.overflyCountry === 'string') {
            try {
                item.overflyCountry = JSON.parse(item.overflyCountry)
            } catch (e) {
                console.error('overflyCountry 解析失败:', item.overflyCountry)
                item.overflyCountry = []
            }
        }
        return item
    })
    return transferRoute.map(f => ({
        route_id: f.route_id || '',
        season: f.season || '',
        departure: f.departure || '',
        arrival: f.arrival || '',
        sector: f.sector || '',
        ATSroute: f.ATSroute || '',
        routeCode: f.routeCode || '',
        overflyCountry: f.overflyCountry || [],
    }))
}
watch(
    () => [props.isEditing, props.editData],
    (val) => {

        console.log('props.editData', props.editData, ' props.isEditing', props.isEditing)
        if (val && props.editData) {
            isEditing.value = props.isEditing
            mode.value = 'manAdd'
            addRouteForms.value = mapEditData(props.editData)
            console.log('mode', mode.value)
            // clickCountry.value = '0'
            // const selectedItem = addRouteForms.value[clickCountry.value]
            // curCountry.value = selectedItem.country;
            // selectCountryData.value = countryData.value.find(item => item.country == selectedItem.country)
            console.log('addFlightForms', addRouteForms.value)
        } else {
            addRouteForms.value = []
        }
    },
    { immediate: true }
)
const getColumns = (rules) => {
    if (!Array.isArray(rules) || !rules.length) return [];
    return [...new Set(rules.flatMap(rule => Object.keys(rule)))];
};
const addCountry = (form) => {
    form.overflyCountry.push({
        country: '',
        isPermit: false,
        needPermit: 1,
        overflyDetails: [],
        permissionNumber: null
    });
}

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
    ATSroute: /\b([A-Z]{3,5}|[A-Z][0-9]{2,3}|DCT|\d{2,3}[NS]\d{3}[EW])\b/g,

    // 航路点（Entry/Exit），通常是大写 3~6 个字母
    waypoint: /^(?:[A-Z]{3,6}|\d{2}[NS]\d{2,3}[EW])$/,

    // 飞行速度，例如：N0480（表示 480 节）
    speed: /^(?:[NK]\d{4}|\d{3,4}\s?KM\/H)$/i,

    // 飞行高度层，例如：F400（表示飞行高度 40000 英尺）
    flightLevel: /^F\d{3}$/,

    // 出发时间/过点时间，例如：ETD+0520
    etdTime: /^ETD\+\d{4}$/,

    // 预计越区时间，例如：EET/UAAA0520 或 EET/UACN0555
    EET: /^(EET\/[A-Z]{4}\d{4})(\sEET\/[A-Z]{4}\d{4})*$/,

    // 例如：BISUN SIMLI BISIV ANIMO LUMIN ODERI
    altPointSeq: /^(?:[A-Z]{5})(?:\s+[A-Z]{5})+$/,

};

const POINT = /^[A-Z]{2,5}$/
const ATS = /^[A-Z]{1,2}[0-9]{1,3}$/
const LATLON = /^\d{2,3}[NS]\d{3}[EW]$/
const DCT = /^DCT$/

function isATSRoute(str) {
    const tokens = str.trim().split(/\s+/)

    // 至少 2 个
    if (tokens.length < 2) return false

    let hasATS = false
    let valid = true

    for (const t of tokens) {
        if (
            POINT.test(t) ||
            LATLON.test(t) ||
            DCT.test(t)
        ) {
            continue
        }

        if (ATS.test(t)) {
            hasATS = true
            continue
        }

        valid = false
        break
    }

    return valid && hasATS
}

//将文件转化成航路数据
function parseRowToRoute(row, curSeason) {
    // if (!row ) {
    //     return null
    // }
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

    // if (values.length === 0) {
    //     return null
    // }
    console.log('解析的excel原数据', values)
    //识别每个字段的数据
    values.forEach(val => {
        if (regexRules.sector.test(val)) {
            route.sector = val;
            const [from, to] = val.split('-');
            route.departure = from;
            route.arrival = to;
            return;
        }
        else if (regexRules.routeCode.test(val)) {
            route.routeCode = val;
            return;
        }
        else if (regexRules.ATSroute.test(val)) {
            // 简单判断 ATSRoute：含有字母航路点/编号
            route.ATSroute = val;
        }
        else if (regexRules.airport.test(val)) {
            if (!route.departure) {
                route.departure = val;
            } else if (!route.arrival && val !== route.departure) {
                route.arrival = val;
            }
            return
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
        const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,     // 👉 不自动识别表头
            // defval: ''     // 👉 空单元格给空字符串 
        });
        const curSeasonChoose = curSeason.value;
        console.log('sheet', sheet)
        totalRoutes.value = rows.map(r => parseRowToRoute(r, curSeasonChoose));
        console.log("文件的所有航路", totalRoutes.value);


        // 如果飞越表已加载，尝试合并
        if (Object.keys(overflyData.value).length) {
            console.log("已存在飞越数据", overflyData.value);
            mergedRoutes.value = mergeRouteWithOverflyData(
                totalRoutes.value,
                overflyData.value
            );
            console.log('合并后的数据mergedRoutes', mergedRoutes)

        }
    };
    reader.readAsArrayBuffer(file.raw);
};
function parseEntryExitFromATS(ATSroute) {
    if (!ATSroute) return {};

    const tokens = ATSroute.trim().split(/\s+/);

    // 只保留 waypoint（排除航路号 M753 这种）
    const waypoints = tokens.filter(t => regexRules.waypoint.test(t));

    if (waypoints.length === 0) return {};

    return {
        entryPoint: waypoints[0],
        exitPoint: waypoints[waypoints.length - 1]
    };
}
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
        else if (isATSRoute(val) && !route.ATSroute) {
            route.ATSroute = val;
            const { entryPoint, exitPoint } = parseEntryExitFromATS(val);

            if (entryPoint) route.entryPoint = entryPoint;
            if (exitPoint) route.exitPoint = exitPoint;
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
            if (route.ATSroute) return;

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
        else if (regexRules.altPointSeq.test(val) && route.entryPoint) {
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
        console.log('导入的飞跃数据overflyData', overflyData.value)

        // 如果总表已加载，尝试合并
        if (totalRoutes.value.length) {
            console.log('开始合并')
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
const submitAllRoute = () => {
    const { conflicts, nonConflicts, sameList } = compareRouteData(filteredData.value, totalRoutes.value, curSeason.value)
    console.log('conflicts', conflicts)
    console.log('nonConflicts', nonConflicts)
    console.log('sameList', sameList)


}
const compareRouteData = (newRoutes, oldRoutes, curSeason) => {
    const conflicts = []
    const nonConflicts = [] // 新增
    const sameList = []

    // 根据 sector + routeCode（如果有）来做唯一标识
    const getKey = (route) => `${route.sector}_${route.routeCode || ''}`

    const oldMap = new Map()
    oldRoutes.forEach(r => oldMap.set(getKey(r), r))

    newRoutes.forEach(newRoute => {
        const key = getKey(newRoute)
        const oldRoute = oldMap.get(key)

        if (!oldRoute) {
            // 旧数据里没找到 → 新增
            nonConflicts.push(newRoute)
        } else {
            // 找到了 → 比较关键字段
            const fieldsToCompare = [
                'ATSroute', 'entryPoint', 'exitPoint', 'EET', 'flightLevel', 'speed'
            ]
            const hasConflict = fieldsToCompare.some(
                field => (newRoute[field] || '') !== (oldRoute[field] || '')
            )

            if (hasConflict) {
                conflicts.push({
                    sector: newRoute.sector,
                    routeCode: newRoute.routeCode,
                    oldRoute,
                    newRoute
                })
            } else {
                sameList.push(newRoute)
            }
        }
    })

    return { conflicts, nonConflicts, sameList }
}


function compareData(curOverflyData, newData, curSeason) {
    console.log('curOverflyData', curOverflyData, 'newData', newData)
    const conflicts = []
    const sameList = []

    const nonConflicts = []
    Object.entries(newData).forEach(([country, routes]) => {
        // 找当前国家历史数据
        const oldCountry = curOverflyData.find(c => c.country === country)
        const oldRoutes =
            oldCountry?.data?.find(d => d.season === curSeason)?.data || []

        routes.forEach(newRoute => {
            const conflict = oldRoutes.find(
                old =>
                    old.sector === newRoute.sector &&
                    old.ATSroute != newRoute.ATSroute &&
                    JSON.stringify(old.routeCode) === JSON.stringify(newRoute.routeCode)
            )
            const same = oldRoutes.find(
                old =>
                    old.sector === newRoute.sector &&
                    old.ATSroute === newRoute.ATSroute &&
                    JSON.stringify(old.routeCode) === JSON.stringify(newRoute.routeCode)
            )


            if (conflict) {
                conflicts.push({
                    country,
                    sector: newRoute.sector,
                    oldData: conflict,
                    newData: newRoute
                })
            } if (same) {
                sameList.push({
                    country,
                    sector: newRoute.sector,
                    oldData: conflict,
                    newData: newRoute
                })
            } else {
                nonConflicts.push({ country, ...newRoute })
            }
        })
    })

    console.log('conflicts', conflicts, 'nonConflicts', nonConflicts)
    return { conflicts, nonConflicts, sameList }
}

const deleteTemRouteData = () => {
    totalRoutes.value = []
}
const deleteTemOverflyData = () => {
    overflyData.value = []
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
        const { conflicts, nonConflicts, sameList } = compareData(curOverflyData.data, payload.data, curSeason.value)
        console.log('conflicts', conflicts)
        console.log('nonConflicts', nonConflicts)
        console.log('sameList', sameList)

        if (conflicts.length > 0) {
            console.log('冲突展示')
            ElMessage.warn('与现存数据有冲突，请做选择');

            showConflictDialog(conflicts, nonConflicts)
        }
        if (conflicts.length == 0 && nonConflicts.length == 0 && sameList.length > 0) {
            ElMessage.info('与现存数据完全一致，无需补充');

        }
        if (conflicts.length == 0 && nonConflicts.length > 0 && sameList.length == 0) {
            ElMessage.success('数据已检查，无冲突，直接同步至服务器');

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
    let submitData = []
    console.log('isEditing', isEditing)
    if (isEditing.value == true) {
        submitData = addRouteForms.value.map(row => {
            return {
                ...toRaw(row),
                overflyCountry: JSON.stringify(row.overflyCountry || [])
            }
        });
    } else {
        console.log('提交的mergedRoutes', mergedRoutes.value)
        submitData = mergedRoutes.value.map(row => {
            return {
                ...toRaw(row),
                overflyCountry: JSON.stringify(row.overflyCountry || [])
            }
        });
    }

    console.log('传给父组件submitData', submitData)
    emit('submit', submitData)
}
const initData = async () => {
    try {
        // loading.show('加载飞越航路数据')
        // const routeResponse = await getRoutes();
        // routesData.value = routeResponse.data;
        //全部国家的数据
        const countryResponse = await getCountryRules();
        countryData.value = countryResponse.data;

        // const overflyResponse = await getOverflyData();
        // overflyData.value = overflyResponse.data;

        curSeason.value = todaySeason.value.en
        console.log('curSeason', curSeason.value)
        // getSeasonData(initOvfData)
        // loading.hide()
        // console.log('数据初始化完成', { routesData, countryData, overflyData, curCountry });
    } catch (error) {
        console.error('API error:', error);
    }
};
onMounted(() => {
    initData();
});

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