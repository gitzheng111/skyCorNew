<template>
    <div class="season-manager">
        <!-- 航季选择区 -->
        <div class="season-header">
            <el-tag type="success" size="large">当前航季：{{ currentSeason }}</el-tag>
            <el-select v-model="selectedSeasonKey" placeholder="切换航季" style="width: 300px; margin-left: 20px;"
                @change="handleSeasonChange">
                <el-option v-for="season in seasons" :key="season.key" :label="season.label" :value="season.key" />
            </el-select>
        </div>

        <!-- 工作入口 -->
        <div class="workflow-entries" v-if="!showApplyPanel">
            <el-row :gutter="20">
                <el-col :span="12" v-for="type in ['seasonChange', 'midSeason']" :key="type">
                    <el-card shadow="hover" class="entry-card" @click="handleWorkflowEntry(type)">
                        <div class="entry-content">
                            <el-icon :size="40" :color="typeColors[type]">
                                <component :is="typeIcons[type]" />
                            </el-icon>
                            <h3>{{ typeLabels[type] }}</h3>
                            <p>{{ type === 'seasonChange' ? '点击创建新的换季申请工作' : '点击创建新的季中调整申请' }}</p>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 任务Tabs -->
        <el-tabs v-model="activeTab" type="card" closable @tab-remove="closeTab">
            <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key">
                <div v-if="showApplyPanel === false" class="task-container">
                    <!-- 新建任务卡片 -->
                    <el-row :gutter="20">
                        <el-col span="6" shadow="hover" class="task-card" @click="handleCreateTask(tab)">
                            <el-card style="width: 100%;height: 80%;">
                                <div class="task-content">
                                    <el-icon :size="40" color="#909399">
                                        <Plus />
                                    </el-icon>
                                    <h3>新建</h3>
                                    <p>创建{{ currentSeason }}{{ tab.label }}工作区</p>

                                </div>
                            </el-card>
                        </el-col>
                        <el-col span="6" v-for="task in currentTasks" :key="task.id" shadow="hover" class="task-card ">
                            <div class="card-actions">
                                <!-- <div style="color: white;">{{ task.title }}</div> -->
                                <div>
                                    <el-button type="primary" @click.stop="handleEditTask(task)">编辑</el-button>
                                    <el-button type="danger" @click.stop="handleDeleteTask(task)">删除</el-button>
                                </div>

                            </div>
                            <el-card style="width: 100%;height: 80%;">
                                <div class="task-content">
                                    <div><el-icon :size="40" :color="typeColors[tab.type]">
                                            <component :is="typeIcons[tab.type]" />
                                        </el-icon>
                                    </div>
                                    <h3>{{ task.title }}</h3>
                                    <div class="task-meta">
                                        <div><span>创建时间：{{ formatDate(task.createTime) }}</span></div>
                                        <el-tag :type="statusTypes[task.status]">
                                            {{ task.statusLabel }}
                                        </el-tag>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>


                    <!-- 现有任务卡片 -->
                    <!-- <makeApply/> -->
                </div>
                <div v-else>
                    <div style="float: left;position: absolute;" @click="getBack()">
                        <el-button type="warning" round>返回</el-button>
                    </div>
                    <div style="height: 40px;">
                        <el-text class="mx-1" tag="b" size="large">{{ currentSeason }}{{ currentTaskData?.title
                        }}</el-text>

                    </div>
                    <div class="flex flex-col items-start gap-4 " style="margin-bottom: 40px;">
                        <el-segmented v-model="curWorkArea" :options="workAreaOption" size="default" />
                    </div>


                    <div v-if="curWorkArea == '工作进度'" class="workArea">
                        <el-card v-if="currentClickTaskData?.data" class="progress-dashboard" shadow="never">
                            <template #header>
                                <div class="dashboard-header">
                                    <span class="title">总工作进度</span>
                                    <el-progress :indeterminate="true" :percentage="totalProgress"
                                        :color="progressColor" class="total-progress" :stroke-width="18" />
                                </div>
                            </template>

                            <el-table :data="currentClickTaskData.data.countryData" row-key="countryCode"
                                :expand-row-keys="expandedRows" @expand-change="handleExpandChange" stripe
                                style="width: 100%" header-cell-class-name="table-header" row-class-name="table-row">
                                <el-table-column type="expand">
                                    <template #default="{ row }">
                                        <div class="expand-container">
                                            <el-card v-for="(item) in cardItems"
                                                :key="`${row.countryCode}-${item.dataKey}`" class="document-card">
                                                <template #header>
                                                    <div class="card-header">
                                                        <span>{{ item.title }}</span>
                                                    </div>
                                                </template>

                                                <div class="card-content">
                                                    <template v-if="item.type === 'document'">
                                                        <div v-if="row[item.dataKey].data">
                                                            <el-icon class="document-icon">
                                                                <!-- {{ item.dataKey }} -->
                                                                <document />
                                                            </el-icon>
                                                            <el-text>
                                                                制作时间：{{
                                                                    formatDateToSimple(row[item.dataKey].modifiedTime)
                                                                }}
                                                            </el-text>

                                                        </div>
                                                        <el-empty v-else :description="item.emptyText" />
                                                    </template>

                                                    <template v-if="item.type === 'permit'" >
                                                        <div v-if="row[item.dataKey].length != 0" class="permit-list">
                                                            <el-card v-for="(item, index) in row[item.dataKey]"
                                                                :key="index" @click="enterCurPermit(item)"
                                                                class="permit-card">
                                                                <div class="permit-card-content">
                                                                    <el-icon class="document-icon">
                                                                        <document />
                                                                    </el-icon>
                                                                    <div class="permit-card-info">
                                                                        <div class="permit-number">{{ item.permitNumber
                                                                            }}</div>
                                                                        <el-text class="permit-time">
                                                                            {{ formatDateToSimple(item.modifiedTime) }}
                                                                        </el-text>
                                                                        <el-text v-for="flight in item.flights" :key="flight" class="permit-time">
                                                                            {{ flight.flightNumber}}
                                                                        </el-text>
                                                                    </div>
                                                                </div>
                                                            </el-card>
                                                        </div>
                                                        <div  class="add-btn-wrapper" >
                                                            <el-button class="add-btn" type="success" size="large"
                                                                @click="showAddPermit">
                                                                <el-icon class="upload-icon">
                                                                    <Upload />
                                                                </el-icon>
                                                                点击新增批复
                                                            </el-button>
                                                        </div>
                                                        <el-dialog v-model="addPermitVisible" width="80%">
                                                            <template #title>
                                                                {{ dialogTitle }}
                                                            </template>
                                                            <div class="dialog-container">
                                                                <el-card class="upload-section">
                                                                    <div class="upload-tool">
                                                                        <el-upload class="upload-card"
                                                                            :on-change="handlePermitUpload"
                                                                            :auto-upload="false" :show-file-list="false"
                                                                            accept=".pdf,.doc,.docx,.xlsx,.xls">
                                                                            <template #trigger>
                                                                                <div v-if="!addPertmit">
                                                                                    <div>
                                                                                        <el-icon class="document-icon">
                                                                                            <document />
                                                                                        </el-icon>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span class="file-name">{{
                                                                                            permitFile.name
                                                                                        }}</span>
                                                                                    </div>
                                                                                    <el-button type="success"
                                                                                        size="large">
                                                                                        <el-icon class="upload-icon">
                                                                                            <Upload />
                                                                                        </el-icon>
                                                                                        重新上传
                                                                                    </el-button>
                                                                                </div>
                                                                                <div v-else
                                                                                    style="display: flex;justify-content: center;flex-direction: row;">
                                                                                    <el-button type="success"
                                                                                        size="large">
                                                                                        <el-icon class="upload-icon">
                                                                                            <Upload />
                                                                                        </el-icon>
                                                                                        上传飞越批复文件
                                                                                    </el-button>
                                                                                </div>

                                                                            </template>
                                                                            <div class="upload-tip">支持格式：pdf, doc, docx,
                                                                                xlsx, xls</div>
                                                                        </el-upload>

                                                                        <div v-if="permitFile" class="file-actions">
                                                                            <!-- <el-button @click="saveFile(row)"
                                                                                type="primary">确认核对无误</el-button> -->
                                                                            <el-button @click="previewFile" type="info">
                                                                                <el-icon class="upload-icon">
                                                                                    <View />
                                                                                </el-icon>
                                                                                预览批复文件
                                                                            </el-button>

                                                                        </div>


                                                                    </div>
                                                                    <el-divider />
                                                                    <div class="upload-tool">
                                                                        <div v-if="addPertmit"
                                                                            class="permission-input-container">
                                                                            <div>关联航班信息</div>
                                                                            <div class="input-section">
                                                                                <el-input
                                                                                    v-model="getState(row).inputValue"
                                                                                    placeholder="请输入批复号"
                                                                                    @keyup.enter="handleSave(row)"
                                                                                    clearable />
                                                                                <el-button type="primary" size="small"
                                                                                    @click="handleSave(row)"
                                                                                    :disabled="!tempStates[row.id].inputValue">
                                                                                    确认关联
                                                                                </el-button>
                                                                            </div>

                                                                            <!-- 航班选择列表 -->
                                                                            <div v-if="tempStates[row.id].inputValue"
                                                                                class="flight-selection">
                                                                                <el-checkbox-group
                                                                                    v-model="tempStates[row.id].selectedFlights"
                                                                                    class="flight-checkboxes">
                                                                                    <el-checkbox
                                                                                        :indeterminate="isIndeterminate(row.id)"
                                                                                        :model-value="isAllSelected(row.id)"
                                                                                        @change="val => $nextTick(() => handleCheckAll(val, row.id))"
                                                                                        class="select-all">
                                                                                        全选（{{ availableFlights.length
                                                                                        }}个航班）
                                                                                    </el-checkbox>
                                                                                    <el-checkbox
                                                                                        v-for="flight in availableFlights"
                                                                                        :key="flight.uniqueId"
                                                                                        :label="flight.flightNumber"
                                                                                        border class="flight-item">
                                                                                        <div class="flight-info">
                                                                                            <span
                                                                                                class="flight-number">{{
                                                                                                    flight.flightNumber
                                                                                                }}</span>
                                                                                            <span class="flight-route">
                                                                                                {{ flight.departure }} →
                                                                                                {{
                                                                                                    flight.arrival }}
                                                                                            </span>

                                                                                        </div>
                                                                                    </el-checkbox>

                                                                                </el-checkbox-group>
                                                                            </div>
                                                                        </div>

                                                                        <!-- 已关联信息展示 -->
                                                                        <div v-else class="permission-info">
                                                                            <div>已关联信息展示</div>
                                                                            <div class="permission-tag">
                                                                                <el-tag type="success"
                                                                                    class="permit-number">
                                                                                    {{
                                                                                        currentPermit.permitNumber
                                                                                    }}
                                                                                </el-tag>
                                                                                <!-- <span class="flight-count">
                                                                                    (已关联 {{
                                                                                        row.permissionNumberGroup.flights.length?row.permissionNumberGroup.flights.length:0
                                                                                    }} 个航班)
                                                                                </span> -->
                                                                                <div class="flight-numbers">
                                                                                    <template
                                                                                        v-for="(flight, index) in currentPermit.flights"
                                                                                        :key="index">
                                                                                        <el-tooltip
                                                                                            :content="tooltipContent(currentPermit, flight.flightNumber)"
                                                                                            placement="top">

                                                                                            <el-tag
                                                                                                v-if="flight.flightNumber"
                                                                                                type="info"
                                                                                                class="flight-badge">
                                                                                                {{ flight.flightNumber
                                                                                                }}
                                                                                            </el-tag>

                                                                                            <span v-else
                                                                                                class="error-tip">[航班号缺失]</span>
                                                                                        </el-tooltip>

                                                                                    </template>

                                                                                </div>
                                                                                <!-- <el-tag type="success" class="permit-number">
                                                                        {{ row.permissionNumberGroup.flights }}
                                                                    </el-tag> -->
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                </el-card>
                                                                <el-card class="preview-section" v-if="previewVisible">
                                                                    <!-- PDF预览 -->
                                                                    <iframe v-if="previewType === 'pdf'"
                                                                        :src="previewContent"
                                                                        style="height: 80vh; border: none;width:100%"></iframe>
                                                                    <!-- <iframe v-if="previewType === 'docx'"
                                                                        :src="previewContent"
                                                                        style="height: 80vh; border: none;width:100%"></iframe> -->
                                                                    <div v-if="previewType === 'docx'"
                                                                        class="docx-wrapper">
                                                                        <vue-office-docx :src="previewContent"
                                                                            @rendered="handleDocRendered"
                                                                            class="auto-scale-doc" />
                                                                    </div>
                                                                    <vue-office-excel v-if="previewType === 'xlsx'"
                                                                        :src="previewContent" style="height: 80vh;" />

                                                                    <!-- 不支持的类型 -->
                                                                    <div
                                                                        v-if="!['pdf', 'docx', 'xlsx'].includes(previewType)">
                                                                        暂不支持该文件类型预览
                                                                    </div>
                                                                </el-card>
                                                                <div>

                                                                    <el-button type="success" :icon="item.buttonIcon"
                                                                        @click="savePermissionNumber"
                                                                        :disabled="!readyToSavePermit">
                                                                        保存批复
                                                                        <!-- {{ item.buttonText }} -->
                                                                    </el-button>
                                                                </div>
                                                            </div>

                                                        </el-dialog>
                                                    </template>

                                                </div>

                                            </el-card>
                                        </div>

                                    </template>

                                </el-table-column>

                                <!-- 国家列 -->
                                <el-table-column prop="countryName" label="国家" width="150" align="center">
                                    <template #default="{ row }">
                                        <country-flag :country="row.countryCode" class="flag-icon" />
                                        <span class="country-name">{{ row.countryName }}</span>
                                    </template>
                                </el-table-column>

                                <!-- 申请阶段 -->
                                <el-table-column label="申请阶段" width="140">
                                    <template #default="{ row }">
                                        <div class="stage-switch">
                                            <el-switch v-model="row.applicationStage" :active-value="1"
                                                :inactive-value="0" :active-color="getStageColor(row.applicationStage)"
                                                @change="val => handleStageChange(row, 'applicationStage', val)" />
                                            <span :class="['status-text', getStatusClass(row.applicationStage)]">
                                                {{ stageMapping[row.applicationStage] }}
                                            </span>
                                        </div>
                                    </template>
                                </el-table-column>

                                <!-- 校核阶段 -->
                                <el-table-column label="校核阶段" width="140">
                                    <template #default="{ row }">
                                        <div class="stage-switch">
                                            <el-switch v-model="row.checkStage" :active-value="1" :inactive-value="0"
                                                :active-color="getStageColor(row.checkStage)"
                                                @change="val => handleStageChange(row, 'checkStage', val)" />
                                            <span :class="['status-text', getStatusClass(row.checkStage)]">
                                                {{ stageMapping[row.checkStage] }}
                                            </span>
                                        </div>
                                    </template>
                                </el-table-column>

                                <!-- 发布阶段 -->
                                <el-table-column label="发布阶段" width="140">
                                    <template #default="{ row }">
                                        <div class="stage-switch">
                                            <el-switch v-model="row.productionStage" :active-value="1"
                                                :inactive-value="0" :active-color="getStageColor(row.productionStage)"
                                                @change="val => handleStageChange(row, 'productionStage', val)" />
                                            <span :class="['status-text', getStatusClass(row.productionStage)]">
                                                {{ stageMapping[row.productionStage] }}
                                            </span>
                                        </div>
                                    </template>
                                </el-table-column>

                                <!-- 总体进度 -->
                                <el-table-column label="总体进度">
                                    <template #default="{ row }">
                                        <el-progress :percentage="row.progress"
                                            :color="row.progress === 100 ? '#67C23A' : '#F56C6C'" :stroke-width="16" />
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-card>
                        <el-dialog v-model="showPreviewDoc" :title="previewTitle" width="90%" top="5vh" destroy-on-close
                            @closed="handlePreviewClose">
                            <previewDoc :showData="previewDocData" :key="previewKey" />
                        </el-dialog>
                    </div>

                    <div v-if="curWorkArea == '制作台'" class="workArea">
                        <makeApply v-if="currentClickTaskData?.id" :seasonData-id="seasonDataId"
                            :work-type="currentTabType" :season="currentSeason" :season-key="currentSeasonKey"
                            :initialData="currentClickTaskData" @save="handleChildSave">
                        </makeApply>
                        <!-- <el-skeleton v-else /> -->


                    </div>

                </div>


            </el-tab-pane>
        </el-tabs>

        <!-- 任务编辑对话框 -->
        <el-dialog v-model="showDialog" :title="`${editMode === 'create' ? '新建' : '编辑'}任务 - ${currentTab?.label}`"
            width="80%">
            <el-form :model="newTaskData" label-width="auto" style="max-width: 600px">
                <el-form-item label="工作区名称">
                    <el-input v-model="newTaskData.title" />
                </el-form-item>
                <el-form-item label="创建时间">
                    <el-input disabled v-model="newTaskData.createTime" />
                </el-form-item>
                <el-form-item label="航季">
                    <el-input disabled v-model="newTaskData.season" />
                </el-form-item>
                <el-form-item label="类型">
                    <el-input disabled v-model="newTaskData.type" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSaveTask(newTaskData)">
                        Create
                    </el-button>
                    <!-- <el-button @click="resetForm(ruleFormRef)">Reset</el-button> -->
                </el-form-item>
            </el-form>

            <!-- <el-table :data="currentTaskData.value">
                <el-table-column prop="title"></el-table-column>
            </el-table> -->
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted } from 'vue'
import { getLastSunday } from '../utils/seasonCalculator'
// import {ElMessage} from '@element-plus'
import { Opportunity, Calendar, Plus } from '@element-plus/icons-vue'
import makeApply from './excel-line.vue'
import previewDoc from './previewDoc.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { writeXLSX } from 'xlsx'
import VueOfficeDocx from '@vue-office/docx';
import VueOfficeExcel from '@vue-office/excel';
import VueOfficePdf from '@vue-office/pdf';

import * as pdfjsLib from 'pdfjs-dist/webpack';
// import { useStore } from 'vuex'

// 常量定义
const TASK_TYPES = {
    seasonChange: {
        label: '换季申请',
        color: '#409EFF',
        icon: Opportunity
    },
    midSeason: {
        label: '季中申请',
        color: '#67C23A',
        icon: Calendar
    }
}
const cardItems = [
    {
        title: '申请文件',
        type: 'document',
        dataKey: 'productDoc',
        emptyText: '暂无申请文件',
        buttonText: '预览申请文件',
        buttonIcon: 'View'
    },
    {
        title: '批复信息',
        type: 'permit',
        dataKey: 'permissionNumberGroup',
        emptyText: '暂无批复文件',
        buttonText: '预览批复文件',
        buttonIcon: 'View'
    },
    // {
    //     title: '批复号',
    //     type: 'input',
    //     dataKey: 'permissionNumberGroup',
    //     emptyText: '暂无批复号',
    //     buttonText: '保存批复号',
    //     buttonIcon: 'DocumentAdd'
    // }
]
const STATUS_OPTIONS = [
    { value: 'draft', label: '草稿', type: 'info' },
    { value: 'processing', label: '进行中', type: 'primary' },
    { value: 'completed', label: '已完成', type: 'success' }
]
const workAreaOption = ['工作进度', '制作台']
const curWorkArea = ref('工作进度')
// 工具函数
const formatDateToSimple = (date) => {
    // 添加安全校验
    if (!date) return '';

    // 统一转换为字符串
    const dateString = date instanceof Date ? date.toISOString() : String(date);

    // 格式化处理
    return dateString
        .replace('T', ' ')
        .substring(0, 16)
        .replace(/:/g, '');  // 如果需要移除所有冒号
}

const handleDocRendered = () => {
    nextTick(() => {
        const wrapper = document.querySelector('.docx-wrapper')
        const docElement = document.querySelector('.auto-scale-doc > div') // 定位实际渲染容器
        if (!wrapper || !docElement) return

        const scaleRatio = wrapper.clientWidth / docElement.scrollWidth
        // const scaleRatio = Math.min(
        //   wrapper.clientWidth / docElement.scrollWidth,
        //   wrapper.clientHeight / docElement.scrollHeight
        // ) * 0.95 // 保留5%边距
        docElement.style.transform = `scale(${Math.min(scaleRatio, 1)})`
        // docElement.style.margin = '0 auto'
    })
}
// const handleDocRendered = () => {
//   nextTick(() => {
//     const wrapper = document.querySelector('.docx-wrapper')
//     const docElement = document.querySelector('.auto-scale-doc') // 定位实际渲染容器
//     if (!wrapper || !docElement) return

//     // 计算最佳缩放比例
//     const scaleRatio = Math.min(
//       wrapper.clientWidth / docElement.scrollWidth,
//       wrapper.clientHeight / docElement.scrollHeight
//     ) * 0.95 // 保留5%边距
//     console.log('scaleRatio',scaleRatio)
//     // 应用缩放和居中
//     docElement.style.transform = `scale(${scaleRatio})`
//     docElement.style.margin = 'auto'
//     // docElement.style.display = 'block'
//   })
// }
const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString()

// 样式相关计算属性
const typeLabels = computed(() => ({
    seasonChange: TASK_TYPES.seasonChange.label,
    midSeason: TASK_TYPES.midSeason.label
}))

const typeColors = computed(() => ({
    seasonChange: TASK_TYPES.seasonChange.color,
    midSeason: TASK_TYPES.midSeason.color
}))

const typeIcons = computed(() => ({
    seasonChange: TASK_TYPES.seasonChange.icon,
    midSeason: TASK_TYPES.midSeason.icon
}))

const statusTypes = computed(() =>
    Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.type]))
)
// 响应式状态
const seasons = ref([])
//选择器的选中航季
const selectedSeasonKey = ref('')
//当前航季的工作区的key值
const currentSeasonKey = ref('')
const tabs = ref([])
const activeTab = ref('')
const showDialog = ref(false)
const currentTaskData = ref({})
const newTaskData = ref({})

const editMode = ref('create')
//当前航季，有自动判断逻辑
const currentSeason = ref({})
//当前航季的数据，作为页面内交互使用
const currentSeasonData = ref([])
//初始化从缓存读取的航季数据，包含seasonKey的所有任务data
const dataStorageInThisSeason = ref([])
const permitFile = ref(null)
const previewType = ref(''); // pdf/docx/xlsx
const previewContent = ref(null);
const previewVisible = ref(false);
const handlePermitUpload = (uploadFile) => {
    permitFile.value = uploadFile.raw;
};
const saveFile = (row) => {
    if (!permitFile.value) return;
    console.log('row', row)

    // 创建临时保存路径
    const savePath = `/public/permitDoc/${permitFile.value.name}`;

    // 实际项目中这里需要实现文件保存逻辑
    // 可以使用Node.js的fs模块或浏览器端的File API

    ElMessage.success(`文件已保存到: ${savePath}`);
    const countryIndex = currentClickTaskData.value.data.countryData.findIndex(
        item => item.countryName === row.countryName
    )
    // console.log('row.id', countryIndex)

    if (countryIndex > -1) {
        const newPermitDocument = savePath
        console.log('newPermitDocument', newPermitDocument)

        // 不可变更新
        currentClickTaskData.value = {
            ...currentClickTaskData.value,
            data: {
                ...currentClickTaskData.value.data,
                countryData: currentClickTaskData.value.data.countryData.map(
                    (item, index) => index === countryIndex
                        ? { ...item, checkDoc: newPermitDocument }
                        : item
                )
            }
        }
        console.log('点击保存后的currentClickTaskData', currentClickTaskData)
    }

};
import { usePdfPreview } from './pdf-preview'
// const {
//     previewPdf,
//     currentPage,
//     pageCount,
//     nextPage,
//     prevPage
// } = usePdfPreview()
// 统一预览处理
const addPermitVisible = ref(false)
const addPertmit = ref(false)
const currentPermit = ref({})
const showAddPermit = () => {
    addPermitVisible.value = true
    addPertmit.value = true
}
const dialogTitle = computed(() =>
    addPertmit.value ? '新增批复' : '编辑批复'
)
const enterCurPermit = (data) => {
    console.log('data', data)
    currentPermit.value = data
    addPermitVisible.value = true
    addPertmit.value = false
    permitFile.value = data.permitDoc
}
const previewFile = async () => {
    if (!permitFile.value) return;

    const ext = permitFile.value.name.split('.').pop().toLowerCase();
    previewType.value = ext;
    console.log('ext', ext)

    try {
        // PDF处理
        if (ext === 'pdf') {
            console.log('执行pdf')
            const arrayBuffer = await permitFile.value.arrayBuffer();
            console.log('arrayBuffer', arrayBuffer)
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            console.log('blob', blob)
            previewContent.value = URL.createObjectURL(blob);
            console.log('previewContent.value', previewContent.value)

            await nextTick();
            previewVisible.value = true;


        }
        // Office文件处理
        else if (['docx', 'xlsx'].includes(ext)) {
            const arrayBuffer = await permitFile.value.arrayBuffer();
            previewContent.value = arrayBuffer;
            console.log('previewContent', previewContent)
            previewVisible.value = true;
            console.log('previewVisible', previewVisible)


        }

    } catch (error) {
        ElMessage.error('文件预览失败: ' + error.message);
    }
};
// 销毁时释放资源
onBeforeUnmount(() => {
    if (previewType.value === 'pdf' && previewContent.value) {
        previewContent.value.destroy();
    }
});
onUnmounted(() => {
    if (previewContent.value?.startsWith('blob:')) {
        URL.revokeObjectURL(previewContent.value);
    }
});
// 初始化航季数据
// 父组件加载
// const isDataLoaded = ref(false)
// onMounted(async () => {
//   await handleEditTask() // 异步获取数据
//   isDataLoaded.value = true
// })
onMounted(() => {
    const currentYear = new Date().getFullYear()
    seasons.value = [
        ...calculateSeasons(currentYear - 1),
        ...calculateSeasons(currentYear),
        ...calculateSeasons(currentYear + 1)
    ]

    // 自动判断当前航季
    const now = new Date()
    currentSeason.value = seasons.value.find(season =>
        now >= season.start && now <= season.end
    )?.key || ''
})
//
const countryProgress = ref([])
const handleChildSave = ({ index, id, action, data, countryData }) => {
    console.log('handleChildSave', index, 'data', data, 'id', id, 'action', action)
    const storageKey = currentSeasonKey.value
    console.log('storageKey', storageKey)
    let storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log('获取到现有的storedData', storedData)
    const targetIndex = storedData.findIndex(item => item.id === id)
    console.log('获取父组件storage的targetIndex', targetIndex)
    countryProgress.value = data.countryData
    console.log('同步子组件的data', data)
    console.log('同步子组件的countryProgress', countryProgress.value)
    // console.log('同步子组件的countryProgress', data.countryData.value)
    if (targetIndex !== -1) {
        // 保留原有数据引用，仅修改需要更新的字段
        storedData[targetIndex] = {
            ...storedData[targetIndex], // 保留其他字段:ml-citation{ref="3" data="citationList"}
            data: data,
            lastModified: new Date().toISOString()
        };
        console.log('修改后的storedData', storedData)

    } else {
        storedData.push(newDataItem);
    }
    localStorage.setItem(storageKey, JSON.stringify(storedData));
    console.log('storageKey', storageKey, 'JSON.stringify(storedData)', JSON.stringify(storedData), '从新储存的storedData', JSON.parse(localStorage.getItem(storageKey)))

    // if (targetIndex !== undefined && targetIndex !== -1) {
    //     // 精准索引更新
    //     dataStorageInThisSeason.value = dataStorageInThisSeason.value.map((item, i) =>
    //         i === targetIndex ? { ...item, ...data } : item
    //     );
    //     console.log('更新dataStorageInThisSeason', dataStorageInThisSeason.value)
    // } else {
    //     // 添加新条目
    //     dataStorageInThisSeason.value = [...dataStorageInThisSeason.value, data];
    //     console.log('增加新数据dataStorageInThisSeason', dataStorageInThisSeason.value)

    // }

}
//
const showPreviewDoc = ref(false)
const previewDocData = ref([])
const previewTitle = ref('')
const previewKey = ref(null)
const dataKeyMap = {
    productDoc: '申请件',
    checkDoc: '批复件',
    permissionNumberGroup: '批复号'
}
const expandedRows = ref([])

// 记录展开状态
const handleExpandChange = (targetRow) => {
    const currentKey = targetRow.countryCode // 使用 countryCode 作为唯一标识
    expandedRows.value = expandedRows.value[0] === currentKey ? [] : [currentKey]

    //   const rowId = targetRow.id
    //   const index = expandedRows.value.indexOf(rowId)

    //   if (index > -1) {
    //     // 如果已展开则关闭
    //     expandedRows.value.splice(index, 1)
    //   } else {
    //     // 如果未展开则先清空再打开当前行（实现手风琴效果）
    //     // expandedRows.value = [rowId] // 若需要只展开一行
    //     // 若需要允许多行展开则改为：
    //     expandedRows.value.push(rowId)
    //   }
}
// 数据更新时保留展开状态
// 初始化临时状态
const initTempState = (row) => {
    if (!tempStates[row.id]) {
        tempStates[row.id] = reactive({
            inputValue: '',
            selectedFlights: []
        })
    }
    return tempStates[row.id]
}
const getState = (row) => {
    if (!tempStates[row.id]) {
        tempStates[row.id] = reactive({
            inputValue: '',
            selectedFlights: [],
            isLoading: false
        })
    }
    return tempStates[row.id]
}
// 可用航班数据（根据实际情况调整）
const availableFlights = computed(() => {
    return currentClickTaskData.value.data.flightData
        .filter(flight => !!flight.flightNumber)
        .map(flight => ({
            ...flight,
            departureTime: new Date(flight.departureTime)
        }))
})

// 判断是否存在批复号
const hasPermissionNumber = (row) => {
    return !!row.permissionNumberGroup?.permitNumber
}

const tempStates = reactive({})
const ensureState = (rowId) => {
    if (!tempStates[rowId]) {
        // 使用深层响应式初始化
        tempStates[rowId] = reactive({
            inputValue: '',
            selectedFlights: reactive([])  // 嵌套响应式数组
        })

        // 添加属性变更监视
        watch(
            () => tempStates[rowId].selectedFlights,
            (newVal) => {
                console.log('选中航班变化:', rowId, newVal)
            },
            { deep: true }
        )
    }
    return tempStates[rowId]
}
// 修正后的全选状态计算（使用动态计算属性）
const isAllSelected = (rowId) => {
    const state = ensureState(rowId)
    return computed(() => {
        return state.selectedFlights.length === availableFlights.value?.length
    }).value
}
const isIndeterminate = (rowId) => {
    const state = ensureState(rowId)
    const selected = state.selectedFlights?.length || 0
    return selected > 0 && selected < availableFlights.value?.length
}
const handleCheckAll = async (val, rowId) => {
    const state = ensureState(rowId)

    // 生成全新引用
    const newValues = val
        ? [...availableFlights.value.map(f => f.flightNumber)]
        : []

    // 强制清除旧引用
    state.selectedFlights.splice(0, state.selectedFlights.length)

    // 批量添加新值
    state.selectedFlights.push(...newValues)

    // 触发深度更新
    await nextTick()
    state.selectedFlights = [...state.selectedFlights]
}
const readyToSavePermit = ref(false)
const handleSave = (row) => {
    initTempState(row)
    const state = tempStates[row.id]

    if (!state.inputValue.trim()) {
        ElMessage.warning('请输入有效的批复号')
        return
    }
    if (state.selectedFlights.length === 0) {
        ElMessage.warning('请至少选择一个关联航班')
        return
    }
    // 更新国家数据
    const countryIndex = currentClickTaskData.value.data.countryData.findIndex(
        item => item.id === row.id
    )

    if (countryIndex > -1) {
        const newPermission = {
            permitDoc: permitFile.value,
            permitNumber: state.inputValue.trim(),
            flights: availableFlights.value
                .filter(flight =>
                    state.selectedFlights.includes(flight.flightNumber)
                )
                .map(flight => ({
                    flightNumber: flight.flightNumber,
                    departure: flight.departure,
                    arrival: flight.arrival,
                    departureTime: flight.departureTime
                }))
        }

        // 不可变更新
        currentClickTaskData.value = {
            ...currentClickTaskData.value,
            data: {
                ...currentClickTaskData.value.data,
                countryData: currentClickTaskData.value.data.countryData.map(item =>
                    item.id === row.id
                        ? {
                            ...item,
                            permissionNumberGroup: [
                                ...(item.permissionNumberGroup || []), // 保留已有权限组
                                newPermission // 追加新权限组
                            ]
                        }
                        : item
                )
                // countryData: currentClickTaskData.value.data.countryData.map(
                //     (item, index) => index === countryIndex
                //         ? { ...item, permissionNumberGroup: newPermission }
                //         : item
                // )
            }
        }
        console.log('点击保存后的currentClickTaskData', currentClickTaskData)
        readyToSavePermit.value = true
    }

    // 重置临时状态
    state.inputValue = ''
    state.selectedFlights = []
    ElMessage.success('关联信息已保存')
}
// 工具函数
const formatFlightTime = (date) => {
    return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(/\//g, '-')
}

const tooltipContent = (currentPermit, data) => {
    console.log('currentPermit in toolTip', currentPermit)
    const targetIndex = currentPermit.flights.findIndex(item => item.flightNumber == data)
    // console.log('tooltipContent row', row, 'data', data, 'targetIndex', targetIndex)
    return `${currentPermit.flights[targetIndex].departure}→${currentPermit.flights[targetIndex].arrival}`
    // .map(flight => `${flight.flightNumber} | ${flight.departure}→${flight.arrival}`)
}
const previewCurDoc = (row, dataKey) => {
    showPreviewDoc.value = true
    console.log('previewCurDocrow', row)
    if (!row[dataKey]?.data) return

    previewTitle.value = `${row.countryName} - ${dataKeyMap[dataKey]}`
    previewDocData.value = row.productDoc
    previewKey.value = Date.now() // 强制刷新组件
    console.log('showPreviewDoc', showPreviewDoc, 'previewDocData', previewDocData.value)
}

const handlePreviewClose = () => {
    previewDocData.value = []
}
const savePermissionNumber = () => {
    const storageKey = currentSeasonKey.value;

    // 安全读取本地存储（添加异常捕获）
    let storedData = [];
    try {
        storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) {
        console.error('本地存储读取失败:', e);
    }

    // 处理响应式数据（解除代理）
    const rawData = JSON.parse(JSON.stringify(currentClickTaskData.value));
    const targetId = rawData.id;

    // 添加数据校验
    if (!targetId || typeof targetId !== 'string') {
        console.error('无效的任务ID:', targetId);
        return;
    }

    const targetIndex = storedData.findIndex(item => item.id === targetId);

    if (targetIndex !== -1) {
        // 深度合并数据（保留原有字段）
        storedData[targetIndex] = {
            ...storedData[targetIndex],    // 保留原有属性
            ...rawData,                    // 合并新数据
            lastModified: new Date().toISOString()
        };
    }

    // 安全写入（添加异常处理）
    try {
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        console.log('保存成功:', JSON.parse(JSON.stringify(storedData)));
    } catch (e) {
        console.error('本地存储写入失败:', e);
        // 处理存储空间不足等情况
        if (e.name === 'QuotaExceededError') {
            alert('存储空间不足，请清理后重试');
        }
    }
}
// 临时存储输入值


// 判断是否存在批复号
// const hasPermissionNumber = (row) => {
//     return row.permissionNumberGroup?.permitNumber?.trim()?.length > 0;
// };

// 生成悬停提示内容
const generateTooltipContent = (permissionGroup) => {
    if (!permissionGroup?.flights?.length) return '';
    return permissionGroup.flights
        .map(flight => `航班号：${flight.flightNumber}\n时间：${flight.departureTime}`)
        .join('\n\n');
};


// 计算属性
currentSeason.value = computed(() =>
    seasons.value.find(s => s.key === selectedSeasonKey.value)?.label || ''
)

const currentTab = computed(() =>
    tabs.value.find(t => t.key === activeTab.value)
)
//加载现有数据
const reloadFlag = ref(0)
// const currentTasks= ref([])
const currentTasks = computed(() => {
    reloadFlag.value
    if (!currentTab.value) return []
    const data = loadSeasonData(currentSeasonKey.value)
    console.log('2.加载选中航季的loadSeasonData', data)
    return data.map(task => ({
        ...task,
        statusLabel: STATUS_OPTIONS.find(s => s.value === task.status)?.label || '未知状态',
        createTime: new Date(task.createTime).toLocaleString()
    }))
})
// const readTaskDataInThisSeason= currentTasks
// console.log('当前航季所有data(处理后)',readTaskDataInThisSeason)
// 方法

//第一步，点击航季的种类入口，生成tabs
const currentTabType = ref('')
const handleWorkflowEntry = (type) => {
    if (!currentSeason.value) {
        ElMessage.warning('请先选择航季')
        return
    }
    // console.log('selectedSeasonKey.value',selectedSeasonKey.value)
    const checkSeason = selectedSeasonKey.value ? selectedSeasonKey.value : currentSeason.value
    const tabKey = `${checkSeason}_${type}`
    currentSeasonKey.value = tabKey
    currentTabType.value = type
    console.log('1.点击工作入口，currentSeasonKey', currentSeasonKey.value)

    const exists = tabs.value.some(t => t.key === tabKey)

    if (!exists) {
        tabs.value.push({
            key: tabKey,
            label: `${selectedSeasonKey.value} ${TASK_TYPES[type].label}`,
            season: checkSeason,
            type: type
        })
        console.log('tabs', tabs)
    }

    activeTab.value = tabKey
}

const handleCreateTask = (tab) => {
    console.log('tab', tab)

    editMode.value = 'create'
    newTaskData.value = {
        title: `新建${TASK_TYPES[tab.type].label}任务`,
        type: TASK_TYPES[tab.type],
        season: currentSeason,
        status: 'draft',
        createTime: new Date().toISOString(),
        data: {},
        workProgress: {}
    }

    console.log('创建的数据currentTaskData', newTaskData)
    showDialog.value = true
}

const loadSeasonData = (currentSeasonKey) => {
    const key = `${currentSeasonKey}`
    console.log('导入的key', currentSeasonKey)
    try {
        dataStorageInThisSeason.value = JSON.parse(localStorage.getItem(key)) || []
        console.log('key', key, 'dataStorageInThisSeason', dataStorageInThisSeason)
        console.log(JSON.parse(localStorage.getItem(key)))

        return JSON.parse(localStorage.getItem(key)) || []
    } catch {
        return []
    }
}

const saveSeasonData = (currentSeasonKey, data) => {

    const key = `${currentSeasonKey}`
    localStorage.setItem(key, JSON.stringify(data))
    console.log('保存后查询缓存的数据', JSON.parse(localStorage.getItem(key)))
    reloadFlag.value++ // 触发计算属性更新
}
const showApplyPanel = ref(false)
const seasonDataId = ref('')
const currentClickTaskData = ref([])
// const showTypeEntry =ref('true')
const handleEditTask = (task) => {
    // 获取全量数据
    let storedData = []
    try {
        storedData = JSON.parse(localStorage.getItem(currentSeasonKey.value)) || []
    } catch (e) {
        console.error('存储数据损坏，重置为空', e)
    }
    console.log('点击的storedData', storedData)

    seasonDataId.value = task.id
    // console.log('点击的seasonDataId', seasonDataId.value)

    console.log("task.id 类型:", typeof task.id);
    console.log("storedData[0].id 类型:", typeof storedData[0].id);
    console.log("task.id 原始值:", JSON.stringify(task.id));
    console.log("storedData[0].id 原始值:", JSON.stringify(storedData[0].id));
    const targetIndex = storedData.findIndex(item => String(item.id) === String(task.id))
    console.log('targetIndex', targetIndex)

    try {
        // currentClickTaskData.value = targetIndex !== -1 ? storedData[targetIndex] : {}
        currentClickTaskData.value = storedData[targetIndex]

    } catch (e) {
        console.error('currentClickTaskData错误', e)

    }
    console.log('currentClickTaskData.value', currentClickTaskData.value)

    countryProgress.value = currentClickTaskData.value.data.countryData
    console.log('countryProgress.value', countryProgress.value)

    editMode.value = 'edit'
    currentTaskData.value = { ...task }
    showApplyPanel.value = true
    console.log('targetIndex', targetIndex)

    console.log('点击的seasonDataId', seasonDataId.value, 'currentClickTaskData', currentClickTaskData)

    // 打印验证
    // console.log('解包后的countryData:', rawCountryData)\
}
// 计算总进度

const totalProgress = computed(() => {
    const data = countryProgress.value
    if (!data?.length) return 0
    return Math.round(data.reduce((sum, item) => sum + item.progress, 0) / data.length)
})
// 阶段配置项
const stageOptions = ref([
    { value: 0, label: '未开始', color: '#F56C6C' },
    { value: 1, label: '已完成', color: '#67C23A' }
])

// 阶段状态映射
const stageMapping = {
    0: '未开始',
    1: '已完成'
}

// 获取状态颜色
const getStageColor = (stage) => {
    // console.log('getColor', stage)
    return stageOptions.value.find(opt => opt.value === stage)?.color || '#909399'
}

// 状态文字样式
const getStatusClass = (stage) => {
    return stage === 1 ? 'status-completed' : 'status-inactive'
}


// 处理状态变化
const handleStageChange = (row, stageType, newValue) => {
    console.log('row', row)
    console.log('newValue', newValue)

    const nextStage = newValue
    console.log('nextStage', nextStage)

    row[stageType] = nextStage
    console.log('row[stageType]', row[stageType])
    console.log('更新countryProgress', currentClickTaskData.value.data.countryData)
    updateProgress(row)
    //刷新储存
    const curSeasonId = seasonDataId.value
    console.log('刷新储存//获取到现有的curSeasonId', curSeasonId)

    const storageKey = currentSeasonKey.value
    console.log('刷新储存//storageKey', storageKey)

    let storedData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log('刷新储存//获取到现有的storedData', storedData)
    const targetIndex = storedData.findIndex(item => item.id === curSeasonId)
    console.log('刷新储存//获取currentClickTaskData.value', currentClickTaskData.value)
    console.log('刷新储存//点击switch修改后的storedData', storedData)

    // console.log('同步子组件的countryProgress', data.countryData.value)

    if (targetIndex !== -1) {
        // 保留原有数据引用，仅修改需要更新的字段
        storedData[targetIndex] = {
            ...storedData[targetIndex], // 保留其他字段:ml-citation{ref="3" data="citationList"}
            data: currentClickTaskData.value.data,
            lastModified: new Date().toISOString()
        };
        console.log('刷新储存//点击switch修改后的storedData', storedData)
    } else {
        storedData.push(newDataItem);
    }
    localStorage.setItem(storageKey, JSON.stringify(storedData));
    console.log('刷新储存//返回后从新储存的storedData', JSON.parse(localStorage.getItem(storageKey)))
}


// 更新进度计算逻辑
const updateProgress = (row) => {
    const stages = [row.applicationStage, row.checkStage, row.productionStage]
    const completedCount = stages.filter(s => s === 1).length
    row.progress = Math.round((completedCount / stages.length) * 100)
}

// // 进度条颜色配置
// const customColors = [
//     { color: '#f56c6c', percentage: 20 },
//     { color: '#e6a23c', percentage: 40 },
//     { color: '#5cb87a', percentage: 60 },
//     { color: '#1989fa', percentage: 80 },
//     { color: '#6f7af3', percentage: 100 }
// ]

// 阶段标签样式
// const stageTagType = (stage) => {
//     const statusMap = {
//         '未开始': 'info',
//         '进行中': 'warning',
//         '已完成': 'success',
//         '未申请': 'danger'
//     }
//     return statusMap[stage] || 'info'
// }

// 总进度格式
// const progressFormat = (p) => `${p}% 总体完成度`

// 删除操作
const handleDeleteTask = (task) => {
    console.log()
    ElMessageBox.confirm('确认删除该任务？').then(() => {
        const originData = loadSeasonData(currentSeasonKey.value)
        const filteredData = originData.filter(t => t.id !== task.id)
        saveSeasonData(currentSeasonKey.value, filteredData)
    })
}
//弹窗点击保存新建任务
const handleSaveTask = (taskData) => {
    console.log('点击保存传到函数的taskData', taskData)
    const currentData = loadSeasonData(currentSeasonKey.value)
    console.log('currentData', currentData)
    if (editMode.value === 'create') {
        currentData.push({
            ...taskData,
            id: Date.now().toString() + currentSeasonKey.value
        })
        console.log('currentData', currentData)

        // seasonDataId = Date.now().toString()+season+type
        // console.log()
    } else {
        const index = currentData.findIndex(t => t.id === taskData.id)
        if (index > -1) currentData.splice(index, 1, taskData)
    }

    saveSeasonData(currentSeasonKey.value, currentData)
    console.log('保存的数据saveSeasonData', currentData)
    showDialog.value = false
    ElMessage.success('任务保存成功')
}
const getBack = () => {
    showApplyPanel.value = false
    let storedData = []
    try {
        storedData = JSON.parse(localStorage.getItem(currentSeasonKey.value)) || []
    } catch (e) {
        console.error('存储数据损坏，重置为空', e)
    }
    console.log('返回的storedData', storedData)

}
// 航季计算逻辑
const calculateSeasons = (year) => {
    const seasons = []
    // 计算夏秋航季（3月最后一个周日 - 10月最后一个周日）
    const summerStart = getLastSunday(year, 3)
    const summerEnd = getLastSunday(year, 10)

    // 计算冬春航季（10月最后一个周日 - 次年3月最后一个周日）
    const winterStart = summerEnd
    const winterEnd = getLastSunday(year + 1, 3)

    seasons.push({
        key: `S${year}`,
        label: `${year}夏秋航季`,
        start: summerStart,
        end: summerEnd
    }, {
        key: `W${year}`,
        label: `${year}冬春航季`,
        start: winterStart,
        end: winterEnd
    })

    return seasons
}

// 组件逻辑
provide('storageData', {
    get: () => dataStorageInThisSeason.value,
    set: (value) => dataStorageInThisSeason.value = value
})

//更换航季
const handleSeasonChange = (newSeason) => {
    if (tabs.value.length > 0) {
        ElMessageBox.confirm('切换航季将关闭所有标签页，是否继续？', '提示', {
            type: 'warning'
        }).then(() => {
            tabs.value = []
            currentSeason.value = newSeason
        })
    } else {
        currentSeason.value = newSeason
    }
}

// 打开任务面板


const taskData = reactive({})
const getTasks = (season, type) => {
    const key = `${season}_${type}`
    return taskData[key] || []
}

</script>

<style lang="scss" scoped>
//新增批复弹窗
.permit-dialog {
    --dialog-padding: 20px;
}

.dialog-container {
    display: flex;
    gap: 20px;
    min-height: 70vh;
}

.upload-section {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100%;
    // border: 1px solid black;
    // min-height: 35vh;
    // border: 1px solid black;
}

.upload-tool {
    // flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 30vh;
    // border: 1px solid black;
    // border: 1px solid black;
}

.preview-section {
    flex: 1;
    // min-height: 35vh;
    // border: 1px solid black;
}

.file-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 20px 0;
}

.upload-empty {
    display: flex;
    justify-content: center;
    padding: 40px 0;
}

.docx-wrapper {
    height: 100vh;
    //   display: flex;
    //   justify-content: center;
    //   align-items: center;
    overflow-y: scroll;
    background: white;
    border: 1px solid black;
    padding: 0 0 0 0px;
    width: 100%;

}

.auto-scale-doc {
    width: 100%;
    transform-origin: 0 0;
    transition: transform 0.3s;
}

.file-actions {
    margin-top: 20px;
    text-align: center;
}

.preview-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.file-preview {
    width: 100%;
    height: 100%;
    border: none;
}

.preview-placeholder {
    text-align: center;
    color: var(--el-text-color-secondary);
}

.page-controls {
    margin-top: 20px;
    text-align: center;
}

#pdf-preview-container {
    min-height: 500px;
    border: 1px solid #eee;
}

.season-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.entry-card {
    height: 280px;
    cursor: pointer;
    transition: transform 0.2s;
    min-height: 280px;

    &:hover {
        transform: translateY(-3px);
    }

}

.workArea {
    width: 98%;
    margin: auto;
    background-color: white;
}

.task-container {
    width: 100%;

    // background: white;
    // display: flex;
    // flex-direction: row;
    .task-card {
        position: relative;
        width: 280px;
        min-height: 280px;
        cursor: pointer;
        transition: transform 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;

        &:hover {
            transform: translateY(-3px);

            .card-actions {
                opacity: 1;
                transform: translateY(0);
            }

            .task-content {
                filter: brightness(0.8); // 降低内容亮度
            }
        }

        .card-actions {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 2;
            transform: translateY(10px); // 入场动画
        }

        .el-button {
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.05);
            }
        }

        .el-card {
            position: relative;
            overflow: hidden;

            ::v-deep(.el-card__body) {
                padding: 0 !important;
            }
        }

        .task-content {
            text-align: center;
            padding: 30px 0;
            position: relative;
            z-index: 1;
            transition: filter 0.3s;

            h3 {
                margin: 15px 0;
                color: var(--el-text-color-primary);
            }

            p {
                color: var(--el-text-color-secondary);
                font-size: 14px;
            }
        }
    }
}

.custom-style .el-segmented {
    --el-segmented-item-selected-color: var(--el-text-color-primary);
    --el-segmented-item-selected-bg-color: #ffd100;
    --el-border-radius-base: 16px;
}

.progress-dashboard {
    border-radius: 12px;
    border: 1px solid #ebeef5;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.total-progress {
    width: 300px;
}

.flag-icon {
    width: 24px;
    margin-right: 8px;
    vertical-align: middle;
}

.country-name {
    font-weight: 500;
}

.progress-percent {
    margin-left: 12px;
    color: #409eff;
    font-weight: bold;
}

:deep(.table-header) {
    background-color: #f8f9fa !important;
    font-weight: 600;
    color: #495057;
}

:deep(.table-row) {
    transition: all 0.3s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
}

.expand-container {
    display: flex;
    gap: 16px;
    padding: 12px 0;
    justify-content: space-between;
    // min-height: 600px;
}

.document-card {
    flex: 1;
    min-width: 280px;
}

.card-header {
    font-weight: 600;
    color: var(--el-color-primary);
}

.document-icon {
    font-size: 48px;
    color: var(--el-color-primary);
}

.upload-card {
    display: flex;
    justify-content: center;
    flex-direction: column;
    ;
}
/* 卡片列表布局 */
.permit-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

/* 卡片样式 */
.permit-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  width: 85%;
  margin: auto;
}
.permit-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 卡片内容布局 */
.permit-card-content {
  display: flex;
  align-items: center;
  padding: 12px;
}

.document-icon {
  font-size: 28px;
  color: #409eff;
  margin-right: 16px;
}

.permit-card-info {
  display: flex;
  flex-direction: column;
}

.permit-number {
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.permit-time {
  font-size: 12px;
  color: #909399;
}

/* 新增按钮样式 */
.add-btn-wrapper {
  text-align: center;
  margin-top: 16px;
}

.add-btn {
  width: 140px;
  height: 48px;
  font-size: 16px;
}
.add-btn:hover {
  background-color: #67c23a;
  border-color: #67c23a;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-card__footer) {
    text-align: center;
    padding-top: 12px;
}

.permission-input-container {
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.input-section {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.flight-selection {
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;
    border: 1px solid #f0f2f5;
    border-radius: 4px;
}

.flight-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 8px;
}

.flight-item {
    margin: 0;
    padding: 8px;
    transition: background 0.3s;
}

.flight-info {
    display: flex;
    gap: 12px;
    align-items: center;
}

.flight-number {
    font-weight: 500;
    min-width: 80px;
}

.flight-route {
    color: #666;
    min-width: 120px;
}

.flight-time {
    color: #999;
    font-size: 0.9em;
}

.permission-tag {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 8px;
}

.permit-number {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.flight-count {
    color: #666;
    font-size: 0.9em;
}

.flight-numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.flight-badge {
    background-color: #f0f2f5;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.stage-switch {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-text {
    font-size: 13px;
    font-weight: 500;
}

.status-inactive {
    color: #F56C6C;
}

.status-processing {
    color: #E6A23C;
}

.status-completed {
    color: #67C23A;
}

:deep(.el-switch__core) {
    border-radius: 12px !important;
}

:deep(.el-switch .el-switch__core) {
    border-color: var(--el-switch-on-color);
    background-color: var(--el-switch-on-color);
}

.season-manager {
    padding: 20px;

    .season-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;

        .season-select {
            width: 360px;
        }
    }

    .workflow-entries {
        margin-bottom: 24px;

        .entry-card {
            height: 180px;

            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;

            &:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
        }

        .entry-content {
            text-align: center;
            padding: 30px 0;

            h3 {
                margin: 15px 0;
                color: var(--el-text-color-primary);
            }

            p {
                color: var(--el-text-color-secondary);
                font-size: 14px;
            }
        }
    }

    :deep(.el-tabs__content) {
        padding: 16px;
        background: #f8f9fa;
    }

    .tab-badge {
        :deep(.el-badge__content) {
            top: 10px;
            right: -10px;
        }
    }
}
</style>