<template>
    <el-dialog v-model="visible" :title="editMode ? '编辑航班' : '新增航班'" width="90%">
        <!-- <el-select v-model="mode" placeholder="请选择输入方式" style="margin-bottom: 20px;">
            <el-option v-for="item in modeOption" :key="item" :label="modeLabels[item]" :value="item" />
        </el-select> -->
        <el-radio-group v-model="mode" v-if="!editMode">
            <el-radio v-for="item in modeOption" :key="item.value" :label="item.value">
                {{ item.label }}
            </el-radio>
        </el-radio-group>

        <!-- 上传Excel -->
        <div v-if="mode == 'byExcel'">

            <SeasonSelect v-model="curSeason" />

            <el-select v-model="selectAttribution" style="width: 30%;" v-if="!editMode">
                <el-option v-for="item in attributeData" :key="item.attribute" :label="item.name"
                    :value="item.attribute" />
            </el-select>
            <el-upload :auto-upload="false" :on-change="handleFile" accept=".xlsx, .xls">
                <el-button type="primary" :disabled="!curSeason || !selectAttribution">上传Excel文件</el-button>
            </el-upload>

            <el-tag v-if="addFlightDataForm.length">识别出{{ addFlightDataForm.length }}条航班</el-tag>
            <el-tag v-if="intlFlight.length">识别出{{ intlFlight.length }}条国际航班</el-tag>
            <el-tag v-if="countryFlight.length">识别出{{ countryFlight.length }}条国内航班</el-tag>

            <!-- excel数据表格 -->
            <el-table :data="addFlightDataForm" v-if="addFlightDataForm.length" max-height="500"
                :row-class-name="tableRowClassName">
                <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" />
            </el-table>
            <el-button @click="syncDataToFather">确认航班数据并上传</el-button>
            <!-- 时间冲突选择弹窗 -->
            <el-dialog v-model="showConflictDialog" title="航班时间冲突" width="60%">
                <el-table :data="conflictList" style="width: 100%">
                    <el-table-column label="航班号" prop="flightNumber" />
                    <el-table-column label="冲突起飞时间">
                        <template #default="{ row }">
                            <el-radio-group v-model="row.selectedIndex">
                                <el-radio v-for="(opt, idx) in row.options" :label="idx" :key="idx">
                                    {{ opt.departureTime }} → {{ opt.arrivalTime }}
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
                            <el-table-column label="航段" prop="flightNumber" />
                            <el-table-column label="起飞机场" prop="departure" />
                            <el-table-column label="落地机场" prop="arrival" />
                            <el-table-column label="起飞时间" prop="departureTime" />
                            <el-table-column label="落地时间" prop="arrivalTime" />
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
                                <h3>航班号：{{ item.flightNumber }}</h3>
                                <el-tag v-if="item.isDuplicate" type="success">重复航班</el-tag> <!-- 显示重复航班标识 -->
                                <!-- 
                            <el-tag v-if="item.isOriginalData" type="primary">原始数据</el-tag>
                            <el-tag v-else type="success">新数据</el-tag> -->
                            </div>
                            <div class="card-body">
                                <!-- 循环展示冲突信息 -->
                                <div v-if="item.conflicts.departureTime" class="conflict-detail">
                                    <strong>起飞时间冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.departureTime.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.departureTime.new }}</el-tag>
                                </div>
                                <div v-if="item.conflicts.arrivalTime" class="conflict-detail">
                                    <strong>到达时间冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.arrivalTime.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.arrivalTime.new }}</el-tag>
                                </div>
                                <div v-if="item.conflicts.aircraftType" class="conflict-detail">
                                    <strong>机型冲突：</strong>
                                    <el-tag type="danger">旧：{{ item.conflicts.aircraftType.old }}</el-tag>
                                    <el-tag type="success">新：{{ item.conflicts.aircraftType.new }}</el-tag>
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
        <addDataTool :mode="'airport'" v-model:visible="showAddAirport" :isEditing="editAirportMode"
            @parsed="handleAirportData" :editData="disMatchList" />

        <div>

            <!-- <el-dialog v-model="showAddFlight" title="新建航班" width="90%">
               
            </el-dialog> -->
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, watch, toRaw } from 'vue'
import * as XLSX from 'xlsx'
import airportsCheck from 'airport-codes'
import { ElMessage } from 'element-plus'
import airports from 'airport-timezone';
import SeasonSelect from '../utils/seasonSelect.vue'
import { useSeasonData } from '../components/useSeasonUtils.js'
import { beijingToUTC, utcToBeijing, formatTimeWithoutColon, formatTimeWithColon, beijingToLocal } from '../utils/timeTransfer';
import { transferToOutput, disMatchList } from '../utils/airportCodeTool'
import { attributeData, aircraftData, getAirportCode, addAirportCode } from '../api'
import daysPicker from '../utils/daysPicker.vue'
import { validateFlightNumber, normalizeDays, formatDate } from '../utils/tool.js'
import addDataTool from '../utils/addDataTool.vue'

const { seasonData } = useSeasonData()
const props = defineProps({ visible: Boolean, originData: Array, isEditing: Boolean, editData: Array })
const visible = ref(props.visible)
const emit = defineEmits(['update:visible', 'parsed'])
const showAddAirport = ref(false)
const editAirportMode = ref(false)
const selectAttribution = ref()
console.log('parentFlights', props.originData)
import AirportAutocomplete from '../utils/airportAutocomplete.vue'

watch(() => props.visible, val => (visible.value = val))
watch(visible, val => emit('update:visible', val))

const curSeason = ref()
const selectedSeason = ref()
watch(curSeason, (val) => {
    selectedSeason.value = seasonData.value.find(item => item.en === val)
    console.log('选中的航季:', selectedSeason)
    if (addFlightDataForm.value) {
        addFlightDataForm.value.forEach(item => {
            item.season = selectedSeason.value.en
            item.startDate = selectedSeason.value.seasonStart
            item.endDate = selectedSeason.value.seasonEnd

        })
    }
})
watch(selectAttribution, (val) => {

    if (addFlightDataForm.value) {
        addFlightDataForm.value.forEach(item => {
            item.attribution = selectAttribution.value

        })
    }
})
const columns = [
    { prop: 'season', label: '航季' },
    { prop: 'attribution', label: '性质' },
    { prop: 'flightNumber', label: '航班号' },
    { prop: 'aircraftType', label: '机型' },
    { prop: 'days', label: '班期' },
    { prop: 'departure', label: '起飞机场' },
    { prop: 'departureTime', label: '起飞时间' },
    { prop: 'arrival', label: '落地机场' },
    { prop: 'arrivalTime', label: '落地时间' },
    { prop: 'flightType', label: '航班类型' }
]
const options = [
    {
        value: 'handInput',
        label: '手动输入',
    },
    {
        value: 'excelInput',
        label: '导入excel',
    },
    {
        value: 'autoInput',
        label: '自动识别',
    },
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
        flightNumber: f.flightNumber || f.flightNumber || '',
        departure: f.departure || f.departure || '',
        departureTime: f.departureTime || f.departureTime || '',
        arrival: f.arrival || f.arrival || '',
        arrivalTime: f.arrivalTime || f.arrivalTime || '',
        aircraftType: f.aircraftType || '',
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
// const modeOption = ref(['manAdd', 'byExcel', 'autoRead'])
const modeOption = [
    {
        value: 'manAdd',
        label: '手动输入',
    },
    {
        value: 'byExcel',
        label: '导入excel',
    },
    {
        value: 'autoRead',
        label: '自动识别',
    },
]
const modeLabels = {
    manAdd: "手动新增",
    byExcel: "Excel 导入",
    autoRead: "自动识别"
}
const addFlightDataForm = ref([])
const intlFlight = ref([])
const countryFlight = ref([])
const attributionOption = ['schedule', 'non-schedule']

const showConflictDialog = ref(false)
const conflictList = ref([])
const selectedFlights = ref(new Set()) // 记录用户选择的航班 key



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


const needToMapData = ref([])

const syncDataToFather = () => {
    // console.log('需要申请的机场代码',disMatchList)
    console.log('需要申请的机场代码', disMatchList)

    if (disMatchList.length != 0) {
        showAddAirport.value = true
        editAirportMode.value = true
    } else {
        showAddAirport.value = false
        editAirportMode.value = false
        if (mode.value == 'manAdd') {
            needToMapData.value = addFlightForms.value

        } if (mode.value == 'byExcel') {
            needToMapData.value = addFlightDataForm.value
        }

        if (!curSeason) {
            ElMessage.error('请选择航季');
            return;
        }
        if (!selectAttribution) {
            ElMessage.error('请选择航班性质');
            return;
        }

        console.log('needToMapData', needToMapData)
        const mappedData = needToMapData.value.map(f => ({
            flight_id: f.flight_id || '',
            season: f.season,
            attribution: f.attribution,
            flightNumber: f.flightNumber,
            departure: f.departure,
            departureTime: formatTimeWithColon(f.departureTime),
            arrival: f.arrival || f.arrival,
            arrivalTime: formatTimeWithColon(f.arrivalTime),
            aircraftType: f.aircraftType || f.aircraftType,
            // aircraftNumber: f.flightNumber,
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


}
const addAirportData = ref()
const handleAirportData = async (processedDataFromChild) => {
    console.log("父组件收到数据:", processedDataFromChild)
    addAirportData.value = processedDataFromChild
    //     ? processedDataFromChild
    //     : [emptyFlight()]
    // console.log('addFlightForms', addFlightForms.value)
    await onSubmitAirport()
}
const airportData = ref([])

const onSubmitAirport = async () => {
    console.log('addAirportData', addAirportData)
    const submitData = addAirportData.value.map(row => ({ ...toRaw(row) }))

    if (editAirportMode.value == true) {
        const airportResponse = await addAirportCode(submitData).then(async () => {
            ElMessage.success('更新成功 ');
            disMatchList = []

            // const newAirportResponse = await getAirportCode();
            console.log('disMatchList ====', disMatchList)

            // airportCodeList.value = newAirportResponse.data
        }).catch(err => {
            ElMessage.error('失败');
            console.error('添加失败:', err);
        });
        console.log('airportResponse ====', airportResponse)
    } else {

        const airportResponse = await addAirportCode(submitData).then(() => {
            ElMessage.success('机场数据添加成功');
            // airportCodeList.value = airportResponse.data

        }).catch(err => {
            console.error('添加失败:', err);
        });
        console.log('airportResponse ====', airportResponse)

    }




}
async function handleFile(file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        const rows = jsonData.filter(r => r.some(c => c !== ''))
        console.log('识别的excel原始文件rows', rows)

        const flightMap = {}
        for (const [rowIndex, row] of rows.entries()) {
            const segments = await parseFlightRow(row)
            console.log('segments', segments)
            if (!segments.length) continue

            for (const seg of segments) {   // ✅ 遍历每个航段
                const key = `${seg.flightNumber}_${seg.departure}_${seg.arrival}`

                if (!flightMap[key]) {
                    flightMap[key] = {
                        season: seg.season,
                        attribution: seg.attribution,
                        flightNumber: seg.flightNumber,
                        departure: seg.departure,
                        arrival: seg.arrival,
                        aircraftType: [seg.aircraftType],
                        days: seg.days,
                        timeOptions: [{ departureTime: seg.departureTime, arrivalTime: seg.arrivalTime }],
                        order: rowIndex
                    }
                } else {
                    const f = flightMap[key]
                    if (!f.aircraftType.includes(seg.aircraftType)) f.aircraftType.push(seg.aircraftType)
                    f.days = mergeDays(f.days, seg.days)
                    if (!f.timeOptions.some(t => t.departureTime === seg.departureTime && t.arrivalTime === seg.arrivalTime)) {
                        f.timeOptions.push({ departureTime: seg.departureTime, arrivalTime: seg.arrivalTime })
                    }
                }
            }
        }


        // 构建冲突航班列表 / 已处理航班列表
        conflictList.value = []
        addFlightDataForm.value = []

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
                // 无冲突 -> 直接放到 addFlightDataForm
                addFlightDataForm.value.push({
                    season: f.season,
                    attribution: f.attribution,
                    flightNumber: f.flightNumber,
                    departure: f.departure,
                    arrival: f.arrival,
                    departureTime: f.timeOptions[0].departureTime,
                    arrivalTime: f.timeOptions[0].arrivalTime,
                    aircraftType: f.aircraftType.join(','),
                    days: f.days,
                    flightType: getFlightType(f.departure, f.arrival),
                    _highlight: false,
                    order: f.order   // ✅
                })
            }
        })
        compareSectors()


        if (conflictList.value.length > 0) {
            showConflictDialog.value = true
        }

        addFlightDataForm.value.sort((a, b) => a.order - b.order)
        console.log('addFlightDataForm', addFlightDataForm)
        intlFlight.value = addFlightDataForm.value.filter(item => item.flightType == '国际')
        countryFlight.value = addFlightDataForm.value.filter(item => item.flightType == '国内')
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
    const processedSectors = addFlightDataForm.value.map(f => `${f.flightNumber}_${f.departure}_${f.arrival}`)
    const originalSectors = props.originData.map(f => `${f.flightNumber}_${f.departure}_${f.arrival}`)

    addedSectors.value = processedSectors.filter(sector => !originalSectors.includes(sector))
    addedSectorsData.value = addFlightDataForm.value.filter(item => {
        const sectorKey = `${item.flightNumber}_${item.departure}_${item.arrival}`;
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

    addFlightDataForm.value.forEach(f => {
        const existing = props.originData.find(o => `${o.flightNumber}_${o.departure}_${o.arrival}` === `${f.flightNumber}_${f.departure}_${f.arrival}`)

        if (existing) {
            const conflicts = {}
            if (f.departureTime !== existing.departureTime) conflicts.departureTime = { new: f.departureTime, old: existing.departureTime }
            if (f.arrivalTime !== existing.arrivalTime) conflicts.arrivalTime = { new: f.arrivalTime, old: existing.arrivalTime }
            if (f.aircraftType !== existing.aircraftType) conflicts.aircraftType = { new: f.aircraftType, old: existing.aircraftType }
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
    const processedFlight = addFlightDataForm.value.find(f => f.flightNumber === row.flightNumber && f.departure === row.departure && f.arrival === row.arrival)
    const originalFlight = props.originData.find(f => f.flightNumber === row.flightNumber && f.departure === row.departure && f.arrival === row.arrival)

    if (action === 'merge') {
        // 合并冲突数据
        if (processedFlight && originalFlight) {
            const mergedFlight = { ...processedFlight }

            // 合并时间字段，选择最新的时间
            if (processedFlight.departureTime !== originalFlight.departureTime) {
                mergedFlight.departureTime = processedFlight.departureTime // 选择 addFlightDataForm 的时间，或者合并为一个新的字段
            }

            if (processedFlight.arrivalTime !== originalFlight.arrivalTime) {
                mergedFlight.arrivalTime = processedFlight.arrivalTime // 同上
            }

            // 合并机型字段，选择所有机型
            const allAircraft = new Set([...(processedFlight.aircraftType.split(',')), ...(originalFlight.aircraftType.split(','))])
            mergedFlight.aircraftType = Array.from(allAircraft).join(',')

            // 合并班期
            mergedFlight.days = mergeDays(processedFlight.days, originalFlight.days)

            // 更新处理过的航段
            const idx = addFlightDataForm.value.findIndex(f => f.flightNumber === processedFlight.flightNumber && f.departure === processedFlight.departure && f.arrival === processedFlight.arrival)
            if (idx !== -1) {
                addFlightDataForm.value[idx] = mergedFlight
            } else {
                addFlightDataForm.value.push(mergedFlight)
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
            // 保留 addFlightDataForm 中的航段
            const newFlight = { ...processedFlight }
            addFlightDataForm.value.push(newFlight)

            // 保留 originData 中的航段
            const originalCopy = { ...originalFlight }
            props.originData.push(originalCopy)
        }
    } else if (action === 'keepOne') {
        // 保留 addFlightDataForm 中的航段，更新 originData 中的航段
        if (processedFlight && originalFlight) {
            // 更新原始数据的字段为 addFlightDataForm 中的内容
            originalFlight.departureTime = processedFlight.departureTime
            originalFlight.arrivalTime = processedFlight.arrivalTime
            originalFlight.aircraftType = processedFlight.aircraftType
            originalFlight.days = processedFlight.days
            originalFlight.flightNumber = processedFlight.flightNumber
            originalFlight.departure = processedFlight.departure
            originalFlight.arrival = processedFlight.arrival

            // 更新 addFlightDataForm
            const idx = addFlightDataForm.value.findIndex(f => f.flightNumber === processedFlight.flightNumber && f.departure === processedFlight.departure && f.arrival === processedFlight.arrival)
            if (idx !== -1) {
                addFlightDataForm.value[idx] = { ...processedFlight }
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
            flightNumber: item.flightNumber,
            departure: item.departure,
            arrival: item.arrival,
            departureTime: sel.departureTime.new,
            arrivalTime: sel.arrivalTime.new,
            aircraftType: item.aircraftType.join(','),
            days: item.days,
            flightType: getFlightType(item.departure, item.arrival),
            order: item.order
        }

        const idx = addFlightDataForm.value.findIndex(f => f.order === item.order)
        if (idx !== -1) {
            addFlightDataForm.value[idx] = newFlight
        } else {
            addFlightDataForm.value.push(newFlight)
        }
    })

    conflictList.value = []
    showConflictDialog2.value = false
}

const flightNoRegex = /^(MF|CXA)\d{3,4}$/
const airportRegex = /^[A-Z]{3,4}$/
// const timeRegex = /^([01]\d|2[0-3])([0-5][05])$/;
const aircraftRegex = /^(738|737|787|788|789|7M8|321)$/

// const timeRegex = /^\d{3,4}$/
// const daysRegex = /^[\.1-7]{7}$/ // 班期
const daysRegex = /^[1-7.]{1,7}$/;
function isTime(val) {
    if (!/^\d{4}$/.test(val)) return false; // 必须是4位数字
    const num = parseInt(val, 10);
    const hh = Math.floor(num / 100); // 前两位小时
    const mm = num % 100;             // 后两位分钟
    return (
        hh >= 0 && hh <= 23 &&
        mm >= 0 && mm <= 59 &&
        mm % 5 === 0                 // ✅ 分钟必须以0或5结尾
    );
}
async function parseFlightRow(row) {
    // console.log('row', row)

    let flightNumber = '', aircraftType = '', days = ''
    const airports = [], times = []

    for (const cell of row) {
        if (!cell) continue
        let val = String(cell)
            .replace(/\s/g, '')        // 去掉普通空格
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // 去掉零宽字符
            .replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xFF10)) // 全角数字转半角
        console.log('cell:', cell, '-> val:', val,
            'flight?', flightNoRegex.test(val),
            'aircraftType?', aircraftRegex.test(val),
            'days?', daysRegex.test(val),
            'time?', isTime(val),
            'airport?', airportRegex.test(val));
        if (flightNoRegex.test(val)) {
            flightNumber = val
        } else if (airportRegex.test(val)) {
            airports.push(transferToOutput(val, 'ICAOCode'))
        } else if (aircraftRegex.test(val)) {
            aircraftType = val
        }
        else if (isTime(val)) {
            times.push(val);  // ✅ 不要限制次数，全部收集
        } else if (daysRegex.test(val)) {
            days = val;
        }
        //  else if (isTime(val)) {
        //     // ⚠️ 如果 times 已经有两个，就不再当时间，转为 days 判断
        //     if (times.length < 2) {
        //         times.push(val);
        //     } else if (daysRegex.test(val)) {
        //         days = val;
        //     }
        // } else if (daysRegex.test(val)) {
        //     days = val
        // } 

    }
    // console.log('airports',airports)
    // console.log('times',times)

    const segments = []
    for (let i = 0; i < airports.length - 1; i++) {
        const departure = airports[i]
        const arrival = airports[i + 1]
        const departureTime = times[i * 2]
        const arrivalTime = times[i * 2 + 1]

        // let segDays = days

        // ⚠️ 跨天处理：如果到达时间小于起飞时间，就把班期往后移一天
        // if (arrivalTime && departureTime && parseInt(arrivalTime) < parseInt(departureTime)) {
        //     segDays = shiftDays(segDays)
        // }

        segments.push({
            season: curSeason.value,
            attribution: selectAttribution.value,
            flightNumber,
            aircraftType,
            days,
            // days: segDays,
            departure,
            departureTime,
            arrival,
            arrivalTime,
            flightType: getFlightType(departure, arrival)
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
            season: item.season,
            attribution: item.attribution,
            flightNumber: item.flightNumber,
            departure: item.departure,
            arrival: item.arrival,
            departureTime: sel.departureTime,
            arrivalTime: sel.arrivalTime,
            aircraftType: item.aircraftType.join(','),
            days: item.days,
            flightType: getFlightType(item.departure, item.arrival),
            _highlight: true,
            order: item.order,
            startDate: item.startDate,
            endDate: item.endDate
        }

        // 找到对应位置
        const idx = addFlightDataForm.value.findIndex(f => f.order === item.order)
        if (idx !== -1) {
            addFlightDataForm.value[idx] = newFlight  // 替换
        } else {
            addFlightDataForm.value.push(newFlight)  // 如果没找到就插入
        }
    })

    conflictList.value = []
    showConflictDialog.value = false

    // ✅ 再按照原始顺序排序一次
    addFlightDataForm.value.sort((a, b) => a.order - b.order)
}

// 表格行样式
function tableRowClassName({ row }) {
    return row._highlight ? 'highlight-flight' : ''
}

watch(
    () => addFlightDataForm.value,
    (val) => {
        addFlightForms.value = mapEditData(addFlightDataForm.value)
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