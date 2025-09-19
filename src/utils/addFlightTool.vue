<template>
    <el-dialog v-model="visible" :title="editMode ? '编辑航班' : '新增航班'" width="90%">
        <el-select v-model="mode" placeholder="请选择输入方式" style="margin-bottom: 20px;">
            <el-option v-for="item in modeOption" :key="item" :label="modeLabels[item]" :value="item" />
        </el-select>
        <!-- 上传Excel -->
        <div v-if="mode == 'byExcel'">

            <SeasonSelect v-model="curSeason" />

            <el-select v-model="selectAttribution" style="width: 30%;">
                <el-option v-for="item in attributionOption" :key="item" :label="item" :value="item" />
            </el-select>
            <el-upload :auto-upload="false" :on-change="handleFile" accept=".xlsx, .xls">
                <el-button type="primary" :disabled="!curSeason || !selectAttribution">上传Excel文件</el-button>
            </el-upload>

            <el-tag v-if="processedData.length">识别出{{ processedData.length }}条航班</el-tag>
            <el-tag v-if="intlFlight.length">识别出{{ intlFlight.length }}条国际航班</el-tag>
            <el-tag v-if="countryFlight.length">识别出{{ countryFlight.length }}条国内航班</el-tag>

            <!-- excel数据表格 -->
            <el-table :data="processedData" v-if="processedData.length" max-height="500"
                :row-class-name="tableRowClassName">
                <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" />
            </el-table>
            <el-button @click="syncDataToFather">确认上传数据</el-button>
            <!-- 时间冲突选择弹窗 -->
            <el-dialog v-model="showConflictDialog" title="航班时间冲突" width="60%">
                <el-table :data="conflictList" style="width: 100%">
                    <el-table-column label="航班号" prop="flightNo" />
                    <el-table-column label="冲突起飞时间">
                        <template #default="{ row }">
                            <el-radio-group v-model="row.selectedIndex">
                                <el-radio v-for="(opt, idx) in row.options" :label="idx" :key="idx">
                                    {{ opt.depTime }} → {{ opt.arrTime }}
                                </el-radio>
                            </el-radio-group>
                        </template>
                    </el-table-column>
                </el-table>
                <template #footer>
                    <el-button @click="showConflictDialog = false">取消</el-button>
                    <el-button type="primary" @click="confirmConflictSelection">确认选择</el-button>
                </template>
            </el-dialog>
            <el-row v-if="addedSectors.length || removedSectors.length">
                <el-col :span="8">
                    <el-card shadow="hover" v-if="addedSectors.length" class="sector-card">
                        <h3>新增航段({{ addedSectors.length }}条)</h3>
                        <el-table :data="addedSectorsData">
                            <el-table-column label="航段" prop="flightNo" />
                            <el-table-column label="起飞机场" prop="depAirport" />
                            <el-table-column label="落地机场" prop="arrAirport" />
                            <el-table-column label="起飞时间" prop="depTime" />
                            <el-table-column label="落地时间" prop="arrTime" />
                            <el-table-column label="机型" prop="aircraftType" />
                        </el-table>
                    </el-card>
                </el-col>
                <el-col :span="8" style="height: 600px;overflow-y: scroll;">
                    <el-card shadow="hover" v-if="removedSectors.length" class="sector-card">
                        <h3>现有数据多的航段({{ removedSectors.length }}条)</h3>
                        <el-table :data="removedSectorsData">
                            <el-table-column label="航段" prop="flightNumber" />
                            <el-table-column label="起飞机场" prop="departure" />
                            <el-table-column label="落地机场" prop="arrival" />
                            <el-table-column label="起飞时间" prop="departureTime" />
                            <el-table-column label="落地时间" prop="arrivalTime" />
                            <el-table-column label="机型" prop="aircraftType" />
                        </el-table>
                    </el-card>
                </el-col>
                <el-col :span="8">
                    <h3>冲突航段({{ conflictWithOrigin.length }}条)</h3>

                    <div v-for="(item, key) in conflictWithOrigin" :key="key">
                        <el-card shadow="hover" class="conflict-card-item">

                            <div class="card-title">
                                <h3>航班号：{{ item.flightNo }}</h3>
                                <el-tag v-if="item.isDuplicate" type="success">重复航班</el-tag> <!-- 显示重复航班标识 -->
                                <!-- 
                            <el-tag v-if="item.isOriginalData" type="primary">原始数据</el-tag>
                            <el-tag v-else type="success">新数据</el-tag> -->
                            </div>
                            <div class="card-body">
                                <!-- 循环展示冲突信息 -->
                                <div v-if="item.conflicts.depTime" class="conflict-detail">
                                    <strong>起飞时间冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.depTime.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.depTime.new }}</el-tag>
                                </div>
                                <div v-if="item.conflicts.arrTime" class="conflict-detail">
                                    <strong>到达时间冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.arrTime.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.arrTime.new }}</el-tag>
                                </div>
                                <div v-if="item.conflicts.aircraft" class="conflict-detail">
                                    <strong>机型冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.aircraft.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.aircraft.new }}</el-tag>
                                </div>
                                <div v-if="item.conflicts.days" class="conflict-detail">
                                    <strong>班期冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.days.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.days.new }}</el-tag>
                                </div>
                            </div>
                        </el-card>
                    </div>

                </el-col>
            </el-row>
        </div>
        <div v-if="mode === 'manAdd'">
            <el-table :data="addFlightForms" border style="width: 100%; margin-bottom: 10px;">
                <el-table-column label="航季" width="120">
                    <template #default="{ row }">
                        <SeasonSelect v-model="row.season" />
                    </template>
                </el-table-column>

                <el-table-column label="性质" width="180">
                    <template #default="{ row }">
                        <el-select v-model="row.attribution" placeholder="请选择航班性质" style="width: 160px">
                            <el-option v-for="(item, index) in attributeData" :key="index"
                                :label="`${item.name} / ${item.attribute}`" :value="`${item.attribute}`" />
                        </el-select>
                    </template>
                </el-table-column>

                <el-table-column label="航班号" width="150">
                    <template #default="{ row }">
                        <el-input v-model="row.flightNumber" placeholder="航班号" maxlength="6"
                            @blur="validateFlightNumber(row)" />
                    </template>
                </el-table-column>

                <el-table-column label="起飞机场" width="150">
                    <template #default="{ row }">
                        <AirportAutocomplete v-model="row.departure" @select="handleDepartureSelect" />
                    </template>
                </el-table-column>

                <el-table-column label="起飞时间" width="120">
                    <template #default="{ row }">
                        <el-time-picker v-model="row.departureTime" format="HH:mm" value-format="HH:mm"
                            placeholder="起飞时间" />
                    </template>
                </el-table-column>

                <el-table-column label="落地机场" width="150">
                    <template #default="{ row }">
                        <AirportAutocomplete v-model="row.arrival" @select="handleDepartureSelect" />
                    </template>
                </el-table-column>

                <el-table-column label="落地时间" width="120">
                    <template #default="{ row }">
                        <el-time-picker v-model="row.arrivalTime" format="HH:mm" value-format="HH:mm"
                            placeholder="落地时间" />
                    </template>
                </el-table-column>

                <el-table-column label="机型" width="200">
                    <template #default="{ row }">
                        <el-select v-model="row.aircraftType" multiple placeholder="请选择机型" style="width: 180px"
                            @change="handleSelect_ACType(row.aircraftType)">
                            <el-option v-for="item in aircraftData" :key="item.index" :label="item.aircraftType"
                                :value="item.aircraftType" />
                        </el-select>
                    </template>
                </el-table-column>

                <el-table-column label="开始时间" width="150">
                    <template #default="{ row }">
                        <el-date-picker v-model="row.startDate" type="date" placeholder="开始时间" style="width: 120px" />
                    </template>
                </el-table-column>

                <el-table-column label="结束时间" width="150">
                    <template #default="{ row }">
                        <el-date-picker v-model="row.endDate" type="date" placeholder="结束时间" style="width: 120px" />
                    </template>
                </el-table-column>

                <el-table-column label="周期" width="180">
                    <template #default="{ row }">
                        <daysPicker v-model="row.days" />
                    </template>
                </el-table-column>


                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ $index }">
                        <el-button type="danger" :icon="Minus" @click="removeRow($index)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div style="margin: 10px 0">
                <el-button type="primary" :icon="Plus" @click="addRow">
                    添加一行航班
                </el-button>
            </div>

            <div style="text-align: right">
                <el-button type="primary" @click="syncDataToFather(mode)">创建</el-button>
            </div>
        </div>
        <div>

            <!-- <el-dialog v-model="showAddFlight" title="新建航班" width="90%">
               
            </el-dialog> -->
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import airportsCheck from 'airport-codes'
import { ElMessage } from 'element-plus'
import airports from 'airport-timezone';
import SeasonSelect from '../utils/seasonSelect.vue'
import { useSeasonData } from '../components/useSeasonUtils.js'
import { beijingToUTC, utcToBeijing, formatTimeWithoutColon, formatTimeWithColon, beijingToLocal } from '../utils/timeTransfer';
import { transferToOutput } from '../utils/airportCodeTool'
import { attributeData, aircraftData } from '../api'
import daysPicker from '../utils/daysPicker.vue'
import { validateFlightNumber, normalizeDays, formatDate } from '../utils/tool.js'
const { seasonData } = useSeasonData()
const props = defineProps({ visible: Boolean, originData: Array, isEditing: Boolean, editData: Array })
const visible = ref(props.visible)
const emit = defineEmits(['update:visible', 'parsed'])
console.log('parentFlights', props.originData)
import AirportAutocomplete from '../utils/airportAutocomplete.vue'

watch(() => props.visible, val => (visible.value = val))
watch(visible, val => emit('update:visible', val))

const curSeason = ref()
const selectedSeason = ref()
watch(curSeason, (val) => {
    selectedSeason.value = seasonData.value.find(item => item.en === val)
    console.log('选中的完整航季:', selectedSeason)
})
const columns = [
  { prop: 'season', label: '航季' },
  { prop: 'attribution', label: '性质' },
  { prop: 'flightNo', label: '航班号' },
  { prop: 'aircraft', label: '机型' },
  { prop: 'days', label: '班期' },
  { prop: 'depAirport', label: '起飞机场' },
  { prop: 'depTime', label: '起飞时间' },
  { prop: 'arrAirport', label: '落地机场' },
  { prop: 'arrTime', label: '落地时间' },
  { prop: 'flightType', label: '航班类型' }
]
const emptyForm = () => ({
    season: '',
    attribution: '',
    flightNumber: '',
    departure: '',
    departureTime: '',
    arrival: '',
    arrivalTime: '',
    aircraftType: '',
    startDate: '',
    endDate: '',
    days: [],
})


const addFlightForms = ref([])
// 映射父组件传来的编辑数据到表单结构
const mapEditData = (data) => {
    const arrayData = Array.isArray(data) ? data : [data];
    return arrayData.map(f => ({
        flight_id: f.flight_id,
        season: f.season || '',
        attribution: f.attribution || '',
        flightNumber: f.flightNo || f.flightNumber || '',
        departure: f.depAirport || f.departure || '',
        departureTime: f.depTime || f.departureTime || '',
        arrival: f.arrAirport || f.arrival || '',
        arrivalTime: f.arrTime || f.arrivalTime || '',
        aircraftType: f.aircraft || '',
        startDate: f.startDate || '',
        endDate: f.endDate || '',
        days: Array.isArray(f.days) ? f.days : (f.days ? f.days.split('') : []),
    }))
}
const editMode = ref(false)
watch(
    () => props.isEditing,
    (val) => {
        console.log('props.editData', props.editData, ' props.isEditing', props.isEditing)
        if (val && props.editData) {
            editMode.value = true
            mode.value = 'manAdd'
            addFlightForms.value = mapEditData(props.editData)
            console.log('mode', mode.value)

            console.log('addFlightForms', addFlightForms.value)
        } else {
            addFlightForms.value = []
        }
    },
    { immediate: true }
)

const mode = ref('')
const modeOption = ref(['manAdd', 'byExcel', 'autoRead'])
const modeLabels = {
    manAdd: "手动新增",
    byExcel: "Excel 导入",
    autoRead: "自动识别"
}
const processedData = ref([])
const intlFlight = ref([])
const countryFlight = ref([])
const attributionOption = ['schedule', 'non-schedule']

const showConflictDialog = ref(false)
const conflictList = ref([])
const selectedFlights = ref(new Set()) // 记录用户选择的航班 key
const selectAttribution = ref()
const flightNoRegex = /^(MF|CXA)\d{3,4}$/
const airportRegex = /^[A-Z]{3,4}$/
const timeRegex = /^\d{3,4}$/
const daysRegex = /^[\.1-7]{7}$/ // 班期
const showConflictDialog2 = ref(false)


const addRow = () => {
    addFlightForms.value.push(emptyForm())
}

const removeRow = (index) => {
    addFlightForms.value.splice(index, 1)
}

const submit = () => {
    console.log(' addFlightForms.value', addFlightForms.value)
}
const aircraftNumberData = ref([])
const handleSelect_ACType = (selectedTypes) => {
    aircraftNumberData.value = [];

    selectedTypes.forEach(type => {
        const matchedAircrafts = aircraftData.value.filter(
            item => item.aircraftType === type
        );
        console.log('matchedAircrafts', matchedAircrafts)
        matchedAircrafts.forEach(item => {
            const numbers = item.aircraftNumber.name.split(',').map(num => num.trim());
            numbers.forEach(number => {
                aircraftNumberData.value.push({
                    number,             // 注册号
                    type: item.aircraftType // 对应机型
                });
            });
        });
    });

    console.log('aircraftNumberData:', aircraftNumberData.value);
};


const needToMapData = ref()
const syncDataToFather = (source) => {
    if (source == 'manAdd') {
        needToMapData.value = addFlightForms.value

    } if (source == 'byExcel') {
        needToMapData.value = processedData.value
    }
    if (!curSeason) {
        ElMessage.error('请选择航季');
        return;
    }
    if (!selectAttribution) {
        ElMessage.error('请选择航班性质');
        return;
    }
    if (!needToMapData.value.length) {
        ElMessage.error('航班数据不可为空');
        return;
    }
    console.log('needToMapData', needToMapData)
    const mappedData = needToMapData.value.map(f => ({
        flight_id: f.flight_id || '',
        season: f.season,
        attribution: f.attribution,
        flightNumber: f.flightNo || f.flightNumber,
        departure: f.depAirport || f.departure,
        departureTime: formatTimeWithColon(f.depTime || f.departureTime),
        arrival: f.arrAirport || f.arrival,
        arrivalTime: formatTimeWithColon(f.arrTime || f.arrivalTime),
        aircraftType: f.aircraft || f.aircraftType,
        // aircraftNumber: f.flightNo,
        startDate: formatDate(f.startDate || selectedSeason.value.seasonStart),
        endDate: formatDate(f.endDate || selectedSeason.value.seasonEnd),
        days: normalizeDays(f.days) // 转成数组
    }))
    console.log('mappedData', mappedData)
    // return
    emit("parsed", mappedData)
    // 关闭弹窗
    emit('update:visible', false)

}

async function handleFile(file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        const rows = jsonData.filter(r => r.some(c => c !== ''))

        const flightMap = {}
        for (const [rowIndex, row] of rows.entries()) {
            const segments = await parseFlightRow(row)
            console.log('segments', segments)
            if (!segments.length) continue

            for (const seg of segments) {   // ✅ 遍历每个航段
                const key = `${seg.flightNo}_${seg.depAirport}_${seg.arrAirport}`

                if (!flightMap[key]) {
                    flightMap[key] = {
                        season: seg.season,
                        attribution: seg.attribution,
                        flightNo: seg.flightNo,
                        depAirport: seg.depAirport,
                        arrAirport: seg.arrAirport,
                        aircraftList: [seg.aircraft],
                        days: seg.days,
                        timeOptions: [{ depTime: seg.depTime, arrTime: seg.arrTime }],
                        order: rowIndex
                    }
                } else {
                    const f = flightMap[key]
                    if (!f.aircraftList.includes(seg.aircraft)) f.aircraftList.push(seg.aircraft)
                    f.days = mergeDays(f.days, seg.days)
                    if (!f.timeOptions.some(t => t.depTime === seg.depTime && t.arrTime === seg.arrTime)) {
                        f.timeOptions.push({ depTime: seg.depTime, arrTime: seg.arrTime })
                    }
                }
            }
        }


        // 构建冲突航班列表 / 已处理航班列表
        conflictList.value = []
        processedData.value = []

        Object.values(flightMap).forEach(f => {
            if (f.timeOptions.length > 1) {
                // 有冲突 -> 放到 conflictList
                conflictList.value.push({
                    ...f,
                    selectedIndex: 0,
                    options: f.timeOptions,
                    order: f.order   // ✅ 用 f.order，而不是 rowIndex
                })
            } else {
                // 无冲突 -> 直接放到 processedData
                processedData.value.push({
                    season: f.season,
                    attribution: f.attribution,
                    flightNo: f.flightNo,
                    depAirport: f.depAirport,
                    arrAirport: f.arrAirport,
                    depTime: f.timeOptions[0].depTime,
                    arrTime: f.timeOptions[0].arrTime,
                    aircraft: f.aircraftList.join(','),
                    days: f.days,
                    flightType: getFlightType(f.depAirport, f.arrAirport),
                    _highlight: false,
                    order: f.order   // ✅
                })
            }
        })
        compareSectors()


        if (conflictList.value.length > 0) {
            showConflictDialog.value = true
        }

        processedData.value.sort((a, b) => a.order - b.order)
        console.log('processedData', processedData)
        intlFlight.value = processedData.value.filter(item => item.flightType == '国际')
        countryFlight.value = processedData.value.filter(item => item.flightType == '国内')
        console.log('intlFlight', intlFlight)
        console.log('countryFlight', countryFlight)
    }
    reader.readAsArrayBuffer(file.raw)

}
const addedSectors = ref([])
const addedSectorsData = ref([])

const removedSectors = ref([])
const removedSectorsData = ref([])

const conflictWithOrigin = ref([])
const compareSectors = () => {
    const processedSectors = processedData.value.map(f => `${f.flightNo}_${f.depAirport}_${f.arrAirport}`)
    const originalSectors = props.originData.map(f => `${f.flightNumber}_${f.departure}_${f.arrival}`)

    addedSectors.value = processedSectors.filter(sector => !originalSectors.includes(sector))
    addedSectorsData.value = processedData.value.filter(item => {
        const sectorKey = `${item.flightNo}_${item.depAirport}_${item.arrAirport}`;
        return addedSectors.value.includes(sectorKey);
    });
    removedSectors.value = originalSectors.filter(sector => !processedSectors.includes(sector))
    removedSectorsData.value = props.originData.filter(item => {
        const sectorKey = `${item.flightNumber}_${item.departure}_${item.arrival}`;
        return removedSectors.value.includes(sectorKey);
    });
    // console.log('addedSectors', addedSectors)
    // console.log('addedSectorsData', addedSectorsData)

    // console.log('removedSectors', removedSectors)
    // console.log('removedSectorsData', removedSectorsData)

    conflictWithOrigin.value = []

    processedData.value.forEach(f => {
        const existing = props.originData.find(o => `${o.flightNumber}_${o.departure}_${o.arrival}` === `${f.flightNo}_${f.depAirport}_${f.arrAirport}`)

        if (existing) {
            const conflicts = {}
            if (f.depTime !== existing.departureTime) conflicts.depTime = { new: f.depTime, old: existing.departureTime }
            if (f.arrTime !== existing.arrivalTime) conflicts.arrTime = { new: f.arrTime, old: existing.arrivalTime }
            if (f.aircraft !== existing.aircraftType) conflicts.aircraft = { new: f.aircraft, old: existing.aircraftType }
            if (f.days !== existing.days) conflicts.days = { new: f.days, old: existing.days }
            if (f.days !== existing.attribution) conflicts.attribution = { new: f.attribution, old: existing.attribution }

            if (Object.keys(conflicts).length > 0) {
                conflictWithOrigin.value.push({ ...f, conflicts, isDuplicate: false })
                console.log('conflictWithOrigin', conflictWithOrigin)
            } else {
                // 如果没有冲突，标记为重复航班
                conflictWithOrigin.value.push({ ...f, isDuplicate: true })  // 标记为重复航班
            }
        }


    })

    if (conflictWithOrigin.value.length > 0) {
        showConflictDialog2.value = true
    }
}

const handleConflictAction = (row, action) => {
    const processedFlight = processedData.value.find(f => f.flightNo === row.flightNo && f.depAirport === row.depAirport && f.arrAirport === row.arrAirport)
    const originalFlight = props.originData.find(f => f.flightNumber === row.flightNo && f.departure === row.depAirport && f.arrival === row.arrAirport)

    if (action === 'merge') {
        // 合并冲突数据
        if (processedFlight && originalFlight) {
            const mergedFlight = { ...processedFlight }

            // 合并时间字段，选择最新的时间
            if (processedFlight.depTime !== originalFlight.departureTime) {
                mergedFlight.depTime = processedFlight.depTime // 选择 processedData 的时间，或者合并为一个新的字段
            }

            if (processedFlight.arrTime !== originalFlight.arrTime) {
                mergedFlight.arrTime = processedFlight.arrTime // 同上
            }

            // 合并机型字段，选择所有机型
            const allAircraft = new Set([...(processedFlight.aircraft.split(',')), ...(originalFlight.aircraftType.split(','))])
            mergedFlight.aircraft = Array.from(allAircraft).join(',')

            // 合并班期
            mergedFlight.days = mergeDays(processedFlight.days, originalFlight.days)

            // 更新处理过的航段
            const idx = processedData.value.findIndex(f => f.flightNo === processedFlight.flightNo && f.depAirport === processedFlight.depAirport && f.arrAirport === processedFlight.arrAirport)
            if (idx !== -1) {
                processedData.value[idx] = mergedFlight
            } else {
                processedData.value.push(mergedFlight)
            }

            // 移除原航段
            const originalIdx = props.originData.findIndex(f => f.flightNumber === originalFlight.flightNumber && f.departure === originalFlight.departure && f.arrival === originalFlight.arrival)
            if (originalIdx !== -1) {
                props.originData.splice(originalIdx, 1)
            }

        }
    } else if (action === 'keepBoth') {
        // 保留两条数据
        if (processedFlight && originalFlight) {
            // 保留 processedData 中的航段
            const newFlight = { ...processedFlight }
            processedData.value.push(newFlight)

            // 保留 originData 中的航段
            const originalCopy = { ...originalFlight }
            props.originData.push(originalCopy)
        }
    } else if (action === 'keepOne') {
        // 保留 processedData 中的航段，更新 originData 中的航段
        if (processedFlight && originalFlight) {
            // 更新原始数据的字段为 processedData 中的内容
            originalFlight.departureTime = processedFlight.depTime
            originalFlight.arrTime = processedFlight.arrTime
            originalFlight.aircraftType = processedFlight.aircraft
            originalFlight.days = processedFlight.days
            originalFlight.flightNumber = processedFlight.flightNo
            originalFlight.departure = processedFlight.depAirport
            originalFlight.arrival = processedFlight.arrAirport

            // 更新 processedData
            const idx = processedData.value.findIndex(f => f.flightNo === processedFlight.flightNo && f.depAirport === processedFlight.depAirport && f.arrAirport === processedFlight.arrAirport)
            if (idx !== -1) {
                processedData.value[idx] = { ...processedFlight }
            }

            // 更新 props.originData 数据
            const originalIdx = props.originData.findIndex(f => f.flightNumber === originalFlight.flightNumber && f.departure === originalFlight.departure && f.arrival === originalFlight.arrival)
            if (originalIdx !== -1) {
                props.originData[originalIdx] = { ...originalFlight }
            }
        }
    }
}

function mergeDays(days1, days2) {
    // console.log('days1',days1,'days2',days2)
    let res = ''
    for (let i = 0; i < 7; i++) {
        const c1 = days1[i] || '.'
        const c2 = days2[i] || '.'
        res += (c1 !== '.' || c2 !== '.') ? (c1 !== '.' ? c1 : c2) : '.'
    }
    return res
}


function confirmConflictSelectionWithOrigin() {
    conflictList.value.forEach(item => {
        const sel = item.conflicts
        const newFlight = {
            flightNo: item.flightNo,
            depAirport: item.depAirport,
            arrAirport: item.arrAirport,
            depTime: sel.depTime.new,
            arrTime: sel.arrTime.new,
            aircraft: item.aircraftList.join(','),
            days: item.days,
            flightType: getFlightType(item.depAirport, item.arrAirport),
            order: item.order
        }

        const idx = processedData.value.findIndex(f => f.order === item.order)
        if (idx !== -1) {
            processedData.value[idx] = newFlight
        } else {
            processedData.value.push(newFlight)
        }
    })

    conflictList.value = []
    showConflictDialog2.value = false
}
async function parseFlightRow(row) {
    // console.log('row', row)

    let flightNo = '', aircraft = '', days = ''
    const airports = [], times = []

    for (const cell of row) {
        if (!cell) continue
        const val = String(cell).trim()
        if (flightNoRegex.test(val)) flightNo = val
        else if (/^(738|737|321|320|788|789|330|350)$/.test(val)) aircraft = val
        else if (daysRegex.test(val)) days = val
        else if (airportRegex.test(val)) airports.push(transferToOutput(val, 'ICAOCode'))
        else if (timeRegex.test(val)) times.push(val)
    }
    // console.log('airports',airports)
    // console.log('times',times)

    const segments = []
    for (let i = 0; i < airports.length - 1; i++) {
        const depAirport = airports[i]
        const arrAirport = airports[i + 1]
        const depTime = times[i * 2]
        const arrTime = times[i * 2 + 1]

        // let segDays = days

        // ⚠️ 跨天处理：如果到达时间小于起飞时间，就把班期往后移一天
        // if (arrTime && depTime && parseInt(arrTime) < parseInt(depTime)) {
        //     segDays = shiftDays(segDays)
        // }

        segments.push({
            season: curSeason.value,
            attribution: selectAttribution.value,
            flightNo,
            aircraft,
            days,
            // days: segDays,
            depAirport,
            depTime,
            arrAirport,
            arrTime,
            flightType: getFlightType(depAirport, arrAirport)
        })
    }
    return segments
}

function shiftDays(days) {
    if (!days) return days
    let shifted = ''
    for (let i = 0; i < 7; i++) {
        shifted += days[(i + 6) % 7] // 往右移
    }
    return shifted
}

const getFlightType = (depIata, arrIata) => {
    // if (depIata == 'PKX') {
    //     console.log('da xing', airports.find(a => a.attributes.iata === depIata))
    // }
    const depInfo = airports.find(a => a.code === depIata)
    const arrInfo = airports.find(a => a.code === arrIata)

    if (!depInfo || !arrInfo) return '未知'

    return (depInfo.countryCode === 'CN' && arrInfo.countryCode === 'CN') ? '国内' : '国际'
}

// 用户选择冲突时间后确认
function confirmConflictSelection() {
    conflictList.value.forEach(item => {
        const sel = item.options[item.selectedIndex]
        const newFlight = {
            flightNo: item.flightNo,
            depAirport: item.depAirport,
            arrAirport: item.arrAirport,
            depTime: sel.depTime,
            arrTime: sel.arrTime,
            aircraft: item.aircraftList.join(','),
            days: item.days,
            flightType: getFlightType(item.depAirport, item.arrAirport),
            _highlight: true,
            order: item.order
        }

        // 找到对应位置
        const idx = processedData.value.findIndex(f => f.order === item.order)
        if (idx !== -1) {
            processedData.value[idx] = newFlight  // 替换
        } else {
            processedData.value.push(newFlight)  // 如果没找到就插入
        }
    })

    conflictList.value = []
    showConflictDialog.value = false

    // ✅ 再按照原始顺序排序一次
    processedData.value.sort((a, b) => a.order - b.order)
}

// 表格行样式
function tableRowClassName({ row }) {
    return row._highlight ? 'highlight-flight' : ''
}

watch(
    () => processedData.value,
    (val) => {
        addFlightForms.value = mapEditData(processedData.value)
        console.log('映射到表格数据', addFlightForms.value)
        // if (val && props.editData) {
        //     editMode.value = true
        //     mode.value = 'manAdd'
        //     console.log('mode',mode.value)

        //     console.log('addFlightForms',addFlightForms.value)
        // } else {
        //     addFlightForms.value = []
        // }
    },
    { immediate: true }
)
</script>

<style>
.highlight-flight {
    background-color: #ffbb27 !important;
}

.conflict-card {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-around;
}

.conflict-card-item {
    width: 90%;
    /* padding: 10px; */
    margin-bottom: 20px;
}

.card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.card-body {
    margin-top: 10px;
}

.card-body div {
    margin-bottom: 5px;
}

/* .el-tag {
    margin-left: 10px;
} */
</style>