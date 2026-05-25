<template>
    <el-tabs v-model="activeName" type="border-card" class="demo-tabs">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name"></el-tab-pane>
    </el-tabs>
    <div v-if="activeName=='countryRules'">
        <Searcher mode="country" :list="countryList" @update:result="filteredData = $event" />
        <div class="add-button-box">
            <el-button type="primary" @click="addCountry" class="add-button">新增国家</el-button>
            <el-button type="danger" :disabled="selectedCountry.length === 0" @click="handleBatchDelete">
                删除
            </el-button>
        </div>
        <el-table :data="filteredData" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="国家" prop="country" width="80"></el-table-column>
            <el-table-column label="是否需要申请" width="80">
                <template #default="{ row }">
                    <el-tag :type="row.needApply == '1' ? 'danger' : 'primary'">
                        {{ row.needApply == '1' ? '是' : '否' }}
                    </el-tag>
                </template>

            </el-table-column>
            <el-table-column label="变更申请">
                <template #default="{ row }">
                    <el-tag :type="row.changeApply?.changeRoute ? 'danger' : 'success'">改航{{
                        row.changeApply?.changeRoute ? '用' : '不用' }}申请</el-tag>
                    <el-tag :type="row.changeApply?.changeFlightNumber ? 'danger' : 'success'">改航班号{{
                        row.changeApply?.changeFlightNumber ? '用' : '不用' }}申请</el-tag>

                </template>
            </el-table-column>

            <el-table-column label="联系方式" width="220">
                <template #default="{ row }">
                    <div style="display: flex; flex-direction: column; gap: 4px;" v-for="item in row.contactInfo"
                        :key="item">
                        <!-- 邮箱 -->
                        <div>
                            <span style="margin-right: 6px;">邮箱：</span>
                            <el-tag class="contactInfoTag" :key="'email-' + idx" type="success" disable-transitions
                                @click="copyToClipboard(item.email)">
                                {{ item.email }}
                            </el-tag>
                        </div>

                        <!-- 电话 -->
                        <div>
                            <span style="margin-right: 6px;">电话：</span>
                            <el-tag class="contactInfoTag" :key="'phone-' + idx" type="info" disable-transitions
                                @click="copyToClipboard(item.phone)">
                                {{ item.phone ? item.phone : '未录入' }}
                            </el-tag>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <!-- <el-table-column label="申请需求" prop="applyRequire"></el-table-column> -->
            <!-- <el-table-column label="批复规则" prop="permitRules"></el-table-column> -->
            <el-table-column label="定期航班申请件" prop="scheduleTemplate" show-overflow-tooltip>

                <template #default="{ row }">
                    <div v-if="row.scheduleTemplate?.name">
                        <el-link type="primary" @click="previewFile(row.scheduleTemplate)">
                            {{ fixEncoding(row.scheduleTemplate.name) || '查看模板' }}
                        </el-link>
                    </div>
                    <div v-else>无</div>
                </template>
            </el-table-column>
            <el-table-column label="非定期航班申请件" prop="nonScheduleTemplate" show-overflow-tooltip>

                <template #default="{ row }">
                    <div v-if="row.nonScheduleTemplate?.name">
                        <el-link type="primary" @click="previewFile(row.nonScheduleTemplate)">
                            {{ fixEncoding(row.nonScheduleTemplate.name) || '查看模板' }}
                        </el-link>
                    </div>
                    <div v-else>无</div>
                </template>
            </el-table-column>
            <el-table-column label="定期航班更改航路申请件" prop="scheduleChangeRouteTemplate" show-overflow-tooltip>
                <template #default="{ row }">
                    <div v-if="row.scheduleChangeRouteTemplate?.name">
                        <el-link type="primary" @click="previewFile(row.scheduleChangeRouteTemplate)">
                            {{ fixEncoding(row.scheduleChangeRouteTemplate.name) || '查看模板' }}
                        </el-link>
                    </div>
                    <div v-else>无</div>
                </template>
            </el-table-column>
            <el-table-column label="定期航班更改航班号申请件" prop="scheduleChangeFlightNumberTemplate" show-overflow-tooltip>
                <template #default="{ row }">
                    <div v-if="row.scheduleChangeFlightNumberTemplate?.name">
                        <el-link type="primary" @click="previewFile(row.scheduleChangeFlightNumberTemplate)">
                            {{ fixEncoding(row.scheduleChangeFlightNumberTemplate.name) || '查看模板' }}
                        </el-link>
                    </div>
                    <div v-else>无</div>
                </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" min-width="120" width="80">
                <template #default="{ row }">
                    <el-button link type="primary" @click="editCountry(row.id)">
                        编辑
                    </el-button>
                </template>
            </el-table-column>

        </el-table>
        <el-dialog v-model="showCountryList" width="1200">
            <el-form :model="editCountryData" label-width="140px">
                <el-form-item label="国家">
                    <el-input v-model="editCountryData.country" />
                </el-form-item>
                <el-form-item label="联系方式">
                    <template v-if="editCountryData.contactInfo && Array.isArray(editCountryData.contactInfo)">
                        <div v-for="(item, index) in (editCountryData.contactInfo || [])" :key="index"
                            class="contact-item" style="margin-bottom: 8px;">
                            <el-input v-model="item.email" placeholder="邮箱" style="width: 45%; margin-right: 10px;" />
                            <el-input v-model="item.phone" placeholder="电话" style="width: 45%;" />
                            <el-button type="danger" @click="removeContact(index)">删除</el-button>
                        </div>
                    </template>
                    <el-button type="primary" @click="addContact">添加联系方式</el-button>

                    <!-- <el-button type="primary" @click="addContact">添加联系方式</el-button> -->
                </el-form-item>
                <el-form-item label="是否需要申请">
                    <el-radio-group v-model="needApply">
                        <el-radio :value="true" size="large">需要</el-radio>
                        <el-radio :value="false" size="large">不需要</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="改航是否需要申请">
                    <el-radio-group v-model="editCountryData.changeApply.changeRoute">
                        <el-radio :value="true" size="large">需要</el-radio>
                        <el-radio :value="false" size="large">不需要</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="改航班号是否需要申请">
                    <el-radio-group v-model="editCountryData.changeApply.changeFlightNumber">
                        <el-radio :value="true" size="large">需要</el-radio>
                        <el-radio :value="false" size="large">不需要</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="申请需求">
                    <div class="apply-templates-container">
                        <el-card v-for="(item, index) in applyTemplates" :key="index" shadow="hover" class="apply-card">
                            <h3 class="apply-type">{{ item.type }}</h3>

                            <div v-for="field in item.fields" :key="field.section" class="field-group">
                                <h4 class="field-section">{{ field.section }}</h4>
                                <el-checkbox v-model="checkAllMap[item.type][field.section]"
                                    :indeterminate="isIndeterminateMap[item.type][field.section]"
                                    @change="(val) => handleCheckAllChange(item.type, field.section, field.items, val)"
                                    :disabled="!needApply">
                                    全选
                                </el-checkbox>

                                <el-checkbox-group v-model="selectedApplyRequire[item.type][field.section]"
                                    class="checkbox-group"
                                    @change="() => handleCheckedChange(item.type, field.section, field.items)"
                                    :disabled="!needApply">
                                    <el-checkbox v-for="option in field.items" :key="option" :label="option">
                                        {{ option }}
                                    </el-checkbox>
                                </el-checkbox-group>
                                <!-- <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate"
                                @change="handleCheckAllChange" :disabled="!needApply">
                                全选
                            </el-checkbox>
                            <el-checkbox-group v-model="selectedApplyRequire[item.type][field.section]"
                                class="checkbox-group" @change="() => handleCheckedChange()" :disabled="!needApply">
                                <el-checkbox v-for="option in field.items" :key="option" :label="option">
                                    {{ option }}
                                </el-checkbox>
                            </el-checkbox-group> -->
                            </div>
                        </el-card>
                    </div>
                </el-form-item>

                <el-form-item label="定期航班申请件">
                    <template v-if="editCountryData.scheduleTemplate?.name">
                        <el-link type="primary" @click="previewFile(editCountryData.scheduleTemplate)"
                            :disabled="!needApply">
                            {{ fixEncoding(editCountryData.scheduleTemplate.name) }}
                        </el-link>
                        <el-button type="danger" text size="small" @click="removeTemplateFile('scheduleTemplate')"
                            :disabled="!needApply">
                            删除
                        </el-button>
                    </template>
                    <el-upload v-else :action="uploadURL" :auto-upload="false" :show-file-list="true"
                        :disabled="!needApply" :on-change="(file) => handleFileChange(file, 'scheduleTemplate')"
                        accept=".pdf,.doc,.docx,.xlsx">
                        <el-button>上传定期航班申请件</el-button>
                    </el-upload>
                </el-form-item>
                <el-form-item label="非定期航班申请件">
                    <template v-if="editCountryData.nonScheduleTemplate?.name">
                        <el-link type="primary" @click="previewFile(editCountryData.nonScheduleTemplate)"
                            :disabled="!needApply">
                            {{ fixEncoding(editCountryData.nonScheduleTemplate.name) }}
                        </el-link>
                        <el-button :disabled="!needApply" type="danger" text size="small"
                            @click="removeTemplateFile('nonScheduleTemplate')">
                            删除
                        </el-button>
                    </template>
                    <el-upload v-else :action="uploadURL" :auto-upload="false" :show-file-list="true"
                        :on-change="(file) => handleFileChange(file, 'nonScheduleTemplate')" accept=".pdf,.doc,.docx">
                        <el-button :disabled="!needApply">上传非定期航班申请件</el-button>
                    </el-upload>
                </el-form-item>
                <!-- <el-form-item label="非定期航班申请件">
                <template v-if="editCountryData.nonScheduleTemplate?.name">
                    <el-link type="primary" @click="viewFile(editCountryData.scheduleTemplate)">
                        {{ editCountryData.scheduleTemplate.name }}
                    </el-link>
                </template>
                <el-upload :action="uploadURL" :data="{ type: 'nonScheduleTemplate', country: editCountryData.country }"
                    name="file" :on-success="(res) => handleUploadSuccess(res, 'nonScheduleTemplate')"
                    :show-file-list="false" accept=".pdf,.doc,.docx">
                    <el-button>上传非定期航班申请件</el-button>
                </el-upload>
            </el-form-item> -->

                <!-- 其他字段可照此类推 -->

            </el-form>

            <template #footer>
                <el-button @click="showCountryList = false">取消</el-button>
                <el-button type="primary" @click="saveCountry">保存</el-button>
            </template>
        </el-dialog>
        <filePreview :file="currentFile" v-model:visible="previewVisible" @extract-fields="onFieldsExtracted" />
    </div>
    <div v-if="activeName=='riskBoard'">
        <countryRisk></countryRisk>
    </div>
    <div v-if="activeName=='mapRisk'">
        <mapRisk></mapRisk>
    </div>


</template>
<script setup>
import { baseFileURL, getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getTaskList, deleteCountryByIds, addCountryList, updateCountryList } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import { getLastSunday, calculateSeasons } from '../utils/seasonCalculator'
import { ElMessage, ElMessageBox } from 'element-plus'
// import SeasonSelect from '../utils/SeasonSelect.vue'
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import { useAirportSearch } from '../components/useAirportUtils'
import previewDoc from '../components/previewDoc.vue'
import { fixEncoding } from '../utils/fileNameEncode.js'
import filePreview from '../utils/filePreview.vue'
import Searcher from '../utils/searcher.vue'
import { useLoading } from '../plugins/loading'
import { template } from 'lodash-es';
import countryRisk from '../views/countryRisk.vue'
import mapRisk from '../views/mapRiskTool.vue'

const loading = useLoading()
const activeName = ref('countryRules')
// import VueOfficeDocx from '@vue-office/docx';
// import VueOfficeExcel from '@vue-office/excel';
const countryList = ref()
const editCountryData = ref()
const showCountryList = ref(false)
const selectedCountry = ref([])
const uploadURL = baseURL + '/country/add'
const tempFileStore = reactive({})
const previewContent = ref()
const uploadFileList = ref([])
const checkAll = ref(false)
const filteredData = ref([])
const needApply = ref(true)
const isIndeterminate = ref(true)
const checkAllMap = reactive({})
const isIndeterminateMap = reactive({})
const selectedApplyRequire = reactive({})
const tabs = ref([
    { label: '国家规则', name: 'countryRules' },
    { label: '风险看板', name: 'riskBoard' },
    { label: '地图看板', name: 'mapRisk' }
])

const applyTemplates = [
    {
        type: '定期',
        fields: [
            { section: 'flightInfo', items: ['flightNumber', 'departure', 'departureTime', 'arrival', 'arrivalTime', 'aircraft', 'days'] },
            { section: 'route', items: ['sector', 'routeCode', 'entryPoint', 'entryTime', 'ATSroute', 'exitPoint', 'exitTime', 'speed', 'altEntryPoint', 'altExitPoint', 'EET', 'flightLevel'] }
        ]
    }, {
        type: '非定期',
        fields: [
            { section: 'flightInfo', items: ['flightNumber', 'departure', 'departureTime', 'arrival', 'arrivalTime', 'aircraft', 'days'] },
            { section: 'route', items: ['sector', 'routeCode', 'entryPoint', 'entryTime', 'ATSroute', 'exitPoint', 'exitTime', 'speed', 'altEntryPoint', 'altExitPoint', 'EET', 'flightLevel'] }
        ]
    },
    {
        type: '定期更改计划',
        fields: [
            { section: 'flightInfo', items: ['flightNumber', 'departure', 'departureTime', 'arrival', 'arrivalTime', 'aircraft', 'days'] },
            { section: 'newFlightInfo', items: ['flightNumber', 'departure', 'departureTime', 'arrival', 'arrivalTime', 'aircraft', 'days'] },

            { section: 'route', items: ['sector', 'routeCode', 'entryPoint', 'entryTime', 'ATSroute', 'exitPoint', 'exitTime', 'speed', 'altEntryPoint', 'altExitPoint', 'EET', 'flightLevel'] },
            { section: 'newRoute', items: ['sector', 'routeCode', 'entryPoint', 'entryTime', 'ATSroute', 'exitPoint', 'exitTime', 'speed', 'altEntryPoint', 'altExitPoint', 'EET', 'flightLevel'] }
        ]
    }
]
function handleCheckAllChange(type, section, items, val) {
    selectedApplyRequire[type][section] = val ? [...items] : []
    isIndeterminateMap[type][section] = false
}
// const handleCheckAllChange = (val) => {
//     selectedApplyRequire[type][section] = val ? [...items] : []
//     isIndeterminateMap[type][section] = false
//     // applyTemplates.forEach(t => {
//     //     t.fields.forEach(f => {
//     //         selectedApplyRequire[t.type][f.section] = val ? [...f.items] : []
//     //     })
//     // })
//     // checkAll.value = val
//     // isIndeterminate.value = false
// }
function handleCheckedChange(type, section, items) {
    const checkedCount = selectedApplyRequire[type][section].length
    checkAllMap[type][section] = checkedCount === items.length
    isIndeterminateMap[type][section] =
        checkedCount > 0 && checkedCount < items.length
}
function initSelectedApplyRequire() {
    // applyTemplates.forEach(t => {
    //     selectedApplyRequire[t.type] = {}
    //     t.fields.forEach(f => {
    //         selectedApplyRequire[t.type][f.section] = []
    //     })
    // })
    applyTemplates.forEach(t => {
        selectedApplyRequire[t.type] = {}
        checkAllMap[t.type] = {}
        isIndeterminateMap[t.type] = {}

        t.fields.forEach(f => {
            selectedApplyRequire[t.type][f.section] = []
            checkAllMap[t.type][f.section] = false
            isIndeterminateMap[t.type][f.section] = false
        })
    })
}
initSelectedApplyRequire()
// const handleCheckedChange = () => {
//     const totalItems = applyTemplates.reduce((sum, t) => {
//         return sum + t.fields.reduce((s, f) => s + f.items.length, 0)
//     }, 0)

//     const checkedCount = applyTemplates.reduce((sum, t) => {
//         return sum + t.fields.reduce((s, f) => s + selectedApplyRequire[t.type][f.section].length, 0)
//     }, 0)

//     checkAll.value = checkedCount === totalItems
//     isIndeterminate.value = checkedCount > 0 && checkedCount < totalItems
//     console.log('selectedApplyRequire', selectedApplyRequire)
// }
const handleFileChange = (uploadFile, key) => {
    const file = uploadFile.raw
    console.log('文件选择:', key, file)

    tempFileStore[key] = file
    editCountryData.value[key] = {
        name: file.name
    }
}
const getEmails = (contactList) => {
    if (!Array.isArray(contactList)) {
        try {
            // 尝试解析 JSON
            contactList = JSON.parse(contactList);
            if (!Array.isArray(contactList)) contactList = [];
        } catch {
            contactList = [];
        }
    }

    return contactList.filter((item) => /@/.test(item));
};

const getPhones = (contactList) => {
    if (!Array.isArray(contactList)) {
        try {
            // 尝试解析 JSON
            contactList = JSON.parse(contactList);
            if (!Array.isArray(contactList)) contactList = [];
        } catch {
            contactList = [];
        }
    }

    return contactList.filter((item) => !/@/.test(item));
};
const copyToClipboard = (text) => {
    if (!text) {
        ElMessage.warning('无数据')
        return
    }
    navigator.clipboard.writeText(text).then(() => {
        ElMessage.success('已复制：' + text)
    }).catch(() => {
        ElMessage.error('复制失败')
    })
}
// const selectedApplyRequire = reactive({})


const saveCountry = async () => {
    const country = editCountryData.value.country?.trim()
    if (!country) {
        ElMessage.error('请填写国家名称')
        return
    }
    console.log('editCountryData', editCountryData)
    const formData = new FormData()
    formData.append('country', country)
    // formData.append('applyRequire', JSON.stringify(editCountryData.value.applyRequire || []))
    formData.append('contactInfo', JSON.stringify(editCountryData.value?.contactInfo || []))
    // formData.append('permitRules', JSON.stringify(editCountryData.value?.permitRules || []))
    // formData.append('applyRequire', JSON.stringify(selectedApplyRequire || ''))
    formData.append('needApply', needApply.value)


    const templateFields = [
        'scheduleTemplate',
        'nonScheduleTemplate',
        'scheduleChangeRouteTemplate',
        'scheduleChangeFlightNumberTemplate'
    ]

    templateFields.forEach(field => {
        const tempFile = tempFileStore[field]     // 新上传的文件
        const oldFile = editCountryData.value[field]  // 原始文件对象 {name, url}

        if (!needApply.value) {
            // 如果 needApply=false，清空字段
            formData.append(`${field}Meta`, 'null');
        } else if (tempFile) {
            // 新上传文件
            formData.append(field, tempFile);
        } else if (oldFile && oldFile.url) {
            // 没上传新文件，但保留了旧文件，则记录原路径（你可以用这个逻辑传给后端保留）
            formData.append(`${field}Meta`, JSON.stringify(oldFile))
        } else {
            // 删除了文件，什么都不传或传 null
            formData.append(`${field}Meta`, 'null')
        }
    })
    try {

        if (!needApply.value) {
            // 清空或设置为null
            formData.set('applyRequire', JSON.stringify([]))
            formData.set('changeApply', JSON.stringify([]))// 保持为空数组

            formData.append('nonScheduleTemplate', 'null')  // 保持为空
            formData.append('permitRules', '[]')  // 保持为空数组
            formData.append('scheduleChangeFlightNumberTemplate', 'null')  // 保持为空
            formData.append('scheduleChangeRouteTemplate', 'null')  // 保持为空
            formData.append('scheduleTemplate', 'null')  // 保持为空
        } else {
            // 否则正常传输字段
            console.log('selectedApplyRequire', selectedApplyRequire)
            formData.append('applyRequire', JSON.stringify(selectedApplyRequire))
            formData.append('nonScheduleTemplate', editCountryData.value.nonScheduleTemplate)
            formData.append('permitRules', editCountryData.value.permitRules)
            formData.append('scheduleChangeFlightNumberTemplate', editCountryData.value.scheduleChangeFlightNumberTemplate)
            formData.append('scheduleChangeRouteTemplate', editCountryData.value.scheduleChangeRouteTemplate)
            formData.append('scheduleTemplate', (editCountryData.value.scheduleTemplate))
            formData.append('changeApply', JSON.stringify(editCountryData.value?.changeApply || {
                changeRoute: false,
                changeFlightNumber: true
            }))
        }
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        if (isEditMode.value) {
            formData.append('id', editCountryData.value.id)
            console.log('这是编辑，执行更新逻辑', formData)
            await updateCountryList(formData)
            // 调用更新接口，例如：await updateCountryList(formData)
        } else {
            console.log('这是新增，执行新增逻辑')
            await addCountryList(formData)
        }
        ElMessage.success('保存成功')
        showCountryList.value = false
        refreshCountry()


        console.log('新的countryList', countryList.value)
    } catch (err) {
        console.error('保存失败', err)
        ElMessage.error('保存失败')
    }
}
const isEditMode = ref(false)
const refreshCountry = async () => {
    const res = await getCountryRules()

    countryList.value = res.data
    const newResponse = countryList.value.map(item => {
        try {
            item.contactInfo = item.contactInfo
                ? JSON.parse(item.contactInfo)
                : []; // 或者 null，看你想要什么默认值
            item.changeApply = JSON.parse(item.changeApply)
        } catch (e) {
            console.warn('contactInfo 解析失败：', item.contactInfo);
            item.contactInfo = [];
        }
        return item;
    });
    filteredData.value = newResponse
}
const editCountry = (id) => {
    isEditMode.value = true
    showCountryList.value = true
    editCountryData.value = countryList.value.find(item => item.id == id)
    if (!editCountryData.value.changeApply) {
        editCountryData.value.changeApply = {
            changeRoute: false,
            changeFlightNumber: false
        };
    }

    console.log('editCountryData', editCountryData)
}
const addCountry = () => {
    isEditMode.value = false
    showCountryList.value = true
    editCountryData.value = {
        country: '',
        applyRequire: [],
        contactInfo: [],
        nonScheduleTemplate: {},
        permitRules: [],
        scheduleChangeFlightNumberTemplate: {},
        scheduleChangeRouteTemplate: {},
        scheduleTemplate: {},
        needApply: needApply.value,
        changeApply: []
    }
    showCountryList.value = true

}

const addContact = () => {
    if (!Array.isArray(editCountryData.value.contactInfo)) {
        editCountryData.value.contactInfo = []
    }
    editCountryData.value.contactInfo.push({ email: '', phone: '' })
}

const removeContact = (index) => {
    editCountryData.value.contactInfo.splice(index, 1)

}

const validateContact = (index) => {
    const value = editCountryData.value.contactInfo[index]
    const isPhone = /^(\+?\d{1,4}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{5,8}$/.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    if (!isPhone && !isEmail) {
        ElMessage.warning(`第 ${index + 1} 条联系方式格式无效，请输入邮箱或电话`)
    }
}
const handleSelectionChange = (selection) => {
    selectedCountry.value = selection
    console.log('selectedCountry', selectedCountry)
}
const removeTemplateFile = (key) => {
    ElMessageBox.confirm(
        '确定要删除当前上传文件吗？删除后将无法恢复。',
        '删除确认',
        {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(() => {
            editCountryData.value[key] = null
            tempFileStore[key] = null
            console.log('editCountryData', editCountryData)

        })
        .catch(() => { })

}
const handleBatchDelete = async () => {
    if (selectedCountry.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定删除选中的 ${selectedCountry.value.length} 条任务数据？`,
            '警告',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 假设每条航路有唯一的 id 字段
        const idsToDelete = selectedCountry.value.map(item => item.id)
        console.log('idsToDelete', idsToDelete)
        // 调用后端接口进行删除
        await deleteCountryByIds(idsToDelete)
        selectedCountry.value = []
        const countryResponse = await getCountryRules();
        if (countryResponse?.data) {
            countryList.value = countryResponse.data;
            ElMessage.success('删除成功')
        }

    } catch (err) {
        // 用户点击取消
        console.log('批量删除取消')
    }
}
const previewVisible = ref(false)
const currentFile = ref(null)
const templateFields = ref([])
function isFullUrl(url) {
    return /^http?:\/\//.test(url)
}
const previewFile = (file) => {
    let fullUrl = file.url
    if (!isFullUrl(file.url)) {
        fullUrl = baseFileURL + file.url
    }
    currentFile.value = {
        ...toRaw(file),
        url: fullUrl,
        source: 'net'
    }
    console.log('currentFile', currentFile)
    previewVisible.value = true
}
const onFieldsExtracted = (fields) => {
    console.log('提取出的模板字段:', fields)
    templateFields.value = fields
}
const handleUploadSuccess = (res, key) => {
    editCountryData.value[key] = {
        name: res.name,
        url: res.url
    }
}

watch(() => editCountryData.value?.applyRequire, (newVal) => {
    if (!newVal) {
        initSelectedApplyRequire()
        return
    }
    try {
        const parsed = typeof newVal === 'string' ? JSON.parse(newVal) : newVal
        // 清空先
        initSelectedApplyRequire()
        // 合并赋值
        Object.keys(parsed).forEach(type => {
            if (selectedApplyRequire[type]) {
                Object.keys(parsed[type]).forEach(section => {
                    if (selectedApplyRequire[type][section]) {
                        selectedApplyRequire[type][section] = parsed[type][section]
                    }
                })
            }
        })
    } catch (e) {
        console.error('申请需求解析失败', e)
        initSelectedApplyRequire()
    }
}, { immediate: true })
onMounted(async () => {
    try {
        loading.show('正在加载飞越国家数据，请稍候...')
        const countryResponse = await getCountryRules();

        countryList.value = countryResponse.data
        const newResponse = countryList.value.map(item => {
            if (!item.changeApply) {
                console.log('赋值变更值')
                item.changeApply = {
                    changeRoute: false,
                    changeFlightNumber: false,
                };
            }
            try {
                item.contactInfo = item.contactInfo
                    ? JSON.parse(item.contactInfo)
                    : []; // 或者 null，或什么默认值
                item.changeApply = JSON.parse(item.changeApply)
                item.applyRequire = JSON.parse(item.applyRequire)

            } catch (e) {
                console.warn('contactInfo 解析失败：', item.contactInfo);
                item.contactInfo = [];
            }
            return item;

        });

        filteredData.value = newResponse
        console.log('countryResponse:', countryList.value);
        console.log('newResponse:', newResponse);

        loading.hide()
    } catch (error) {
        console.error('API error:', error);
    }
});


</script>
<style scoped>
.demo-tabs>.el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
}

.contactInfoTag {
    border-radius: 8px;
    padding: 6px 16px;
    font-size: 14px;
    margin: 6px 6px 0 0;
    box-shadow: 1px 1px 3px rgba(100, 100, 100, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
    /* 鼠标悬停变手型 */
    user-select: none;
    /* 禁止选中文本 */
}

.contactInfoTag:hover {
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
    /* 蓝色投影 */
    background-color: #ecf5ff !important;
    /* 悬停时背景色 */
    color: #409EFF !important;
    /* 悬停时字体色 */
}

.apply-templates-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.apply-card {
    width: 100%;
    max-width: 400px;
    padding: 20px;
    border-radius: 8px;
    box-sizing: border-box;
    background-color: #fafafa;
    transition: box-shadow 0.3s ease;
}

.apply-card:hover {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.apply-type {
    margin-bottom: 15px;
    color: #409eff;
    font-weight: 600;
    font-size: 20px;
    border-bottom: 2px solid #409eff;
    padding-bottom: 6px;
}

.field-group {
    margin-bottom: 15px;
}

.field-section {
    font-weight: 500;
    margin-bottom: 8px;
    color: #606266;
    font-size: 16px;
}

.checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
</style>