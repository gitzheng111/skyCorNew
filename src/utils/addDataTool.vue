<template>
    <el-dialog v-model="visible" :title="'新增内容'" width="90%">
        <el-radio-group v-model="radio" v-if="!editMode">
            <el-radio v-for="item in options" :key="item.value" :label="item.value">
                {{ item.label }}
            </el-radio>
        </el-radio-group>
        <div v-if="radio == 'excelInput' && editMode == false">
            <el-upload :auto-upload="false" :on-change="handleFile" accept=".xlsx, .xls">
                <el-button type="primary">上传Excel文件</el-button>
            </el-upload>
        </div>
        <el-progress :percentage="progress" :text-inside="true" stroke-width="20" />

        <div v-if="mode == 'airport'">

            <el-table :data="addAirportDataForm" border style="width: 100%; margin-bottom: 10px;">
                <el-table-column label="机场名">
                    <template #default="{ row }">
                        <el-input v-model="row.chineseName" placeholder="机场名" maxlength="6" />
                    </template>
                </el-table-column>
                <el-table-column label="英文全称">
                    <template #default="{ row }">
                        <el-input v-model="row.englishName" placeholder="英文全称" maxlength="6" />
                    </template>
                </el-table-column>
                <el-table-column label="IATACode">
                    <template #default="{ row }">
                        <el-input v-model="row.IATACode" placeholder="IATACode" maxlength="6"
                            @input="row.IATACode = row.IATACode.toUpperCase().replace(/[^A-Z]/g, '')"
                            @blur="validateIATA(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="ICAOCode">
                    <template #default="{ row }">
                        <el-input v-model="row.ICAOCode" placeholder="ICAOCode" maxlength="6"
                            @input="row.ICAOCode = row.ICAOCode.toUpperCase().replace(/[^A-Z]/g, '')"
                            @blur="validateICAO(row)" />
                    </template>
                </el-table-column>


                <el-table-column label="操作" fixed="right">
                    <template #default="{ $index }">
                        <el-button type="danger" :icon="Minus" @click="removeRow($index)">
                            删除
                        </el-button>
                    </template>

                </el-table-column>
            </el-table>
            <div style="margin: 10px 0">
                <el-button type="primary" :icon="Plus" @click="addRow">
                    添加一行数据
                </el-button>
            </div>

        </div>
        <div v-if="mode == 'flight'">
            <SeasonSelect v-model="curSeason" v-if="!editMode" />

            <el-select v-model="selectAttribution" style="width: 30%;" v-if="!editMode">
                <el-option v-for="item in attributeData" :key="item.attribute" :label="item.name"
                    :value="item.attribute" />
            </el-select>
            <div>
                {{ addFlightDataForm.length }}条航班
            </div>
            <el-table :data="addFlightDataForm" border style="width: 100%; margin-bottom: 10px;">
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
                        <!-- <el-time-picker v-model="row.departureTime" format="HH:mm" 
                            placeholder="起飞时间" /> -->
                        <!-- <SmartTimePicker  v-model="row.departureTime" /> -->
                        <el-time-select v-model="row.departureTime" style="width: 240px" start="00:05" step="00:05"
                            end="23:55" placeholder="Select time" />
                    </template>
                </el-table-column>

                <el-table-column label="落地机场" width="150">
                    <template #default="{ row }">
                        <AirportAutocomplete v-model="row.arrival" @select="handleDepartureSelect" />
                    </template>
                </el-table-column>

                <el-table-column label="落地时间" width="120">
                    <template #default="{ row }">
                        <!-- <el-time-picker v-model="row.arrivalTime" format="HH:mm" 
                            placeholder="落地时间" /> -->
                        <!-- <SmartTimePicker v-model="row.arrivalTime" /> -->
                        <el-time-select v-model="row.arrivalTime" style="width: 240px" start="00:05" step="00:05"
                            end="23:55" placeholder="Select time" />
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
                        <el-button type="danger" :icon="Minus" @click="removeFlightRow($index)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div style="margin: 10px 0">
                <el-button type="primary" :icon="Plus" @click="addFlightRow">
                    添加一行数据
                </el-button>
            </div>
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
        </div>
        <div style="text-align: right">
            <el-radio-group v-model="radio" :options="options" />

            <el-button type="primary" @click="syncDataToFather(mode)">创建</el-button>
        </div>
    </el-dialog>

</template>
<script setup>
import { ref, watch, nextTick } from 'vue'
import { validateFlightNumber, normalizeDays, formatDate, validateIATA, validateICAO } from '../utils/tool.js'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import { attributeData, aircraftData } from '../api'
import SeasonSelect from '../utils/seasonSelect.vue'
import { useSeasonData } from '../components/useSeasonUtils.js'
import daysPicker from '../utils/daysPicker.vue'
import { transferToOutput } from '../utils/airportCodeTool'
import { beijingToUTC, utcToBeijing, formatTimeWithoutColon, formatTimeWithColon, beijingToLocal, strToDate } from '../utils/timeTransfer';
import airports from 'airport-timezone';
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import SmartTimePicker from '../utils/smartTimePicker.vue'
const props = defineProps({ visible: Boolean, mode: String, isEditing: Boolean, originData: Array, editData: Array, })
const visible = ref(props.visible)
const mode = ref(props.mode)
const editMode = ref(props.isEditing)
const radio = ref('handInput')
const progress = ref(0)
const isProcessing = ref(false)
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
const curSeason = ref()
const { seasonData } = useSeasonData()
const selectedSeason = ref()
const selectAttribution = ref()
const showConflictDialog = ref(false)


const emit = defineEmits(['update:visible'])
watch(visible, val => emit('update:visible', val))
watch(() => props.visible, val => (visible.value = val))
watch(() => props.mode, val => (mode.value = val))
// watch([props.isEditing,props.editData], (val,editVal) => {
//     editMode.value = val
//     addFlightDataForm.value = editVal
//     console.log('编辑数据',addFlightDataForm.value)
// })


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


const emptyAirportForm = () => ({
    chineseName: '',
    englishName: '',
    ICAOcode: '',
    IATAcode: ''
})

const addAirportDataForm = ref([])
const addRow = () => {
    addAirportDataForm.value.push(emptyAirportForm())
}

const removeRow = (index) => {
    addAirportDataForm.value.splice(index, 1)
}

const emptyFlightForm = () => ({
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
const conflictList = ref([])
const showConflictDialog2 = ref(false)

//编辑航班数据下
const addFlightDataForm = ref([])


watch(
    () => [props.isEditing, props.editData],
    ([isEditing, editData]) => {
        editMode.value = isEditing
        if (isEditing && editData) {
            // 深拷贝一份，避免直接修改父组件数据
            //   addFlightDataForm.value = editData
            addFlightDataForm.value = Array.isArray(editData) ? editData : [editData]

        }
        console.log('编辑状态的数据', addFlightDataForm.value)
    },
    { immediate: true } // 初始化时也执行一次
)

const addFlightRow = () => {
    addFlightDataForm.value.push(emptyFlightForm())
}

const removeFlightRow = (index) => {
    addFlightDataForm.value.splice(index, 1)
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

async function handleFile(file) {
    console.log('file', file)
    const reader = new FileReader()
    if (mode.value == 'airport') {
        console.log('识别机场信息')

        reader.onload = async (e) => {
            console.log('e', e)

            const workbook = XLSX.read(e.target.result, { type: 'array' })
            console.log('workbook', workbook)

            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            const rows = jsonData.filter(r => r.some(c => c !== ''))
            const airportMap = {}
            console.log('rows', rows)
        }
        reader.readAsArrayBuffer(file.raw)

    }
    if (mode.value == 'flight') {
        reader.onload = async (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'array' })
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
            const rows = jsonData.filter(r => r.some(c => c !== ''))
            console.log('处理文件原始数据rows', rows)
            const totalRows = rows.length
            let processedRows = 0
            const flightMap = {}
            for (const [rowIndex, row] of rows.entries()) {
                const segments = await parseFlightRow(row)
                console.log('正则识别单元格segments', segments)
                if (!segments.length) {
                    processedRows++
                    const target = Math.round((processedRows / totalRows) * 100)
                    smoothProgress(target)
                    // progress.value = Math.round((processedRows / totalRows) * 100)
                    // await nextTick()
                    continue
                }

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
                            startDate: seg.startDate,
                            endDate: seg.endDate,
                            timeOptions: [{ departureTime: formatTimeWithColon(seg.departureTime), arrivalTime: formatTimeWithColon(seg.arrivalTime) }],
                            order: rowIndex
                        }
                    } else {
                        const f = flightMap[key]
                        if (!f.aircraftType.includes(seg.aircraftType)) f.aircraftList.push(seg.aircraftType)
                        f.days = mergeDays(f.days, seg.days)
                        if (!f.timeOptions.some(t => t.departureTime === seg.departureTime && t.arrivalTime === seg.arrivalTime)) {
                            f.timeOptions.push({ departureTime: formatTimeWithColon(seg.departureTime), arrivalTime: formatTimeWithColon(seg.arrivalTime) })
                        }
                    }
                }
                processedRows += 1 / segments.length
                const target = Math.round((processedRows / totalRows) * 100)
                smoothProgress(target)
                // progress.value = Math.min(100, Math.round((processedRows / totalRows) * 100))
                await nextTick()
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
                    // 无冲突 -> 直接放到 processedData
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
                        startDate: f.startDate,
                        endDate: f.endDate,
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
            // isProcessing.value = false
            // progress.value = 100

            intlFlight.value = addFlightDataForm.value.filter(item => item.flightType == '国际')
            countryFlight.value = addFlightDataForm.value.filter(item => item.flightType == '国内')
            console.log('intlFlight', intlFlight)
            console.log('countryFlight', countryFlight)
        }
        reader.readAsArrayBuffer(file.raw)
    }



}
function smoothProgress(to) {
    const step = 1  // 每帧最大增加 1%
    const fps = 16   // 大约 60fps
    if (progress.value >= to) return

    const interval = setInterval(() => {
        progress.value = Math.min(to, progress.value + step)
        if (progress.value >= to) clearInterval(interval)
    }, fps)
}
const flightNumberRegex = /^(MF|CXA)\d{3,4}$/
const airportRegex = /^[A-Z]{3,4}$/
const timeRegex = /^\d{3,4}$/
const daysRegex = /^[\.1-7]{7}$/ // 班期
const intlFlight = ref([])
const countryFlight = ref([])

async function parseFlightRow(row) {
    console.log('curseason', curSeason)

    let flightNumber = '', aircraftType = '', days = ''
    const airports = [], times = []

    for (const cell of row) {
        if (!cell) continue
        const val = String(cell).trim()
        if (flightNumberRegex.test(val)) flightNumber = val
        else if (/^(738|737|321|320|788|789|330|350)$/.test(val)) aircraftType = val
        else if (daysRegex.test(val)) days = val
        else if (airportRegex.test(val)) airports.push(transferToOutput(val, 'ICAOCode'))
        else if (timeRegex.test(val)) times.push(val)
    }
    // console.log('airports',airports)
    // console.log('times',times)

    const segments = []
    for (let i = 0; i < airports.length - 1; i++) {
        const departure = airports[i]
        const arrival = airports[i + 1]
        const departureTime = times[i * 2]
        const arrivalTime = times[i * 2 + 1]

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
            flightType: getFlightType(departure, arrival),
            startDate: selectedSeason.value.seasonStart,
            endDate: selectedSeason.value.seasonEnd
        })
    }
    return segments
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

const getFlightType = (depIata, arrIata) => {
    // if (depIata == 'PKX') {
    //     console.log('da xing', airports.find(a => a.attributes.iata === depIata))
    // }
    const depInfo = airports.find(a => a.code === depIata)
    const arrInfo = airports.find(a => a.code === arrIata)

    if (!depInfo || !arrInfo) return '未知'

    return (depInfo.countryCode === 'CN' && arrInfo.countryCode === 'CN') ? '国内' : '国际'
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


const syncDataToFather = (source) => {

    let submitData = []
    if (mode.value == 'flight') {
        console.log('同步到父组件的数据', addFlightDataForm.value)

        submitData = addFlightDataForm.value

    }
    if (mode.value == 'airport') {
        console.log('addAirportDataForm.value', addAirportDataForm.value)

        if (!addAirportDataForm.value.length) {
            ElMessage.error('航班数据不可为空');
            return;
        }
        submitData = addAirportDataForm.value

    }

    // console.log('needToMapData', needToMapData)
    console.log('submitData', submitData)
    // return
    emit("parsed", submitData)
    // 关闭弹窗
    emit('update:visible', false)

}


</script>
