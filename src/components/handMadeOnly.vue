<template>
    <div class="flight-system-container">
        <!-- <div>啦啦啦</div> -->
        <!-- 控制工具栏 -->
        <div class="control-bar">
            <el-switch v-model="useLocalTime" active-text="本地时间" inactive-text="UTC时间"
                style="--el-switch-on-color: #409eff;" />
            <span class="timezone-display">
                <!-- 当前时区：{{ currentTimezone }} -->
                {{ useLocalTime ? '东八区' : 'UTC' }}

            </span>
        </div>
        <div>
            <el-steps :active="activeHandMadeStep" finish-status="success" align-center simple>
                <el-step title="选择申请国家" />
                <el-step title="编辑信息" />
                <el-step title="生成文件" />
            </el-steps>
            <template v-if="activeHandMadeStep == 0">
                <el-select style="width: 60%;margin-top: 20px;" v-model="selectedCountryName" placeholder="选择国家"
                    @change="handleCountryChange">
                    <el-option v-for="country in countryList" :key="country.code" :label="country.name"
                        :value="country.name" />
                </el-select>

                <div>
                    <el-button style="margin-top: 12px" @click="next"
                        :disabled="selectedCountryName == ''">下一步</el-button>
                </div>
            </template>
            <template v-if="activeHandMadeStep == 1">
                <div class="data-tables" v-if="countrySelectedData">
                    <!-- 飞行数据表格 -->
                    <div class="table-section">
                        <h3>航班数据需求</h3>
                        <div v-if="countrySelectedData.requireFlightData?.length">
                            <el-table :data="flightDataInSelectedCountry">
                                <el-table-column v-for="(item, index) in processedFlightHeaders" :key="index"
                                    :prop="item.prop" :label="item.label"
                                    style="display: flex;justify-content:center;align-items: center;">
                                    <template #default="scope">
                                        <el-time-picker :disabled="tableStates.flight.confirmed" style="width: 80%;"
                                            v-if="item.label.includes('TIME')" v-model="scope.row[item.prop]"
                                            placeholder="请选择时间" format="HH:mm" :disabled-seconds="disabledAllSeconds"
                                            :disabled-minutes="disabledMinutes" value-format="HH:mm" />
                                        <!-- 自动填充 -->
                                        <el-autocomplete :disabled="tableStates.flight.confirmed"
                                            v-else-if="['departure', 'arrival'].includes(item.prop)"
                                            v-model="scope.row[item.prop]" :fetch-suggestions="querySearchAsync"
                                            placeholder="输入机场代码" @select="handleSelect" popper-class="my-autocomplete">
                                            <!-- <template #suffix>
                                <el-icon class="el-input__icon" @click="handleIconClick">
                                  <edit />
                                </el-icon>
                              </template> -->
                                            <template #default="{ item }">
                                                <!-- <div class="value">{{ item.value }}<span class="link">{{ item.name }}</span></div> -->
                                                <span style="float: left">{{ item.value }}</span>
                                                <span
                                                    style="float: right;color: var(--el-text-color-secondary); font-size: 13px; ">
                                                    {{ item.name }}
                                                </span>
                                            </template>
                                        </el-autocomplete>
                                        <el-input v-else style="width: 80%;" v-model="scope.row[item.prop]"
                                            :disabled="!tableStates.flight.editable"
                                            :placeholder="setPlaceholderDynamic(item.prop)"
                                            @input="val => handleInput(scope.row, item.prop, val)"
                                            @blur="handleBlur(scope.row, item.prop)">
                                            <!-- <template #prefix>
                                <span class="prefix-cxa">CXA</span>
                              </template> -->
                                        </el-input>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div style="margin-top: 10px;">
                                <el-button :disabled="tableStates.flight.confirmed" @click="addRow('flight')">+
                                    添加行</el-button>
                                <el-button :disabled="tableStates.flight.confirmed" @click="deleteRow('flight')">-
                                    删除行</el-button>

                            </div>

                            <div class="confirm-section" style="margin-top: 10px;">
                                <el-button type="primary" :disabled="tableStates.flight.confirmed"
                                    @click="handleConfirm('flight')">确认航班数据</el-button>
                                <el-button type="warning" :disabled="!tableStates.flight.confirmed"
                                    @click="editTable('flight')">修改</el-button>
                            </div>
                        </div>
                        <div v-else class="no-data">不需要航班数据</div>
                    </div>

                    <!-- 航路数据表格 -->
                    <div class="table-section">
                        <h3>航路数据需求</h3>
                        <div v-if="countrySelectedData.requireRouteData?.length">
                            <el-table :data="routeDataInSelectedCountry">
                                <el-table-column v-for="(item, index) in processedRouteHeaders" :key="index"
                                    :prop="item.prop" :label="item.label">
                                    <template #default="scope">
                                        <div>
                                            <el-select v-if="item.label.includes('关联')" style="width: 60%;"
                                                v-model="chooseFlightTyped" placeholder="匹配航班"
                                                @change="handleChooseFlightTyped(chooseFlightTyped, scope.$index)">
                                                <el-option v-for="flight in flightDataInThisCountryByHand"
                                                    :key="flight.flightNumber" :label="flight.flightNumber"
                                                    :value="flight.flightNumber">
                                                    <span style="float: left">{{ flight.flightNumber }}</span>
                                                    <span
                                                        style="float: right;color: var(--el-text-color-secondary); font-size: 13px;">
                                                        {{ flight.departure }}-{{ flight.arrival }}
                                                    </span>
                                                </el-option>
                                            </el-select>
                                            <!-- <el-input style="width: 80%;" v-model="scope.row[item.prop]"
                              :disabled="!tableStates.flight.editable" :placeholder="setPlaceholderDynamic(item.prop)"
                              @input="handleInput(scope.row, item.prop, $event)" /> -->
                                            <el-input v-else autosize v-model="scope.row[item.prop]"
                                                :disabled="!tableStates.route.editable"
                                                :placeholder="setPlaceholderDynamic(item.prop)"
                                                @input="val => handleInput(scope.row, item.prop, val)"
                                                @blur="handleBlur(scope.row, item.prop)">
                                                <template
                                                    v-if="['entryTime', 'exitTime'].includes(item.prop) && (scope.row[item.prop] === '' || scope.row[item.prop] === undefined)"
                                                    #prefix>ETD+</template>

                                                <!-- <template #prefix>
                                <span class="prefix-cxa">CXA</span>
                              </template> -->
                                            </el-input>
                                        </div>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div style="margin-top: 10px;">

                                <el-button :disabled="tableStates.route.confirmed" @click="addRow('route')">+
                                    添加行</el-button>
                                <el-button :disabled="tableStates.route.confirmed" @click="deleteRow('route')">-
                                    删除行</el-button>
                            </div>
                            <div class="confirm-section" style="margin-top: 10px;">
                                <el-button type="primary" :disabled="tableStates.route.confirmed"
                                    @click="handleConfirm('route')">确认航线数据</el-button>
                                <el-button type="warning" :disabled="!tableStates.route.confirmed"
                                    @click="editTable('route')">修改</el-button>
                            </div>
                        </div>
                        <div v-else class="no-data">不需要航路数据</div>
                    </div>

                    <!-- 机型数据表格 待定 -->
                    <!-- <div class="table-section">
                    <h3>机型需求</h3>
                    <div v-if="countrySelectedData.requireAircraft?.length">
                      <el-table :data="aircraftDataInSelectedCountry">
                        <el-table-column v-for="(item, index) in processedAircraftHeaders" :key="index" :prop="item.prop"
                          :label="item.label">
                          <template #default="scope">
                            <el-input v-model="scope.row[item.prop]" />
                          </template>
                        </el-table-column>
                      </el-table>
                      <div style="margin-top: 10px;">
  
                        <el-button type="primary" :disabled="tableStates.aircraft.confirmed"
                          @click="handleConfirm('aircraft')">确认机型数据</el-button>
                        <el-button type="warning" :disabled="!tableStates.aircraft.confirmed"
                          @click="editTable('aircraft')">修改</el-button>
                      </div>
                    </div>
                    <div v-else class="no-data">不需要指定机型</div>
                  </div> -->
                </div>
                <div style="margin-top: 12px">
                    <el-button @click="last">上一步</el-button>
                    <el-button type="success" :disabled="!allConfirmed" @click="handleFinalSubmit">
                        提交所有数据（{{ allConfirmed ? '可提交' : '需完成所有数据确认' }}）
                    </el-button>
                </div>
                <!-- <div class="final-submit">
                  <el-button type="success" :disabled="!allConfirmed" @click="handleFinalSubmit">
                    提交所有数据（{{ allConfirmed ? '可提交' : '需完成所有数据确认' }}）
                  </el-button>
                </div> -->
            </template>

            <template v-if="activeHandMadeStep == 2">
                <div>
                    <el-tabs type="border-card">
                        <el-tab-pane label="读取现存模板">
                            <el-button @click="initDefaultPath">选择目录</el-button>
                            <el-table :data="filteredFiles" highlight-current-row
                                @row-click="handleFileInComputerSelect">
                                <el-table-column prop="name" label="文件名">
                                    <template #default="{ row }">
                                        <el-icon>
                                            <Document />
                                        </el-icon>
                                        <!-- <el-icon :size="16">
                                  <component :is="row.type === 'file' ? Document : Folder" />
                                </el-icon> -->
                                        {{ row.name }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="type" label="类型" width="100" />
                                <el-table-column fixed="right" label="Operations" min-width="120">
                                    <template #default>
                                        <el-button link type="primary" size="small">
                                            预览
                                        </el-button>
                                        <el-button link type="primary" size="small"
                                            @click="ReadAndReplaceLocalModel">读取并匹配数据</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div class="document-container preview-box-Indeady">
                                <div v-for="(block, index) in contentBlocksInLocalModel" :key="index">
                                    <!-- 非表格内容直接渲染 HTML -->
                                    <div v-if="block.type === 'html'" class="word-content" v-html="block.content"></div>
                                    <!-- 表格内容使用 el-table 组件 -->
                                    <div v-else-if="block.type === 'table'" class="table-wrapper">
                                        <el-table :data="block.data.rows" border stripe
                                            :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
                                            <el-table-column v-for="(header, colIndex) in block.data.headers"
                                                :key="colIndex" :prop="header.key" :label="header.label"
                                                :width="header.width || 'auto'">
                                                <template #default="{ row }">
                                                    <div class="editable-cell"
                                                        :class="{ 'editable-style': row[header.key].isEditable }"
                                                        @click="toggleEdit(row, header.key)"
                                                        :rowspan="row[header.key]?.rowspan"
                                                        :colspan="row[header.key]?.colspan">
                                                        <!-- 文本显示模式 -->
                                                        <span v-if="!row[header.key].isEditing">
                                                            {{ row[header.key]?.value }}
                                                        </span>

                                                        <!-- 输入框编辑模式 -->
                                                        <el-input v-else v-model="row[header.key].value" size="small"
                                                            @click.stop :ref="(el) => (inputRefs[row.id] = el)"
                                                            @blur="row[header.key].isEditing = false"
                                                            @keyup.enter="row[header.key].isEditing = false">
                                                        </el-input>
                                                    </div>
                                                </template>
                                            </el-table-column>
                                        </el-table>

                                    </div>
                                </div>
                            </div>
                            <div>
                                <el-footer>
                                    <el-button :data-downLoad="contentBlocks.value"
                                        @click="downloadAsWord">下载</el-button>
                                </el-footer>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="上传新模版">
                            <div class="docx-processor-container">
                                <!-- 文件上传区域 -->
                                <el-upload class="upload-demo" drag :auto-upload="false"
                                    :on-change="handleModelFileUploadInReady" accept=".docx,.doc" :show-file-list="true"
                                    :limit="1" :on-exceed="handleExceedInReady">
                                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>

                                    <div class="el-upload__text">
                                        将Word文档拖到此处或 <em>点击上传</em><br>
                                        <small class="el-upload__tip">支持格式：.doc/.docx（最大50MB）</small>
                                    </div>
                                </el-upload>

                                <div class="document-container preview-box-Indeady">
                                    <div v-for="(block, index) in contentBlocks" :key="index">
                                        <!-- 非表格内容直接渲染 HTML -->
                                        <div v-if="block.type === 'html'" class="word-content" v-html="block.content">
                                        </div>
                                        <!-- 表格内容使用 el-table 组件 -->
                                        <div v-else-if="block.type === 'table'" class="table-wrapper">
                                            <el-table :data="block.data.rows" border stripe
                                                :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
                                                <el-table-column v-for="(header, colIndex) in block.data.headers"
                                                    :key="colIndex" :prop="header.key" :label="header.label"
                                                    :width="header.width || 'auto'">
                                                    <template #default="{ row }">
                                                        <div class="editable-cell"
                                                            :class="{ 'editable-style': row[header.key].isEditable }"
                                                            @click="toggleEdit(row, header.key)"
                                                            :rowspan="row[header.key]?.rowspan"
                                                            :colspan="row[header.key]?.colspan">
                                                            <!-- 文本显示模式 -->
                                                            <span v-if="!row[header.key].isEditing">
                                                                {{ row[header.key]?.value }}
                                                            </span>

                                                            <!-- 输入框编辑模式 -->
                                                            <el-input v-else v-model="row[header.key].value"
                                                                size="small" @click.stop
                                                                :ref="(el) => (inputRefs[row.id] = el)"
                                                                @blur="row[header.key].isEditing = false"
                                                                @keyup.enter="row[header.key].isEditing = false" />
                                                        </div>
                                                    </template>
                                                </el-table-column>
                                            </el-table>

                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <el-footer>
                                        <el-button :data-downLoad="contentBlocks.value"
                                            @click="downloadAsWord">下载</el-button>
                                    </el-footer>
                                </div>

                            </div>

                        </el-tab-pane>
                    </el-tabs>
                    <el-button style="margin-top: 12px" @click="last">上一步</el-button>
                    <!-- <el-button style="margin-top: 12px" @click="next">下一步</el-button> -->
                </div>
            </template>

        </div>

        <!-- 数据上传区 -->
        <!-- <div class="upload-group">
  
  
        <el-upload class="upload-card" action="#" :auto-upload="false" :on-change="handleFlightUpload"
          accept=".xlsx,.xls">
          <template #trigger>
            <el-button type="success" size="large">
              <el-icon class="upload-icon">
                <Upload />
              </el-icon>
              第一步：上传航班数据
            </el-button>
          </template>
          <div class="upload-tip">支持格式：Excel（必须包含时间信息）</div>
        </el-upload>
  
        <el-upload class="upload-card" action="#" :auto-upload="false" :on-change="handleRouteUpload" accept=".xlsx,.xls">
          <template #trigger>
            <el-button type="primary" size="large">
              <el-icon class="upload-icon">
                <Upload />
              </el-icon>
              第二步：上传航线数据
            </el-button>
          </template>
          <div class="upload-tip">支持格式：Excel（必须包含航线信息）</div>
        </el-upload>
      </div> -->

        <!-- 数据展示区  data="processedFlights"-->
       

    </div>
</template>

<script setup>
import { ref, computed, reactive, toRaw, watch, defineProps, nextTick, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { ElMessage, ElLoading, ElTable, ElTableColumn } from 'element-plus'
import { Upload, Right, Warning } from '@element-plus/icons-vue'
import dayjs from 'dayjs';
import Docxtemplater from 'docxtemplater'
import JSZip from 'jszip'
import PizZip from 'pizzip'
import { saveAs } from 'file-saver'
import * as mammoth from 'mammoth'
import ImageModule from 'docxtemplater-image-module-free';
import { debounce } from 'lodash-es'
import _ from 'lodash';
import DOMPurify from 'dompurify'
// import { debounce } from 'lodash-es';
//处理申请件制作代码
const flightOptions = ref([
    { number: 'CA1234', route: 'PEK-SHA', departureTime: '08:00', landingTime: '10:30', departureL: 'ZSAM', arrival: 'YSSY' },
    { number: 'MU5678', route: 'SHA-CAN', departureTime: '12:30', landingTime: '15:00', departureL: 'ZSAM', arrival: 'YSSY' },
    { number: 'CZ9012', route: 'CAN-SZX', departureTime: '16:00', landingTime: '17:30', departureL: 'ZSAM', arrival: 'YSSY' }
])

// 字段映射
const fieldMapping = {
    flightNumber: '航班号',
    flightRoute: '航线',
    departureTime: '起飞时间',
    arrivalTime: '到达时间'
}

const segmentValue = ref('默认模版')
const segmentOptions = ['默认模版', '使用新模版']
// const handleCountrySelect = (flightNumber) => {
//   const selected = flightOptions.value.find(f => f.number === flightNumber)
//   if (selected) {
//     formData.flightRoute = selected.route
//     formData.departureTime = selected.departure
//     formData.arrivalTime = selected.arrival
//   }
// }

// 响应式状态
const templateReady = ref(false)
const generating = ref(false)
const templateFields = ref([])
const previewContent = ref('')
const uploadError = ref('')
const showOriginal = ref(false)
const formData = reactive({})
const mergedRoutes = ref([])

let templateZip = null
let originalXml = ''
// 计算属性
const readyCount = computed(() =>
    Object.values(formData).filter(v => v?.trim().length > 0).length
)

const canGenerate = computed(() =>
    templateReady.value &&
    readyCount.value === templateFields.value.length &&
    !generating.value
)

const safePreviewContent = computed(() =>
    DOMPurify.sanitize(previewContent.value, {
        ALLOWED_TAGS: ['p', 'span', 'var'],
        ALLOWED_ATTR: ['class', 'data-field']
    })
)
//************已上传数据的模板处理***********START************
const rawHtml = ref('')
const tablesData = ref([])
const previewVisible = ref(false)
const processedHtml = ref('');
const processedContent = ref('');
// 配置表格转换参数
const tableStyleMapping = {
    "table": "word-table",
    "table[class=*]": "table-bordered",
    "table[style*='border']": "table-bordered",
    "td[width]": "width:{{width}}"
};

const convertOptions = {
    styleMap: [
        "table[class=WordTable] => table.custom-word-table", // 保留Word原生表格样式
        "td[valign=center] => td.align-middle", // 单元格垂直居中
        "tr[height] => tr.row-height", // 保留行高设置
        "table => table:remove:width" // 清除固定宽度
    ],
    transformDocument: {
        preserveColumnMerge: true, // 保留列合并
        preserveRowMerge: true // 保留行合并
    }
}

const inputRefs = ref({});

//debounce添加防抖
const toggleEdit = debounce((row, key) => {
    if (row[key].isEditable) { // 仅允许标记为可编辑的单元格切换
        row[key].isEditing = !row[key].isEditing;
        // row[key].isEditing = !row[key].isEditing;
        nextTick(() => {
            inputRefs.value[row.id]?.focus(); // 通过唯一标识获取实例‌:ml-citation{ref="6,7" data="citationList"}
        });
    }
    // 自动聚焦输入框
    // if (row[key].isEditing) {
    //   nextTick(() => {
    //     inputRef.value?.focus(); // [!code ++] // 直接通过 ref 操作
    //   });
    // }
}, 200);
// const applyModleFile = ref('默认文档')
// const applyModleFileOptions = [
//   '默认文档',
//   '上传文档',
// ]
// 默认路径配置（示例为相对路径）
const defaultPath = '/Users/zhengyutao/myProject/worktoolNew/public/applyModle';  // 根据实际需求调整路径逻辑‌:ml-citation{ref="5" data="citationList"}
let currentDirHandle;
const filteredFiles = ref([]);
// 通过浏览器 API 获取目录句柄（需用户授权）
async function initDefaultPath() {
    if (!window.showDirectoryPicker) {
        console.error('浏览器不支持 File System Access API');
        return;
    }
    try {
        // 弹出目录选择框（startIn 只是建议路径，浏览器可能忽略）
        currentDirHandle = await window.showDirectoryPicker({ startIn: 'documents' });
        await loadFiles(currentDirHandle);
        console.log('读取文件列表', currentDirHandle)
    } catch (error) {
        console.error('路径访问失败:', error);
        ElMessage.error(`目录访问失败: ${error.message}`); // 使用 ElementPlus 提示
    }
}
// 加载并过滤文件
async function loadFiles(dirHandle) {
    filteredFiles.value = []; // 清空旧数据
    const keyword = currentCountry.value; // 获取当前过滤词
    console.log('keyword', keyword)
    console.log('dirHandle', dirHandle)
    try {
        for await (const entry of dirHandle.values()) {
            if (entry.name.includes(keyword)) { //  正确过滤
                console.log('entry', entry)
                filteredFiles.value.push({
                    name: entry.name,
                    type: entry.kind === 'file' ? 'file' : 'directory',
                    path: entry.webkitRelativePath || entry.name
                });
            }
        }
        console.log('过滤后的文件列表:', filteredFiles.value);
        ElMessage.success(`读取${filteredFiles.value.length}个文件`)
    } catch (error) {
        console.error('文件加载失败:', error);
        ElMessage.error('文件读取失败，请检查权限');
    }
}
const localModelSelect = ref({})
//选中文件
const handleFileInComputerSelect = async (fileData) => {
    try {
        console.log('fileData', fileData)
        if (fileData.type !== 'file') return;  // 仅处理文件类型

        const fileHandle = await currentDirHandle.getFileHandle(fileData.name);
        console.log('fileHandle', fileHandle)
        localModelSelect.value = await fileHandle.getFile();
        console.log('选择的文件', localModelSelect)
        // 读取文件内容（示例为 Excel 解析）
        // if (file.name.endsWith('.xlsx')) {
        //   const reader = new FileReader();
        //   reader.onload = (e) => {
        //     const workbook = read(e.target.result, { type: 'array' });
        //     const data = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames]);
        //     console.log('解析数据:', data);
        //   };
        //   reader.readAsArrayBuffer(file);
        // }
    } catch (error) {
        ElMessage.error(`文件读取失败: ${error.message}`);
    }
};
//读取文件
const contentBlocksInLocalModel = ref([])
const ReadAndReplaceLocalModel = async () => {
    console.log('localModelSelect', localModelSelect)
    const file = localModelSelect.value
    const mammoth = await import('mammoth');
    if (!file) return;
    try {
        // 文件校验
        if (!validateFile(file)) return
        // 转换Word文档
        const arrayBuffer = await readFileInReady(file)
        console.log('arrayBuffer', arrayBuffer)
        const { value: html } = await mammoth.convertToHtml(
            { arrayBuffer },
            getConvertOptions()
        )
        console.log('value: html', mammoth.convertToHtml(
            { arrayBuffer },
            getConvertOptions()
        ))
        console.log('html', html)
        //提取非表格数据
        const fontFamilyNeed = fontFamilyInWord(html)
        console.log('字体', fontFamilyNeed)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        let currentHtml = '';
        console.log('doc', doc)
        doc.body.childNodes.forEach(node => {
            if (node.nodeName.toLowerCase() === 'table') {
                // 遇到表格，先保存之前的非表格内容
                if (currentHtml) {
                    contentBlocksInLocalModel.value.push({ type: 'html', content: currentHtml });
                    currentHtml = '';
                }
                const tableData = extractTableData(node);
                contentBlocksInLocalModel.value.push({ type: 'table', data: tableData });
            } else {
                // 非表格内容，累积 HTML
                const div = document.createElement('div');
                div.appendChild(node.cloneNode(true));
                currentHtml += div.innerHTML;
            }
        });
        if (currentHtml) {
            contentBlocksInLocalModel.value.push({ type: 'html', content: currentHtml });
        }
        console.log('执行替换前的replaceModel', replaceDynamicFields(contentBlocksInLocalModel.value))
        contentBlocksInLocalModel.value = replaceDynamicFields(contentBlocksInLocalModel.value)
        console.log('执行替换后的replaceModel', contentBlocksInLocalModel.value)
        // 存储原始HTML
        rawHtml.value = html
        console.log('tablesData', tablesData.value)

        ElMessage.success('文档处理成功')
    } catch (error) {
        handleErrorInReady(error, file)
    }

}
const supportedFormats = ['.xlsx', '.xls', '.docx'];
const maxSizeMB = 50;
const contentBlocks = ref([])
const handleModelFileUploadInReady = async (file) => {
    const mammoth = await import('mammoth');
    if (!file) return;
    try {
        // 文件校验
        if (!validateFile(file)) return
        console.log('file', file)
        // 转换Word文档
        const arrayBuffer = await readFileInReady(file.raw)
        console.log('arrayBuffer', arrayBuffer)
        const { value: html } = await mammoth.convertToHtml(
            { arrayBuffer },
            getConvertOptions()
        )
        console.log('value: html', mammoth.convertToHtml(
            { arrayBuffer },
            getConvertOptions()
        ))
        console.log('html', html)
        //提取非表格数据
        const fontFamilyNeed = fontFamilyInWord(html)
        console.log('字体', fontFamilyNeed)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // const contentBlocks = [];
        let currentHtml = '';
        console.log('doc', doc)
        doc.body.childNodes.forEach(node => {
            if (node.nodeName.toLowerCase() === 'table') {
                // 遇到表格，先保存之前的非表格内容
                if (currentHtml) {
                    contentBlocks.value.push({ type: 'html', content: currentHtml });
                    currentHtml = '';
                }
                console.log('nodeInTable', node)
                // console.log('nodeInTable',node.table)
                // console.log('nodeInTable.tbody',node[tbody])
                // 提取表格数据
                const tableData = extractTableData(node);
                console.log('tableDataSperate', tableData)
                contentBlocks.value.push({ type: 'table', data: tableData });
            } else {
                // 非表格内容，累积 HTML
                const div = document.createElement('div');
                div.appendChild(node.cloneNode(true));
                currentHtml += div.innerHTML;
            }
        });
        if (currentHtml) {
            contentBlocks.value.push({ type: 'html', content: currentHtml });
        }
        console.log('替换前contentBlocks', contentBlocks.value)
        // console.log('新方法替换', replaceDynamicFieldsTest(contentBlocks.value))
        console.log('执行替换replaceModel', replaceDynamicFields(contentBlocks.value))
        // const type = 'byUpload'
        contentBlocks.value = replaceDynamicFields(contentBlocks.value)
        // console.log('contentBlocksAfter', contentBlocks)
        console.log('执行替换replaceModel', contentBlocks.value)

        // 存储原始HTML
        rawHtml.value = html
        // console.log('rawHtml', rawHtml.value)
        // const replaceModel= replaceDynamicFields(rawHtml)

        // 解析表格数据
        // tablesData.value = parseTablesFromHTML(rawHtml.value)
        // tablesData.value = parseTablesFromHTML(html)
        console.log('tablesData', tablesData.value)

        ElMessage.success('文档处理成功')
    } catch (error) {
        handleErrorInReady(error, file)
    }
}
function extractTableData(tableElement) {
    // 获取所有行（兼容DOM标准API）
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    console.log('rows', rows)
    if (rows.length === 0) return { headers: [], rows: [] };

    // 处理表头（假设第一行为表头）
    // const headerCells = Array.from(rows.querySelectorAll('td, th'));
    const headers = Array.from(rows[0].cells).map((cell, index) => ({
        key: `col_${index}`,
        label: processTdContent(cell.innerHTML), // 处理带<p>的复杂内容
        width: cell.getAttribute('width') || undefined,
        originalIndex: index
    }));

    // 处理数据行（支持rowspan/colspan）
    const dataRows = [];
    const rowspanTracker = {}; // 记录跨行单元格 { [column]: { value, remaining, colspan } }

    rows.slice(1).forEach((row, rowIndex) => {
        const rowData = {};
        let colPointer = 0;

        // 初始化空数据
        headers.forEach(header => {
            rowData[header.key] = {
                value: '',
                rowspan: 1,
                colspan: 1
            };
        });

        // 处理实际单元格
        Array.from(row.querySelectorAll('td, th')).forEach(cell => {
            // 跳过被跨行占用的列
            while (rowspanTracker[colPointer]?.remaining > 0) {
                rowData[headers[colPointer].key] = {
                    value: rowspanTracker[colPointer].value,
                    rowspan: rowspanTracker[colPointer].remaining,
                    colspan: rowspanTracker[colPointer].colspan
                };
                colPointer++;
            }

            // 获取单元格属性
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
            const cellValue = processTdContent(cell.innerHTML);

            // 记录跨行信息
            if (rowspan > 1) {
                rowspanTracker[colPointer] = {
                    value: cellValue,
                    remaining: rowspan - 1,
                    colspan: colspan
                };
            }

            // 写入主单元格
            rowData[headers[colPointer].key] = {
                value: cellValue,
                rowspan: rowspan,
                colspan: colspan
            };

            // 处理跨列
            for (let i = 1; i < colspan; i++) {
                const nextCol = colPointer + i;
                rowData[headers[nextCol].key] = {
                    value: colspan > 1 ? cellValue : '',
                    colspan: 0, // 标记为被合并
                    rowspan: 0
                };
            }

            colPointer += colspan;
        });

        // 更新跨行追踪器
        Object.keys(rowspanTracker).forEach(col => {
            if (rowspanTracker[col].remaining > 0) {
                rowspanTracker[col].remaining--;
                if (rowspanTracker[col].remaining === 0) {
                    delete rowspanTracker[col];
                }
            }
        });

        dataRows.push(rowData);
    });

    return {
        headers: headers.map(h => ({ key: h.key, label: h.label, width: h.width })),
        rows: dataRows
    };
}

// 文件校验逻辑
const validateFile = (file) => {
    console.log('校验的文件', file)
    // console.log('file', file.raw)
    // console.log('file', file.type)
    // console.log('proto',file.Prototype)
    // console.log('测试type', file.raw === 'undefined' ? file.type : file.raw.type)
    const getFileType = (file) => {
        // 优先检查是否存在 raw 嵌套结构
        if (file.raw && typeof file.raw === 'object') {
            return file.raw.type || ''; // 返回 raw.type 或空字符串
        }
        return file.type || ''; // 直接返回文件类型
    };
    const fileType = getFileType(file)
    console.log('fileType', fileType)

    const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    const maxSizeMB = 50

    if (!validTypes.includes(fileType)) {
        ElMessage.error('不支持的文件类型')
        return false
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
        ElMessage.error(`文件大小超过${maxSizeMB}MB限制`)
        return false
    }

    return true
}
//标记特殊上下标
const superscriptMap = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
};
const processTdContent = (tdHtml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(tdHtml, 'text/html');
    const pElements = doc.querySelectorAll('p');

    // 防御性检查：确保至少有一个 <p>
    if (pElements.length === 0) return '';
    return Array.from(pElements).map(p => {
        // 递归处理 <p> 内的所有节点（文本、元素）
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName.toLowerCase() === 'sup') {
                    // 将 <sup> 内容转换为上标字符
                    return Array.from(node.textContent).map(c => superscriptMap[c] || c).join('');
                } else {
                    // 处理其他子元素（如 <span>、<em>）
                    return Array.from(node.childNodes).map(processNode).join('');
                }
            }
            return '';
        };

        return Array.from(p.childNodes).map(processNode).join('');
    }).join(' ');
    // return Array.from(pElements)
    //   .map(p => p.textContent.trim())
    //   .join(pElements.length > 1 ? ' ' : '');
};
//下载方法
const downloadAsWord = () => {
    // 深度处理数据结构
    // const blocks=toRaw(contentBlocks.value)
    const generateFullHTML = () => {
        try {
            // 添加数据源检查
            const rawData = toRaw(contentBlocks.value)
            console.log('原始数据验证:', JSON.parse(JSON.stringify(rawData)))

            return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              table { margin: 20px 0; }
              ol { padding-left: 30px; }
              strong { color: #303133; }
            </style>
          </head>
          <body>
            ${processContentBlocks(toRaw(contentBlocks.value))}
          </body>
        </html> `
        } catch (error) {
            console.error('HTML生成失败:', error)
            return '<p>文档生成错误，请联系管理员</p>'
        }
    }

    const processContentBlocks = (blocks) => {
        // const blocks=toRaw(contentBlocks.value)
        console.log('blocks', blocks)
        console.log('blocks[2]', blocks[2])

        const safeBlocks = Array.isArray(blocks) ? blocks : []
        console.log('safeBlocks', safeBlocks)
        return blocks.map(block => {
            console.log('block', block)
            if (!block?.type) {
                console.error(`[数据块异常] 索引 ${blockIndex}`, block);
                return ''; // 跳过无效数据块‌:ml-citation{ref="3" data="citationList"}
            }
            // 处理HTML类型
            if (block.type === 'html') {
                return `
            <!-- HTML Block -->
            ${block.content}
          `
            }
            // 处理表格类型
            if (block.type === 'table') {
                const tableData = block.data || {};
                const headers = Array.isArray(tableData.headers) ? tableData.headers : [];
                const rows = Array.isArray(tableData.rows) ? tableData.rows : [];

                // 动态生成表头
                const headerHTML = headers.map(header =>
                    `<th>${header.label || 'Unknown Column'}</th>`
                ).join('');

                // 动态生成数据行
                const bodyHTML = rows.map(row => {
                    // 按表头顺序获取单元格数据
                    const cells = headers.map(header => {
                        const cellValue = row[header.key]?.value ?? 'N/A'; // 深度空值保护
                        return `<td>${cellValue}</td>`;
                    }).join('');

                    return `<tr>${cells}</tr>`;
                }).join('');
                return `
      <table>
        <thead><tr>${headerHTML}</tr></thead>
        <tbody>${bodyHTML}</tbody>
      </table>
    `;

            }
            return ''
        }).join('')
    }

    // 生成完整HTML结构


    try {
        // 创建并下载文档
        const fullHTML = generateFullHTML()
        const blob = new Blob([fullHTML], { type: "application/msword" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = `Flight_Application_${currentCountry.value}.doc`
        document.body.appendChild(link)
        link.click()

        // 清理资源
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error('文档生成失败:', error)
    }
}

// 表格解析核心方法
const parseTablesFromHTML = (html) => {
    console.log('parseTablesFromHTML', html)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    console.log('doc', doc)
    console.log(' doc.querySelectorAll', doc.querySelectorAll('table'))
    return Array.from(doc.querySelectorAll('table')).map(table => {
        console.log('tableInParseTablesFromHTML', table)
        const headerRow = table.rows; // 明确获取第一行
        console.log('headerRow', headerRow[0])
        console.log('headerRow', headerRow.cells)

        console.log('doc', doc.querySelectorAll('table'))
        const headers = Array.from(headerRow[0].cells).map((cell, index) => ({
            key: `col_${index}`,
            label: processTdContent(cell.outerHTML),
            width: cell.getAttribute('width') || undefined
        }));
        console.log('headers', headers)
        const rows = Array.from(table.rows).slice(1).map(row => {
            return headers.reduce((obj, header, colIndex) => {
                const cell = row.cells[colIndex]
                obj[header.key] = {
                    value: cell?.innerText.trim() || '',
                    rowspan: cell?.rowSpan || 1,
                    colspan: cell?.colSpan || 1
                }
                return obj
            }, {})
        })
        console.log('rows', rows)
        return { headers, rows }
    })
}

// Mammoth转换配置
const getConvertOptions = () => ({
    styleMap: [
        'table[class=WordTable] => table.custom-word-table',
        'td[valign=center] => td.align-middle',
        'tr[height] => tr.row-height[data-height]', // 保留原始高度值
        'td[width] => td[data-width]', // 记录单元格宽度
        'p[style*="font-family"] => p[data-font-family]', // 提取字体信息
        'table[border] => table[data-border]', // 保留表格边框属性
        'td[rowspan] => td[data-rowspan]', // 捕获合并单元格属性
        'td[colspan] => td[data-colspan]',
        'tr[height] => tr.row-height',
        'table => table:remove:width'
    ],
    // transformDocument 配置需要调整为顶层选项
    includeEmbeddedStyleMap: true,
    includeDefaultStyleMap: false,
    convertImage: true,

})

// 错误处理
const handleErrorInReady = (error, file) => {
    console.error('文档处理错误:', {
        error: error.stack,
        errorMessages: error.message,
        fileInfo: {
            name: file?.name,
            type: file?.type,
            size: file?.size
        }
    })
    ElMessage.error(`处理失败: ${error.message}`)
}
const fontFamilyInWord = (html) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return doc.querySelectorAll('p[data-font-family]').forEach(p => {
        const font = p.getAttribute('data-font-family').replace(/"/g, '');
        p.style.fontFamily = font;
    });
}

// 文件读取工具
const readFileInReady = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
    })
};

// 字段替换逻辑
const replaceDynamicFields = (content) => {
    console.log('传入替换测试方法的content', content)
    const blocks = toRaw(content);
    const dataSourceType = currentModelMode.value
    // console.log('dataSourceType', dataSourceType)
    console.log('dataSourceType', dataSourceType)

    const flightData = dataSourceType != 'handMade' ? FlightDataInThisCountry.value.map(data => ({ ...toRaw(data) })) : flightDataInThisCountryByHand.value.map(data => ({ ...toRaw(data) }));
    const routeData = dataSourceType != 'handMade' ? FlightRouteInThisCountry.value.map(data => ({ ...toRaw(data) })) : routeDataInThisCountryByHand.value.map(data => ({ ...toRaw(data) }));
    const combinedData = [                   // 带类型标识的合并数组
        ...flightData.map(item => ({ type: 'flight', data: item })),
        ...routeData.map(item => ({ type: 'route', data: item }))
    ]
    console.log('flightData', flightData)
    console.log('routeData', routeData)

    return blocks.map(block => {
        // 处理HTML块
        if (block.type === 'html') {
            return processHtmlBlockTest(block, combinedData);
        }
        // 处理表格块
        if (block.type === 'table') {
            const tableData = toRaw(block.data)
            const isFlightTable = tableData.headers.some(header => header.label === 'Departure Airport');
            console.log('isFlightTable', isFlightTable)

            return processTableBlockTest(block, isFlightTable ? flightData : routeData);
        }
        return block;
    });
};

// HTML块处理逻辑
const processHtmlBlockTest = (block, combinedData) => {
    let content = block.content;

    // 简单字段替换
    combinedData.forEach(data => {
        content = content.replace(/\{\{(\w+)\}\}/g, (_, key) =>
            data[key]?.toString() || ''
        );
    });

    // 处理特殊标记
    content = content.replace(/<a id="[^"]+"><\/a>/g, ''); // 清除Word锚点

    return { ...block, content };
};

// 表格块处理逻辑
const processTableBlockTest = (block, data) => {
    // 获取原始表格结构
    const tableData = toRaw(block.data);

    // 正确获取行数据数组
    const originalRows = Array.isArray(tableData.rows) ? tableData.rows : [];
    // 构造最终数据结构
    const newData = {
        headers: [...tableData.headers], // 保留原始表头‌:ml-citation{ref="1,6" data="citationList"}
        rows: [] // 新建动态行数组
    };
    const formatTimeInTable = (dateStr) => {
        const date = new Date(dateStr.replace('GMT+0800', '')); // 移除时区标识‌:ml-citation{ref="1" data="citationList"}
        const HH = String(date.getUTCHours()).padStart(2, '0')
        const MM = String(date.getUTCMinutes()).padStart(2, '0')
        console.log('获得utc时间', String(date.getUTCHours()).padStart(2, '0'))
        return `${HH}${MM}`

        // return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); // 输出 "22:15"

    };
    // 查找第一个非模板行作为插入起点
    let insertIndex = originalRows.findIndex(row =>
        !Object.values(row).some(cell =>
            typeof cell.value === 'string' && cell.value.includes('{{')
        )
    );
    console.log('insertIndex', insertIndex)
    // 默认从末尾开始插入（若未找到非模板行）
    if (insertIndex === -1) insertIndex = originalRows.length;

    // 生成需要插入的新行模板
    const templateRows = originalRows.filter(row =>
        Object.values(row).some(cell =>
            typeof cell.value === 'string' && cell.value.includes('{{')
        )
    );

    // 创建动态行数组（保留原有非模板行）
    const processedRows = [...originalRows.slice(0, insertIndex)];
    const FinalRows = []
    // 填充数据行
    data.forEach((dataItem, dataIndex) => {
        const targetRow = templateRows[dataIndex % templateRows.length];
        if (!targetRow) return;

        // 深度克隆模板行避免引用污染
        const newRow = JSON.parse(JSON.stringify(targetRow));

        // 执行模板替换
        Object.keys(newRow).forEach(colKey => {
            const cell = newRow[colKey];
            const isDynamicField = cell.value.includes('{{');

            if (typeof cell.value === 'string') {
                cell.value = cell.value.replace(/\{\{(\w+)\}\}/g, (_, key) =>
                    dataItem[key] || ''

                );
                const isTimeCell = /^\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT\+\d{4}/.test(cell.value);
                if (isTimeCell) {
                    cell.value = formatTimeInTable(cell.value)
                }
                cell.isTimeCell = isTimeCell//时间空格
                cell.isEditable = isDynamicField; // 动态字段可编辑
                cell.isEditing = false; // 初始非编辑状态
            }
        });
        newData.rows.push(newRow);
        FinalRows.push(newRow);
    });

    // 保留原始非模板行的后续内容
    if (insertIndex < originalRows.length) {
        processedRows.push(...originalRows.slice(insertIndex));
    }

    // 应用行合并逻辑
    if (FinalRows.length > 1) {
        Object.keys(newData).forEach(colKey => {
            newData[colKey].rowspan = FinalRows.length;
        });
    }
    console.log('newData', newData)
    console.log(' { ...block, data: newData };', { ...block, data: newData })
    return { ...block, data: newData };
};

// 调整行合并参数
const adjustRowspan = (row, requiredRows) => {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
            if (typeof value === 'string' && value.includes('rowspan')) {
                return [key, value.replace(/rowspan="\d+"/, `rowspan="${requiredRows}"`)];
            }
            return [key, value];
        })
    );
};



// Excel单元格处理
const replaceFieldInCell = (cellValue) => {
    if (typeof cellValue === 'string') {
        return cellValue.replace(/\{\{(.+?)\}\}/g, (_, key) => {
            const data = [...FlightData, ...FlightRoute].find(d => d[key]);
            return data?.[key] || '';
        });
    }
    return cellValue;
};

// 特殊值格式化
const formatSpecialValue = (value) => {
    if (value instanceof Date) {
        return value.toISOString().replace('T', ' ').substring(0, 19);
    }
    return value;
};

//***************已上传的数据处理部分***END***************

//***************手工制作文件***************STAR***************
const currentModelMode = ref({})
const activeHandMadeStep = ref(0)
const next = () => {
    if (activeHandMadeStep.value++ > 2) activeHandMadeStep.value = 0
}
const last = () => {
    if (activeHandMadeStep.value-- < 0) activeHandMadeStep.value = 0
}

const handleFinalSubmit = () => {
    if (activeHandMadeStep.value++ > 2) activeHandMadeStep.value = 0
    // flightDataInThisCountryByHand
    currentModelMode.value = 'handMade'

}
const contrySelectInHandMade = ref({})
const countryList = [{
    id: 0,
    code: "CN",
    name: "中国",
    requireFlightData: ["{{flightNumber}}", "{{departure}}", "{{departureTime}}", "{{arrival}}", "{{landingTime}}"],
    requireAircraft: ["B737", "B787", "B789"],
    requireRouteData: ["{{关联的航班}}", "{{code}}", "{{entryPoint}}", "{{entryTime}}", "{{ATSroute}}", "{{exitPoint}}", "{{exitTime}}"]
}, {
    id: 1,
    code: "RU",
    name: "俄罗斯",
    requireFlightData: ["{{flightNumber}}", "{{departure}}", "{{departureTime}}", "{{arrival}}", "{{landingTime}}"],
    requireAircraft: ["B737", "B787", "B789"],

    requireRouteData: ["{{code}}", "{{entryPoint}}", "{{entryTime}}", "{{ATSroute}}", "{{exitPoint}}", "{{exitTime}}"]
}, {
    id: 2,
    code: "IND",
    name: "印度尼西亚",
    requireFlightData: ["{{flightNumber}}", "{{departure}}", "{{departureTime}}", "{{arrival}}", "{{landingTime}}"],
    requireAircraft: ["B737", "B787", "B789"],
    requireRouteData: []
}
]
//选中国家的匹配数据****不能删除***
const countrySelectedData = ref(null)
//选中的国家名
const selectedCountryName = ref('')
const flightDataInSelectedCountry = ref([{}])
const routeDataInSelectedCountry = ref([{}])
const aircraftDataInSelectedCountry = ref([{}])
const handleCountryChange = (countryName) => {
    // 1. 获取国家数据
    const country = countryList.find(c => c.name === countryName)
    countrySelectedData.value = country
    // 2. 初始化数据结构
    initDataStructures(country)
}
const initDataStructures = (country) => {
    console.log('initDataStructures的country', country)
    flightDataInSelectedCountry.value = [createDataRow(country.requireFlightData)]
    routeDataInSelectedCountry.value = [createDataRow(country.requireRouteData)]
    aircraftDataInSelectedCountry.value = [createDataRow(country.requireAircraft)]
    console.log('flightDataInSelectedCountry', flightDataInSelectedCountry)
}
// 处理表头格式
const processHeaders = (arr) => {
    return arr.map(item => ({
        prop: item.replace(/{{|}}/g, ''),
        label: item.replace(/{{|}}/g, '').toUpperCase()
    }))
}

// 计算属性生成处理后的表头
const processedFlightHeaders = computed(() =>
    processHeaders(countrySelectedData.value?.requireFlightData || [])
)

const processedRouteHeaders = computed(() =>
    processHeaders(countrySelectedData.value?.requireRouteData || [])
)

const processedAircraftHeaders = computed(() =>
    processHeaders(countrySelectedData.value?.requireAircraft || [])
)
// 创建数据行
const createDataRow = (fields) => {
    console.log('createDataRow', fields)
    return fields.reduce((obj, field) => {
        const key = field.replace(/{{|}}/g, '')
        obj[key] = ''
        return obj
    }, {})
}
const addRow = (type) => {
    if (!countrySelectedData.value) return

    let fields = []
    let targetData = []

    switch (type) {
        case 'flight':
            fields = countrySelectedData.value.requireFlightData
            targetData = flightDataInSelectedCountry.value
            console.log('flightDataInSelectedCountry', flightDataInSelectedCountry)
            break
        case 'route':
            fields = countrySelectedData.value.requireRouteData
            targetData = routeDataInSelectedCountry.value
            break
        case 'aircraft':
            fields = countrySelectedData.value.requireAircraft
            targetData = aircraftDataInSelectedCountry.value
            break
    }

    if (fields?.length) {
        targetData.push(createDataRow(fields))
    }
}
const deleteRow = (type, index) => {
    switch (type) {
        case 'flight':
            flightDataInSelectedCountry.value.splice(-1, 1)
            break
        case 'route':
            routeDataInSelectedCountry.value.splice(-1, 1)
        // 其他类型处理...
    }
}
//自动填充
// 机场数据源（示例）
const airports = [
    { value: 'ZSAM', name: '厦门高崎国际机场' },
    { value: 'YSSY', name: '悉尼金斯福德国际机场' },
    { value: 'YMML', name: '墨尔本国际机场' }
]

// 防抖处理（避免频繁请求）
const debounceSearch = _.debounce((query, callback) => {
    const results = airports.filter(item =>
        item.value.toLowerCase().includes(query.toLowerCase()) ||
        item.name.includes(query)
    )
    callback(results)
}, 300)

// 异步查询方法
const querySearchAsync = (queryString, callback) => {
    if (!queryString) {
        callback([])
        return
    }
    debounceSearch(queryString, callback)
}
// 禁用非0/5结尾的分钟数
const disabledMinutes = () => {
    return Array.from({ length: 60 }, (_, i) => i)
        .filter(v => v % 5 !== 0); // 生成非5倍数的禁用数组‌:ml-citation{ref="1,3" data="citationList"}
};

// 禁用所有秒选择（隐藏秒选择器）
const disabledAllSeconds = () => {
    return Array.from({ length: 60 }, (_, i) => i); // 全部秒数禁用‌:ml-citation{ref="3,6" data="citationList"}
};

// const handleSelect = (item) => {
//   // 可在此处补充关联操作（如自动填充机场名称）
//   console.log('选中机场:', item.value)
// }
//处理input校验规则
const validationRules = {
    flightNumber: (value) => {
        const cleaned = value.replace(/[^A-Za-z\d]/g, '').toUpperCase();
        return cleaned;
    },
    validateFlightNumber: (value) => {
        if (!/^CXA\d{3,}$/.test(value)) {
            ElMessage.error('格式要求：CXA开头+至少3位数字（如CXA123）');
            return ''; // 自动清空
        }
        return value;
    },
    entryPoint: (value) => value.replace(/[^A-Za-z]/g, '').substr(0, 5).toUpperCase(),     // 限制五位数大写
    exitPoint: (value) => value.replace(/[^A-Za-z]/g, '').substr(0, 5).toUpperCase(),// 机型编码限制
    ATSroute: (value) => value.replace(/[^A-Za-z ]/g, '').toUpperCase().replace(/\s+/g, ' '),// 航路走向
    code: (value, departures, arrivals) => {
        const pattern = /^[A-Z]{4}-[A-Z]{4}$/;
        if (!pattern.test(value)) {
            ElMessage.error('编码格式要求：AAAA-BBBB（大写字母）');
            return '';
        }

        const [departure, arrival] = value.split('-');
        if (!departures.includes(departure) || !arrivals.includes(arrival)) {
            ElMessage.error('出发/到达机场不在允许列表中');
            return '';
        }
        return value;
    },

    entryTime: (value) => {
        const cleanValue = value
            .replace(/[^0-9]/g, '') // 仅保留数字
            .substr(0, 4); // 限制最大输入长度
        return `ETD+${cleanValue}`; // 自动补全前缀

    },
    validateEntryAndExitTime: (value) => {
        console.log('value', value, value.length)
        const timePattern = /^ETD\+(0\d|1\d|2[0-3])([0-5])(0|5)$/;
        // const timePattern = /^(0\d|1\d|2[0-3])([0-5])(0|5)$/;

        // 格式长度验证（ETD+HHMM总长度应为9）
        if (value.length !== 8) {
            ElMessage.error('格式要求：ETD+后必须跟随4位数字（如ETD+0930）');
            return '';
        }

        // 格式有效性检查
        if (!timePattern.test(value)) {
            ElMessage.error('时间格式错误：HH=00-23，MM必须以0/5结尾（如MM=00/05/10/15）');
            return '';
        }

        // 特殊值过滤
        if (value.endsWith('0000')) {
            ElMessage.error('时间不能为0000');
            return '';
        }
        return value;
    },
    exitTime: (value) => {
        const cleanValue = value
            .replace(/[^0-9]/g, '') // 仅保留数字
            .substr(0, 4); // 限制最大输入长度
        return `ETD+${cleanValue}`; // 自动补全前缀

    },
};
const setPlaceholderDynamic = (prop) => {
    const placeholderMap = {
        flightNumber: '输入字母/数字（如CXA123）',
        entryPoint: '选择入境点（如LAMEN）',
        exitPoint: '选择出境点（如LAMEN）',
        code: '请选择航段',
        ATSroute: '输入航线走向',
        entryTime: '输入四位数入境时间',
        exitTime: '输入四位数出境时间',
    };
    return placeholderMap[prop] || '请输入';
};
const handleInput = (row, prop, value) => {
    if (validationRules[prop]) {
        row[prop] = validationRules[prop](value);
    }
};
// 新增 blur 事件校验
const handleBlur = (row, prop) => {
    console.log('row', row)

    console.log('prop', prop)
    if (prop === 'flightNumber') {
        const validated = validationRules.validateFlightNumber(row[prop]);
        if (validated === '') row[prop] = validated; // 清空非法输入
    }
    if (prop === 'entryTime') {
        const validated = validationRules.validateEntryAndExitTime(row[prop]);
        if (validated === '') row[prop] = validated; // 清空非法输入
    }
    if (prop === 'exitTime') {
        const validated = validationRules.validateEntryAndExitTime(row[prop]);
        if (validated === '') row[prop] = validated; // 清空非法输入
    }
};
const flightDataInThisCountryByHand = ref([])
const routeDataInThisCountryByHand = ref([])
const chooseFlightTyped = ref({})
const chooseFlightTypedValue = ref([])
const handleChooseFlightTyped = (chooseFlight, index) => {
    // console.log('chooseFlight',chooseFlight)
    console.log('flightDataInThisCountryByHand', flightDataInThisCountryByHand)
    console.log('index', index)

    chooseFlightTypedValue.value = flightDataInThisCountryByHand.value.find(item => item.flightNumber == chooseFlight)
    console.log('chooseFlightTypedValue', chooseFlightTypedValue)
    routeDataInSelectedCountry.value[index].关联的航班 = chooseFlightTypedValue.value
    routeDataInSelectedCountry.value[index].code = chooseFlightTypedValue.value.departure + '-' + chooseFlightTypedValue.value.arrival
    console.log('chooseFlightTypedValue', routeDataInSelectedCountry)

}

// 确认处理函数
const tableStates = reactive({
    flight: { editable: true, confirmed: false },
    route: { editable: true, confirmed: false },
    // aircraft: { editable: true, confirmed: false }
})
const allConfirmed = computed(() =>
    Object.values(tableStates).every(t => t.confirmed)
)
const editTable = (type) => {
    tableStates[type].confirmed = false
    tableStates[type].editable = true
    console.log('editTable', type, tableStates)

}
const handleConfirm = (type) => {
    if (!validateData(type)) return

    tableStates[type].confirmed = true
    tableStates[type].editable = false
    console.log('tableStates', tableStates)
    // console.log('handleConfirm', type, tableStates)
    // 1. 提取原始数据
    switch (type) {
        case 'flight':
            const rawFlightData = flightDataInSelectedCountry.value
            // const rawRouteData = routeDataInSelectedCountry.value
            // const rawAircraftData = aircraftDataInSelectedCountry.value

            // 2. 数据清洗转换
            const processedData = rawFlightData.map(flight => ({
                flightNumber: flight.flightNumber,
                departure: flight.departure,
                arrival: flight.arrival,
                departureTime: flight.departureTime,
                landingTime: flight.landingTime,
                // 扩展其他字段...
                // route: findMatchingRoute(flight, rawRouteData),
                // aircraft: rawAircraftData
            }))

            // 3. 更新最终数据
            flightDataInThisCountryByHand.value = processedData
            console.log('最终航班数据:', flightDataInThisCountryByHand.value)
            break
        case 'route':
            const rawRouteData = routeDataInSelectedCountry.value
            // const rawRouteData = routeDataInSelectedCountry.value
            // const rawAircraftData = aircraftDataInSelectedCountry.value

            // 2. 数据清洗转换
            //   const processedRouteData = rawRouteData.map(route => ({
            //     entryPoint: route.entryPoint,
            //     entryTime: route.entryTime,
            //     ATSroute: route.ATSroute,
            //     exitPoint: route.exitPoint,
            //     exitTime: route.exitTime,
            //     code: route.code,
            //     connectFlight: route.关联的航班,
            //     matchedFlightValue:null
            //     // 扩展其他字段...
            //     // route: findMatchingRoute(flight, rawRouteData),
            //     // aircraft: rawAircraftData
            //   }
            // )
            const processedRouteData = rawRouteData.map(route => {
                const matchedFlights = flightDataInThisCountryByHand.value.filter(
                    flight => flight.flightNumber === route.关联的航班.flightNumber
                );
                return {
                    code: route.code,
                    entryPoint: route.entryPoint,
                    entryTime: route.entryTime,
                    ATSroute: route.ATSroute,
                    exitTime: route.exitTime,
                    exitPoint: route.exitPoint,
                    connectFlight: route.关联的航班,
                    // 携带关联的航班完整信息（可自定义需要携带的字段）
                    matchedFlights: matchedFlights.length > 0 ? matchedFlights : null
                };
            })
            console.log('processedRouteData', processedRouteData)

            // 2. 处理航班数据：反向关联航线
            const updatedFlightData = flightDataInThisCountryByHand.value.map(flight => {
                // 找到所有关联此航班的航线

                const relatedRoutes = processedRouteData.filter(
                    route => route.connectFlight.flightNumber === flight.flightNumber

                );

                return {
                    ...flight,
                    // 携带关联的航线信息（可自定义需要携带的字段）
                    relatedRoutes: relatedRoutes.length > 0 ? relatedRoutes : null
                };
            });
            // 3. 更新最终数据
            flightDataInThisCountryByHand.value = updatedFlightData;
            routeDataInThisCountryByHand.value = processedRouteData
            console.log('最终航线数据routeDataInThisCountryByHand:', routeDataInThisCountryByHand.value)    // 其他类型处理...
            console.log('匹配后的航班数据flightDataInThisCountryByHand:', flightDataInThisCountryByHand.value) //
            break

    }

}

// 时间处理函数
const parseDateTime = (str) => {
    if (!str) return null
    // 支持多种格式：
    // 1. ISO字符串 "2025-04-12T22:00:00"
    // 2. 时间戳 1744459200000
    // 3. 中文格式 "2025/04/12 22:00:00"
    return new Date(str)
}

// 在handleConfirm开头添加验证
const validateData = (type) => {
    let isValid = true
    switch (type) {
        case 'flight':
            flightDataInSelectedCountry.value.forEach((flight, index) => {
                if (!flight.flightNumber?.trim()) {
                    ElMessage.error(`第${index + 1}行航班号不能为空`)
                    isValid = false
                }
                if (!flight.departure?.trim()) {
                    ElMessage.error(`第${index + 1}行起飞机场不能为空`)
                    isValid = false
                }
                if (!parseDateTime(flight.departureTime) ||
                    !parseDateTime(flight.landingTime)) {
                    ElMessage.error(`第${index + 1}行时间格式错误`)
                    isValid = false
                }
                if (!flight.arrival?.trim()) {
                    ElMessage.error(`第${index + 1}行落地机场不能为空`)
                    isValid = false
                }
                if (!flight.landingTime?.trim()) {
                    ElMessage.error(`第${index + 1}行落地机场不能为空`)
                    isValid = false
                }
            })
            // return isValid
            break
        case 'route':
            routeDataInSelectedCountry.value.forEach((route, index) => {
                if (!route.code?.trim()) {
                    ElMessage.error(`第${index + 1}行航线代号不能为空`)
                    isValid = false
                }
                if (!route.entryPoint?.trim()) {
                    ElMessage.error(`第${index + 1}行入境点不能为空`)
                    isValid = false
                }
                if (!route.entryTime?.trim()) {
                    ElMessage.error(`第${index + 1}行入境时间不能为空`)
                    isValid = false
                }
                if (!route.ATSroute?.trim()) {
                    ElMessage.error(`第${index + 1}行境内航路不能为空`)
                    isValid = false
                }
                if (!route.exitPoint?.trim()) {
                    ElMessage.error(`第${index + 1}行出境点不能为空`)
                    isValid = false
                }
                if (!route.exitPoint?.trim()) {
                    ElMessage.error(`第${index + 1}行出境时间不能为空`)
                    isValid = false
                }

            })
    }
    return isValid
}
// 暂存数据 保存到localStorage
const saveData = () => {
    localStorage.setItem('flightDataInThisCountryByHand',
        JSON.stringify(flightDataInThisCountryByHand.value))
}

// 模版文件处理
const handleModeFileUpload = async (file) => {
    console.log('file', file)
    try {
        const buffer = await readFile(file.raw)
        console.log('buffer', buffer)
        templateZip = await JSZip.loadAsync(buffer)
        console.log('templateZip', templateZip)
        originalXml = await extractDocumentXml(templateZip)
        console.log('originalXml', originalXml)
        const fields = parseTemplateVariables(originalXml)
        console.log('fields', fields)
        if (fields.length === 0) {
            throw new Error('未检测到有效模板变量')
        }
        templateFields.value = fields
        console.log('templateFields', templateFields.value)
        fields.forEach(f => formData[f] = '')
        templateReady.value = true
        updatePreview()

    } catch (error) {
        handleError(error, '模板解析失败')
    }
}



// 航班选择处理
const handleFlightSelect = (flightNumber) => {
    const selected = flightOptions.value.find(f => f.number === flightNumber)
    if (selected) {
        formData.flightRoute = selected.route
        formData.departureTime = selected.departureTime
        formData.landingTime = selected.landingTime
        formData.flightNumber = selected.number
        formData.departure = selected.departure
        formData.arrival = selected.arrival
    }
}

// 文档生成逻辑
const generateDocument = async () => {
    generating.value = true
    try {
        const newZip = await processZip(templateZip, formData)
        const blob = await newZip.generateAsync({ type: 'blob' })
        saveAs(blob, `航班申请件_${formData.flightNumber || '未命名'}.docx`)
        ElMessage.success('文档生成成功')
    } catch (error) {
        handleError(error, '生成失败')
    } finally {
        generating.value = false
    }
}

// 核心处理函数
const processZip = async (zip, data) => {
    const newZip = zip.clone()
    const xml = await newZip.file('word/document.xml').async('text')
    const newXml = xml.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] || '')
    newZip.file("word/document.xml", newXml)
    return newZip
}

// 辅助函数
const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(new Error(`文件读取失败: ${error.message}`))
    reader.readAsArrayBuffer(file)
})

const extractDocumentXml = async (zip) => {
    try {
        return await zip.file('word/document.xml').async('text')
    } catch {
        throw new Error('无效的Word文档结构')
    }
}

const parseTemplateVariables = (xml) => {
    // const pattern = /{{\s*([\w\u4e00-\u9fa5-]+)\s*}}/g
    const pattern = /{{\s*([\w\u3400-\u9FFF.-]+)\s*}}/g;
    console.log('...xml.matchAll(pattern)', ...xml.matchAll(pattern))
    return [...new Set([...xml.matchAll(pattern)].map(m => m))]
}

const updatePreview = () => {
    previewContent.value = originalXml.replace(
        /{{\s*(\w+)\s*}}/g,
        (_, key) => `<var data-field="${key}">${formData[key] || '未填写'}</var>`
    )
}

// 其他交互函数
const handleReset = () => {
    templateZip = null
    originalXml = ''
    templateFields.value = []
    previewContent.value = ''
    uploadError.value = ''
    Object.keys(formData).forEach(key => delete formData[key])
    templateReady.value = false
}

const triggerUpload = () => {
    document.querySelector('.upload-box .el-upload__input')?.click()
}

const validateField = (rule, value, callback) => {
    if (!value?.trim()) return callback(new Error('必填字段'))
    if (value.length > 50) return callback(new Error('不得超过50字符'))
    callback()
}

const getPlaceholder = (field) => {
    return fieldMapping[field] ? `请输入${fieldMapping[field]}` : `请输入${field}`
}

const handleError = (error, prefix) => {
    console.error(error)
    uploadError.value = `${prefix}: ${error.message}`
    ElMessage.error(uploadError.value)
}

// 添加数据监听
watch(formData, () => updatePreview(), { deep: true })
////////newone/////////

//飞越模版部分结束



const getTagType = (aircraft) => {
    const types = {
        'Airbus': 'success',
        'Boeing': 'warning',
        '未知': 'info'
    }
    return types[aircraft.manufacturer] || 'info'
}
const getTableColumns = (sheetData) => {
    const rawData = toRaw(sheetData)
    if (!rawData.length) return {}
    // 获取首行字段结构
    const sample = rawData
    return Object.keys(sample).reduce((cols, key) => {
        cols[key] = {
            prop: key,
            label: key.split('↵').trim(), // 处理中英文混合字段
            width: key.includes('时刻') ? 160 : 'auto'
        }
        return cols
    }, {})
}


// 响应式状态
const routeData = ref([])
const rawFlights = ref([])
const loading = ref(false)
const useLocalTime = ref(true)

// 状态映射
const statusTypeMap = {
    new: 'success',
    update: 'warning',
    conflict: 'danger',
    normal: '',
    正班: 'success',
    加班: 'warning',
    补班: 'danger',
}

const statusTextMap = {
    new: '新增',
    update: '更新',
    conflict: '冲突',
    normal: '正常'
}

// 时区计算
const currentTimezone = computed(() => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return 'UTC' + (new Date().getTimezoneOffset() / 60)
    }
})
//计算飞行时间
const calculateDuration = (start, end) => {
    const hours = dayjs(end).diff(start, 'hour')
    const minutes = dayjs(end).diff(start, 'minute') % 60
    return `${hours}h ${minutes}m`
}
// 时间格式化方法
const formatUTC = (date) => {

    return date.toISOString().replace('T', ' ').substring(0, 16)
}

const formatLocal = (date) => {
    // console.log('输入的date', date)
    return date.toLocaleString('zh-CN', {

        hour: '2-digit',
        minute: '2-digit'
    }).replace(/\//g, '-')
}

const parseExcelDate = (serial) => {
    // 处理四位数字符串（如'1100'解析为11:00）

    if (typeof serial === 'string' && /^\d{4}$/.test(serial)) {
        const hours = parseInt(serial.substring(0, 2), 10);
        const minutes = parseInt(serial.substring(2, 4), 10);
        // 返回当前日期+指定时间（北京时区）
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0, 0);
        console.log('date in string', date)
        return date;
    }

    // 处理Excel日期序列号（数字类型）
    if (typeof serial === 'number') {
        const stringDate = serial.toString()
        const hours = parseInt(stringDate.substring(0, 2), 10);
        const minutes = parseInt(stringDate.substring(2, 4), 10);
        // 返回当前日期+指定时间（北京时区）
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0, 0);
        console.log('date in string', date)
        return date;

    }


    // 其他情况尝试直接解析
    return new Date(serial);
};
//
const countryRouteData = reactive({})

// ****航线信息文件处理***********IMPORTANT*******
const handleRouteUpload = async (file) => {
    // console.log('上传航线数据', file)
    try {
        loading.value = true
        const data = await parseExcelFile(file.raw)
        // console.log('上传处理后的航线数据', data)
        const processed = matchRoutes(data, rawFlights)
        routeData.value = processRouteData(processed)
        // routeData.value = processRouteData(data)
        // console.log('processed', processed)
        console.log('处理后的航线数据routeData', routeData.value)
        //做反向匹配
        transformData(routeData.value)
        console.log('验证数据', countryRouteData)

        ElMessage.success(`成功加载 ${routeData.value.length} 条航线`)
    } catch (error) {
        ElMessage.error(`航线数据错误: ${error.message}`)
    } finally {
        loading.value = false
    }
}
// const finalCountryData = ref([])
//
const detailCountryVisible = ref(false)
const currentCountry = ref('')
const currentCountryDetail = ref({})
const transformData = (routeData) => {
    const result = {}

    routeData.forEach(route => {
        const baseInfo = {
            flightNumber: route.flightNumber || '未知航班',
            departureTime: route.departureTime || '未知起飞时间',
            departure: route.departure || '未知起飞机场',
            arrival: route.arrival || '未知到达机场',
            landingTime: route.landingTime || '未知落地时间'
        }

        // 核心修正点：遍历 overfly 数组
        route.matchedRouteDetail?.forEach(countryDetail => {
            countryDetail.overfly?.forEach(overflyCountry => {
                const countryName = overflyCountry.name || '未找到国家'

                if (!result[countryName]) {
                    result[countryName] = reactive({
                        routes: new Map(),
                        countryCode: countryName
                    })
                }

                // 处理有效 sheetData
                overflyCountry.sheetData?.filter(Boolean).forEach(sheet => {
                    console.log('处理有效sheetData', sheet)
                    const routeKey = `${route.departure}-${route.arrival}`
                    const currentCountry = result[countryName]

                    if (!currentCountry.routes.has(routeKey)) {
                        currentCountry.routes.set(routeKey, reactive({
                            codes: new Map(),
                            departure: route.departure,
                            arrival: route.arrival
                        }))
                    }

                    const codeKey = sheet.涉及航线代号 || `${routeKey}_未定义代码`
                    const currentRoute = currentCountry.routes.get(routeKey)

                    if (!currentRoute.codes.has(codeKey)) {
                        currentRoute.codes.set(codeKey, reactive({
                            flights: [],
                            entryPoints: new Set(),
                            timeSlots: new Set()
                        }))
                    }

                    const targetCode = currentRoute.codes.get(codeKey)
                    targetCode.flights.push(reactive({
                        ...baseInfo,
                        entryPoint: sheet.入境点 || '未知入境点',
                        entryTime: sheet.过入境点时刻 || '时间未记录',
                        entryTimeActual: sheet.过入境点实际时间 || '时间未记录',
                        exitPoint: sheet.出境点 || '未知出境点',
                        exitTime: sheet.过出境点时刻 || '时间未记录',
                        exitTimeActual: sheet.过出境点实际时间 || '时间未记录',
                        flightRoute: sheet.境内ATS航路 || '航路未定义',
                        flightCode: sheet.航线 || '航线未定义',
                    }))
                })
            })
        })
    })

    Object.assign(countryRouteData, result)
}
//梳理上传数据的飞越国家
const processedData = computed(() => {
    console.log('已上传数据的飞越国家normalizeCountryData', normalizeCountryData(countryRouteData))
    return normalizeCountryData(countryRouteData)
})
const normalizeCountryData = (rawData) => {
    try {
        return Object.entries(rawData).map(([countryName, country]) => ({
            countryName,
            countryCode: country.countryCode || 'N/A',
            routes: country.routes instanceof Map ? country.routes : new Map(),
            productionStage: '未制作',
            checkStage: '未校核',
            applicationStage: '未申请',


        }))
    } catch (e) {
        console.error('数据格式异常:', e)
        return []
    }
}

const normalizedRoutes = (routesMap) => {
    return Array.from(routesMap.values()).map(route => ({
        key: route.key || crypto.randomUUID(),
        departure: route.departure || '未知起飞机场',
        arrival: route.arrival || '未知到达机场',
        codes: route.codes instanceof Map ? route.codes : new Map()
    }))
}
const countFlights = (route) => {
    try {
        return Array.from(route.codes.values()).reduce(
            (total, code) => total + (code.flights?.length || 0),
            0
        )
    } catch {
        return 0
    }
}
const calculateProgress = (row) => {
    const stages = [row.productionStage, row.checkStage, row.applicationStage]
    const completed = stages.filter(s => s.startsWith('已')).length
    return Math.round((completed / 3) * 100)
}

const customProgressColor = (percentage) => {
    if (percentage >= 70) return '#67C23A'
    if (percentage >= 30) return '#E6A23C'
    return '#F56C6C'
}
// // 阶段自动推进逻辑
// const handleStageChange = (stageType, country) => {
//   // 制作完成自动触发申请
//   if (stageType === 'productionStage' && country.productionStage === '已制作') {
//     country.applicationStage = '已申请'
//   }

//   // 申请完成自动触发发布
//   if (stageType === 'applicationStage' && country.applicationStage === '已申请') {
//     country.releaseStage = '已发布'
//   }
// }

// // 标签点击切换状态
// const toggleStage = (country, stageType) => {
//   country[stageType] = country[stageType].includes('未')
//     ? country[stageType].replace('未', '已')
//     : country[stageType].replace('已', '未')
// }
const FlightDataInThisCountry = ref([])
const FlightRouteInThisCountry = ref([])
const showDetailDialog = (countryName) => {
    currentCountry.value = countryName
    console.log('showDetailDialogData', countryRouteData[countryName])
    const country = countryRouteData[countryName]

    currentCountryDetail.value = {
        routes: Array.from(country.routes.values()).map(route => ({
            routeKey: route.key,
            departure: route.departure,
            arrival: route.arrival,
            codes: Array.from(route.codes.values()).map(code => ({
                codeKey: code.key,
                flights: code.flights.map(flight => ({
                    ...flight,
                    entryTimeActual: new Date(flight.entryTimeActual),
                    exitTimeActual: new Date(flight.exitTimeActual)
                }))
            })),
            codesArray: Array.from(route.codes, ([key, value]) => ({
                codeKey: key,
                ...value
            }))
        }))
    }
    console.log('currentCountryDetail.value', currentCountryDetail.value)

    detailCountryVisible.value = true
    // 提取航班数据（自动去重）
    console.log('currentCountryDetail.value', currentCountryDetail.value)
    FlightDataInThisCountry.value = currentCountryDetail.value.routes.flatMap(route =>

        route.codesArray.flatMap(code =>
            code.flights.map(flight => ({
                flightNumber: flight.flightNumber,
                departure: flight.departure,
                arrival: flight.arrival,
                departureTime: flight.departureTime,
                landingTime: flight.landingTime,
                entryPoint: flight.entryPoint,
                entryTime: flight.entryTime,
                entryTimeActual: flight.entryTimeActual,
                exitPoint: flight.exitPoint,
                exitTime: flight.exitTime,
                exitTimeActual: flight.exitTimeActual,
                flightRoute: flight.flightRoute
            }))
        )
    ).filter((flight, index, self) =>
        index === self.findIndex(f =>
            f.flightNumber === flight.flightNumber &&
            f.departureTime === flight.departureTime
        )

    );
    console.log('FlightDataInThisCountry', FlightDataInThisCountry)
    // 提取航线信息（含去重）
    FlightRouteInThisCountry.value = currentCountryDetail.value.routes.flatMap(route => {
        const baseCode = `${route.departure}-${route.arrival}`;
        return route.codesArray.flatMap(code =>
            code.flights.map(flight => ({
                code: baseCode,
                entryPoint: flight.entryPoint,
                entryTime: flight.entryTime,
                entryTimeActual: flight.entryTimeActual,
                exitPoint: flight.exitPoint,
                exitTime: flight.exitTime,
                exitTimeActual: flight.exitTimeActual,
                ATSroute: flight.flightRoute
            }))
        ).filter((item, index, self) =>
            index === self.findIndex(t =>
                t.code === item.code &&
                t.entryPoint === item.entryPoint &&
                t.exitPoint === item.exitPoint
            )
        );
    });
    console.log('FlightRouteInThisCountry', FlightRouteInThisCountry)
    // return {
    //   FlightDataInThisCountry,
    //   FlightRouteInThisCountry
    // };
}


//***IMPORTANT****反向筛选飞越国家及其匹配的数据***********************************************
import { Flag } from '@element-plus/icons-vue'
import { errorMessages } from 'vue/compiler-sfc';

const countryFlightsMap = computed(() => {
    const flightMap = new Map()
    // const routeData = JSON.parse(JSON.stringify(routeData.value))
    const routeDataToCountry = JSON.parse(JSON.stringify(routeData.value))

    routeDataToCountry.forEach(flight => {
        // 标准化国家名称处理
        const countries = (flight.overfly || [])
            .map(item => item.name.trim()) // 去除前后空格
            .filter(name => {
                // 过滤空值并统一国家名称
                if (!name) return false
                return name.replace(/\s+/g, ' ') // 合并连续空格
            })

        console.log('countries', countries)
        console.log('countries', new Set(countries))
        // 使用Set去重后遍历
        new Set(countries).forEach(country => {
            if (!flightMap.has(country)) {
                flightMap.set(country, {
                    flights: [],
                    routes: new Set(),
                    sheetData: []
                })
            }

            const countryData = flightMap.get(country)
            // 添加唯一航班
            // console.log('countryData', country, countryData)

            if (!countryData.flights.some(f => f.uniqueId === flight.uniqueId)) {
                countryData.flights.push({
                    flightNumber: flight.flightNumber,
                    departure: flight.departure,
                    arrival: flight.arrival,
                    uniqueId: flight.uniqueId,
                    departureTime: flight.departureTime,
                    landingTime: flight.landingTime

                })
            }

            // 合并航线数据
            if (flight.atsCode) {
                countryData.routes.add(flight.atsCode)
            }

            // 合并申报数据
            const countryEntry = flight.overfly.find(f => f.name === country)
            if (countryEntry?.sheetData) {
                countryData.sheetData.push(...countryEntry.sheetData)
            }
        })
    })
    console.log('flightMap', flightMap)
    // 转换为前端友好格式
    console.log('flightMap Return', Array.from(flightMap).map(([name, data]) => ({
        name,
        flightCount: data.flights.length,
        flights: data.flights,
        routes: Array.from(data.routes),
        sheetData: data.sheetData
    }))
    )
    return Array.from(flightMap).map(([name, data]) => ({
        name,
        flightCount: data.flights.length,
        flights: data.flights,
        routes: Array.from(data.routes),
        sheetData: data.sheetData
    }))

})

// const processProxyArray = (arr) => JSON.parse(JSON.stringify(arr))

// 国家列表（按字母排序）
const countryMadeList = computed(() =>
    Object.keys(countryFlightsMap.value).sort()
)

// 当前激活的国家标签
const activeCountry = ref(countryMadeList.value || '')

// 获取特定国家的申报数据
const getCountrySheetData = (flight, country) => {
    const countryData = processProxyArray(flight.overfly)
        .find(item => item.name === country)
    return countryData?.sheetData || '暂无申报数据'
}
const formatDateTimeINMADE = (date) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\//g, '-')
}
const curSelectedCountry = ref({})
const detailVisible = ref(false)
const activeTab = ref('flights')
const currentDetail = ref({
})
const testCur = ref({
    country: '',
    flights: [],
    sheets: [],
    routes: []
})

// 显示详情方法
//
const processRoutes = (curClickFlight) => {
    if (!curClickFlight?.routes) return []

    const routeMap = curClickFlight.routes.reduce((acc, routeCode) => {
        acc[routeCode] = {
            routeCode,
            departure: routeCode.split('-')[0],
            arrival: routeCode.split('-')[1],
            flights: [],
            sheets: []
        }
        return acc
    }, {})
    console.log('routeMap', routeMap)
    // 关联航班数据
    curClickFlight.flights?.forEach(flight => {
        const routeKey = `${flight.departure}-${flight.arrival}`
        // const filterFlight = curClickFlight.flights.filter(item.arrival+'-'+item.departure==)
        routeMap[routeKey]?.flights.push(flight)
    })

    // 关联申报数据
    curClickFlight.sheets?.forEach(sheet => {
        const routeKey = sheet.航线
        routeMap[routeKey]?.sheets.push(sheet)
    })

    return Object.values(routeMap)
        .sort((a, b) => b.flights.length - a.flights.length)
}
///***IMPORTANT****反向筛选飞越国家及其匹配的数据***END***


// ***航班信息文件处理逻辑
const handleFlightUpload = async (file) => {
    // if (!routeData.value.length) {
    //   ElMessage.warning('请先上传航线数据')
    //   return
    // }

    try {
        loading.value = true
        const newFlights = await processFlightData(file.raw)
        // const processed = matchRoutes(newFlights)
        //还原节点
        rawFlights.value = detectDifferences(newFlights)
        console.log('上传处理后的航班数据', rawFlights.value)
        // ElMessage.success(`已处理 ${processed.length} 个航班`)
    } catch (error) {
        ElMessage.error(`航班数据错误: ${error.message}`)
    } finally {
        loading.value = false
    }
}
//处理航线数据
const processRouteData = (data) => {
    console.log('processRouteData数据', data)
    return data.map(item => {
        const curCode = item.departure + "-" + item.arrival
        const curDepTime = item.departureTime
        const curFlightNumber = item.flightNumber
        console.log('curDepTime', curDepTime)
        console.log('new curDepTime', new Date(curDepTime))
        const overflyData = item.matchedRoute.flatMap(matchDetail => {
            // 容错处理：空值默认值 + 智能分割（同时支持中英文逗号和空格）
            console.log('当前处理x航线的飞越国家', matchDetail)
            const countries = (matchDetail.飞越国家 || '')
                .split(' ')  // 
                .map(name => name.trim())
                .filter(Boolean); // 等价于 name => !!name

            // 结构化飞越国家数据
            console.log('countries', countries)
            const curLineCode = matchDetail.航线代码
            return matchDetail.overfly = countries.map(countryName => ({
                name: countryName,
                sheetData: getSheetDataByCountry(countryName, curCode, curLineCode, curDepTime, curFlightNumber) || null, // 空值兜底

            }));

        });
        return {
            matchedRouteDetail: item.matchedRoute,
            atsCode: curCode,
            departure: item.departure,
            arrival: item.arrival,
            // distance: item.距离 || 0,
            atsRoute: item.航线走向,
            overfly: overflyData,
            ...item
        }
    }).filter(Boolean)
}
//处理航班数据
const processFlightData = async (file) => {
    const rawData = await parseFlightFile(file)
    console.log('航班数据', rawData)

    return rawData.map(flight => {
        // 动态字段映射
        const depField = Object.keys(flight).find(k =>
            /(起飞机场|departure)/i.test(k)
        )
        const arrField = Object.keys(flight).find(k =>
            /(落地机场|目的机场|arrival)/i.test(k)
        )
        const aircraftType = processAircraftType(flight.机型)
        console.log('aircraftType', aircraftType)
        console.log('depField', depField)
        console.log('arrField', arrField)
        // 构建航班对象
        return {
            uniqueId: `${flight.航班号}_${parseExcelDate(flight.起飞时间).getTime()}`,
            flightNumber: flight.航班号,
            departure: flight[depField]?.trim().toUpperCase(),
            arrival: flight[arrField]?.trim().toUpperCase(),
            departureTime: parseExcelDate(flight.起飞时间),

            landingTime: parseExcelDate(flight.落地时间),
            attribute: flight.航班性质,

            aircraftType,
            status: 'normal',
            matchedRoute: null
        }
    })
}
// 机型数据库（示例数据，按需补充）
const AIRCRAFT_DB = {
    'A321': {
        displayName: 'A21N',
        fullName: 'Airbus A321-200',
        manufacturer: 'Airbus',
        type: 'Narrow-body',
        seats: 220,
        range: '5,600 km'
    },
    'B737': {
        displayName: 'B737',
        fullName: 'Boeing 737-700',
        manufacturer: 'Boeing',
        type: 'Narrow-body',
        seats: 189,
        range: '5,765 km'
    },
    'B738': {
        displayName: 'B738',
        fullName: 'Boeing 737-800',
        manufacturer: 'Boeing',
        type: 'Narrow-body',
        seats: 189,
        range: '5,765 km'
    }, 'B38M': {
        displayName: 'B38M',
        fullName: 'Boeing 737-8',
        manufacturer: 'Boeing',
        type: 'Narrow-body',
        seats: 189,
        range: '5,765 km'
    },
    'B788': {
        displayName: 'B788',
        fullName: 'Boeing 787-8',
        manufacturer: 'Boeing',
        type: 'Wide-body',
        seats: 296,
        range: '14,140 km'
    },

    'B789': {
        displayName: 'B789',
        fullName: 'Boeing 787-9',
        manufacturer: 'Boeing',
        type: 'Wide-body',
        seats: 296,
        range: '14,140 km'
    }
    // 添加更多机型...
};

/**
 * 处理原始机型字符串
 * @param {string} rawType 原始机型数据如 "A321/B737"
 * @returns {Array} 标准化后的机型对象数组
 */
const processAircraftType = (rawType) => {
    if (!rawType) return [];
    console.log('rawType', rawType)
    console.log('rawType', rawType.split('/'))

    // 按斜杠分割并提取前4位字符（兼容不同写法）
    return rawType.split('/')
        .map(code => {
            // 清理数据并提取核心机型代码（如 B737-800 → B737）
            const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            console.log('cleanCode', cleanCode)
            const coreCode = cleanCode.substring(0, 4);
            return coreCode;
        })
        // 去重后匹配数据库
        .filter((code, index, self) => self.indexOf(code) === index)
        .map(code => {
            // 匹配数据库或返回默认值
            const aircraftData = AIRCRAFT_DB[code];
            return aircraftData ?
                { ...aircraftData, originalCode: code } :
                {
                    displayName: code,
                    fullName: `未知机型 (${code})`,
                    manufacturer: '未知',
                    type: '未知',
                    seats: 'N/A',
                    range: 'N/A',
                    originalCode: code
                };
        });
};

// 核心匹配逻辑

const matchRoutes = (allRoutes, allFlights) => {
    console.log('allFlights', allFlights._rawValue)
    console.log('allRoutes', allRoutes)
    return allFlights._rawValue.map(flight => {
        // 匹配所有符合条件的航线（包括多条件匹配）
        console.log('flight', flight)
        const matchedRoutes = allRoutes.filter(route => {
            const cityPair = flight.departure?.toUpperCase?.() + "-" + flight.arrival?.toUpperCase?.();
            const line = route.航线

            // 匹配 起飞机场-目的机场 等于 航线
            return (cityPair === line)
        });
        console.log('matchedRoutes', matchedRoutes)
        // 结构化匹配结果
        return {
            ...flight,
            matchedRoute: matchedRoutes
            // matchedRoutes: matchedRoutes.map(route => ({
            //   ...route,
            //   // 添加方向标识
            // }))
        };
    });
};

// 使用示例
// const enhancedFlights = matchRoutes(routes, rawFlights._rawValue);

// 差异检测
const detectDifferences = (newFlights) => {
    return newFlights.map(newFlight => {
        const existing = rawFlights.value.find(f => f.uniqueId === newFlight.uniqueId)

        if (!existing) return { ...newFlight, status: 'new' }

        const changes = Object.keys(newFlight).reduce((diff, key) => {
            if (key === 'departureTime') {
                if (newFlight[key].getTime() !== existing[key].getTime()) {
                    diff[key] = {
                        old: existing[key],
                        new: newFlight[key]
                    }
                }
            } else if (newFlight[key] !== existing[key]) {
                diff[key] = {
                    old: existing[key],
                    new: newFlight[key]
                }
            }
            return diff
        }, {})

        return Object.keys(changes).length > 0
            ? { ...newFlight, status: 'update', changes }
            : { ...existing, status: 'duplicate' }
    })
}




// 工具函数
const uploadedSheets = reactive({});
const parseFlightFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, {
                    type: 'array',
                    cellDates: true  // 启用日期解析
                })
                const lineSheet = workbook.SheetNames.find(item => item === '航班计划')
                console.log('workbook.Sheets', workbook.Sheets)
                const sheet = workbook.Sheets[lineSheet]
                resolve(XLSX.utils.sheet_to_json(sheet))

            } catch (error) {
                reject(new Error('文件解析失败: ' + error.message))
            }
        }
        reader.onerror = error => reject(error)
        reader.readAsArrayBuffer(file)
    })
}
const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, {
                    type: 'array',
                    cellDates: true  // 启用日期解析
                })
                const lineSheet = workbook.SheetNames.find(item => item === '航线走向')
                console.log('workbook.Sheets', workbook.Sheets)
                // console.log('workbook.SheetNames',workbook.SheetNames.find(item=>item='航线走向'))
                const sheet = workbook.Sheets[lineSheet]
                resolve(XLSX.utils.sheet_to_json(sheet))

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    uploadedSheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);


                });
                resolve(uploadedSheets);
                console.log('uploadedSheets:', uploadedSheets);

            } catch (error) {
                reject(new Error('文件解析失败: ' + error.message))
            }
        }
        reader.onerror = error => reject(error)
        reader.readAsArrayBuffer(file)
    })
}
const getSheetDataByCountry = (countryName, curCode, curLineCode, depTime, curFlightNumber) => {

    const sheetData = uploadedSheets[countryName].filter(item => item.航线.toString().trim() == curCode.toString().trim()).filter(
        item => item.涉及航线代号 === curLineCode) || [];
    const processedData = sheetData.map(item => {
        // 深拷贝对象避免污染原始数据
        const newItem = { ...item };
        try {
            // 解析过境时间偏移量

            const timeOffset = parseTimeOffset(newItem.过入境点时刻);
            const outtimeOffset = parseTimeOffset(newItem.过出境点时刻);
            console.log('timeOffset', timeOffset)
            // 创建新的时间对象
            depTime = new Date(depTime)
            // console.log('depTime in getSheetDataByCountry', depTime)
            // console.log('depTime in getSheetDataByCountry', depTime.getTime())
            const calculatedTimestamp = depTime.getTime() + timeOffset * 60 * 1000;
            const calculatedOutTimestamp = depTime.getTime() + outtimeOffset * 60 * 1000;
            // console.log('calculatedTimestamp', calculatedTimestamp)
            const calculatedDate = new Date(calculatedTimestamp);
            const calculatedOutDate = new Date(calculatedOutTimestamp);
            // console.log('calculatedDate', calculatedDate)
            // 添加计算结果到新对象
            // console.log('formatDateTime(calculatedTime)', formatDateTime(calculatedDate))
            // newItem.过入境点实际时间 = formatDateTime(calculatedDate);
            newItem.过入境点实际时间 = calculatedDate;

            // newItem.过出境点实际时间 = formatDateTime(calculatedOutDate);
            newItem.过出境点实际时间 = calculatedOutDate;
            newItem.countryIdentityCode = countryName + curCode
            newItem.uniCountryToLineCode = countryName + curCode + curLineCode + curFlightNumber
            // newItem.newtime = formatDateTime(calculatedTime);

            // newItem._calculationError = null;
        } catch (error) {
            console.error('时间计算错误:', error.message, item);
            newItem._calculationError = error.message;
        }
        // console.error('newItem:', newItem);
        return newItem;
    });

    console.log('sheetData', sheetData)
    console.log('processedData', processedData)
    // console.log('sheetData.filter', sheetData.filter(item => item.航线 == curCode))
    return processedData;
}
function parseTimeOffset(timeString) {
    // 正则匹配 [+-]HHMM 格式
    const match = String(timeString).match(/^.*?([+-])(\d{2})(\d{2})$/);
    if (!match) throw new Error(`无效时间格式: ${timeString}`);

    const [_, sign, hoursStr, minutesStr] = match;
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // 有效性校验
    if (hours > 23 || minutes > 59) {
        throw new Error(`时间值越界: ${hours}:${minutes}`);
    }

    // 计算总偏移分钟数
    const signMultiplier = sign === '-' ? -1 : 1;
    return signMultiplier * (hours * 60 + minutes);
}
function formatDateTime(date) {
    console.log('date', date)
    return date.toISOString().replace('T', ' ').substring(10, 16).replace(':', '');
}
// 计算属性
const processedFlights = computed(() => {
    return rawFlights.value.map(flight => ({
        ...flight,
        duplicateCount: rawFlights.value.filter(f =>
            f.departure === flight.departure &&
            f.arrival === flight.arrival
        ).length - 1
    }))
})
console.log('processedFlights', processedFlights)
</script>

<style lang="scss" scoped>
// .el-timeline {
//   display: flex;
//   flex-direction: row;
//   /* 改为水平方向 */
//   align-items: center;
//   /* 垂直居中 */
// }

// .el-timeline-item {
//   flex: 1;
//   /* 让每个时间线项都等宽 */
//   text-align: center;
//   /* 文本居中 */
// }

.timeline-container {
    display: flex;
    flex-direction: row;
    /* 水平方向 */
    align-items: center;
    /* 垂直居中 */
    overflow-x: auto;
    /* 允许水平滚动 */
}

.aircraft-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.custom-aircraft-tag {
    cursor: pointer;
    transition: all 0.3s;
}

.custom-aircraft-tag:hover {
    transform: translateY(-2px);
}

.custom-aircraft-tag:deep(.aircraft-tooltip) {
    max-width: 260px;

}

h4 {
    margin: 0 0 8px 0;
    color: var(--el-color-primary);
}

.el-descriptions__body {
    background: transparent;
}

.flight-system-container {
    padding: 24px;
    max-width: 1600px;
    margin: 0 auto;
}

.control-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;
}

.timezone-display {
    color: #606266;
    font-size: 0.9em;
}

.upload-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.upload-card {
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;


}

.upload-card:hover {
    transform: translateY(-4px);
}

.upload-icon {
    margin-right: 8px;
}

.upload-tip {
    color: #909399;
    font-size: 0.85em;
    margin-top: 12px;
}

.detail-panel {
    padding: 16px;
    background: #f8f9fa;
}

.route-info h3 {
    color: #409eff;
    margin-bottom: 16px;
}

.no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e6a23c;
    padding: 20px;


}

.el-icon {
    margin-right: 8px;
}

.airport-pair {
    display: flex;
    align-items: center;
    gap: 8px;


}

.arrow {
    color: #909399;
    margin: 0 4px;
}

.time-display {}

.time-main {
    font-weight: 500;
    color: #303133;
}

.time-sub {
    font-size: 0.85em;
    color: #909399;
}

.airport-code {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;



}

.airport-code.dep {
    background: #f0f7ff;
    color: #409eff;
}

.airport-code.arr {
    background: #f0fff4;
    color: #67c23a;
}

.airport-code.country-code {
    opacity: 0.6;
    margin-left: 4px;
}

/* 错误提示样式 */
.error-tip {
    padding: 20px;
    color: #f56c6c;
    text-align: center;

}

.el-icon-warning-outline {
    margin-right: 8px;
}

/* 表格自适应优化 */
.el-table__body-wrapper {
    overflow-x: auto;

}

.el-table__cell {
    white-space: nowrap;

}

.cell {
    word-break: keep-all;
}

/* 空状态标签 */
.empty-tag {
    display: inline-block;
    padding: 4px 8px;
    background: #f5f7fa;
    border-radius: 4px;
}

/* */
.compact-tabs {
    --tab-padding: 8px 12px;
}

.tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
}

.badge {
    transform: scale(0.8);
}

.value-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
}

.tip {
    color: #909399;
    cursor: help;
    font-size: 0.9em;
}

.empty :deep(.el-empty__description) {
    font-size: 0.9em;
}

.matched-routes {
    background: #f8f9fa;
    border-radius: 4px;
    padding: 12px;


}

.route-item {
    margin: 8px 0;


}

.route-direction {
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
    color: #666;
}

.el-divider {
    margin: 16px 0;
}

.container {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
}

.preview-box {
    margin-top: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 20px;
}

.preview-content {
    max-height: 500px;
    overflow-y: auto;
    padding: 15px;
    background: #f8f9fa;
}

.action-buttons {
    margin-top: 20px;
    display: flex;
    gap: 10px;
}

:deep(.el-form-item__label) {
    width: 120px;
}

:deep(.el-dialog__body) {
    padding: 20px;
}

.custom-tab-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
}

.flight-card {
    margin: 16px 0;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-3px);
    }
}

.aircraft-types {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.sheet-data {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
}

/* 测试部分 */
.doc-generator {
    height: calc(100vh - 120px);

    .control-panel {
        border-right: 1px solid var(--el-border-color);
        padding-right: 12px;

        .upload-card {
            margin-bottom: 24px;

            .upload-content {
                padding: 24px;
                text-align: center;

                .upload-icon {
                    color: var(--el-color-primary);
                    margin-bottom: 12px;
                }

                .upload-title {
                    font-size: 16px;
                    margin-bottom: 4px;
                }

                .upload-subtitle {
                    color: var(--el-text-color-secondary);
                    font-size: 12px;
                }

                .upload-tip {
                    color: var(--el-color-info);
                    font-size: 12px;
                    margin-top: 8px;
                }
            }
        }

        .action-buttons {
            margin-top: 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
    }

    .preview-panel {
        background: var(--el-fill-color-light);

        .preview-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .preview-content {
            height: calc(100vh - 200px);
            overflow: auto;
            padding: 16px;
            background: white;
            border-radius: 4px;

            &.original-mode var {
                background: transparent;
                color: inherit;
            }

            var {
                background: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
                padding: 2px 4px;
                border-radius: 2px;
                font-style: normal;

                &[data-field]:empty::after {
                    content: attr(data-field);
                    opacity: 0.6;
                }
            }

            p {
                line-height: 1.8;
                margin: 0.8em 0;
            }
        }
    }

    :deep(.warning-icon) {
        color: var(--el-color-warning);
        margin-left: 4px;
    }
}

.container {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
}


//处理已上传数据部分--生成飞越许可
/* 进度状态容器 */
.progress-status {
    padding: 8px 0;

    .state-progress {
        margin-bottom: 10px;

        .el-progress-bar__outer {
            border-radius: 6px;
        }
    }

    .stage-tags {
        display: flex;
        gap: 8px;

        .stage-tag {
            flex-shrink: 0;
            transition: opacity 0.3s;

            &:hover {
                opacity: 0.8;
            }
        }
    }
}

/* 添加过渡动画 */
.el-progress-bar__inner {
    transition: all 0.5s ease;
}

.stage-container {
    transition: transform 0.3s;

    &:hover {
        transform: scale(1.05);
    }
}

/* 卡片容器 */
.country-cards {
    padding: 20px;

    .card-col {
        margin-bottom: 20px;
    }
}

/* 卡片样式 */
.todo-card {
    transition: transform 0.3s;

    &:hover {
        transform: translateY(-5px);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .stage-list {
        .stage-item {
            margin: 18px 0;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .stage-label {
                flex: 1;
                cursor: pointer;
                transition: all 0.3s;

                &:hover {
                    opacity: 0.8;
                }
            }

            .stage-controls {
                display: flex;
                align-items: center;
                gap: 12px;

                .status-text {
                    color: #666;
                    min-width: 60px;
                    text-align: right;
                }
            }
        }
    }
}

.document-container {
    padding: 20px;
}

.word-content {
    margin: 16px 0;
    line-height: 1.6;
}

/* 重置 el-table 默认边距 */
.table-wrapper {
    margin: 24px 0;
}

/////预览区域
.word-table {
    border-collapse: collapse !important;

    .el-table__cell {
        padding: 12px !important;
        vertical-align: top;

        &.align-center {
            vertical-align: middle;
        }
    }

    @media (max-width: 768px) {
        .el-table__body-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
                height: 8px;
            }
        }
    }
}

.preview-box-Indeady {
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    min-height: 500px;
    background: white;
    margin-top: 50px;
}

:deep(.missing-data) {
    color: #f56c6c;
    border-bottom: 1px dashed currentColor;
}

.el-tabs-Indeady {
    margin-top: 20px;
}

.el-upload__tip-Indeady {
    margin: 10px 0;
    color: #606266;
}

//编辑状态
.editable-cell {
    cursor: default;
    padding: 8px;
}

/* 可编辑单元格的特殊样式 */
.editable-cell.editable-style {
    background-color: #f0f9eb;
    /* 浅绿色背景 */
    border: 1px dashed #67c23a;
    /* 虚线边框 */
    cursor: pointer;
    /* 手型光标 */
}

/* 悬停效果增强 */
.editable-cell.editable-style:hover {
    background-color: #e1f3d8;
    border-style: solid;
}

/* 编辑模式下的输入框样式 */
.editable-cell .el-input.editing {
    border: 2px solid #409eff;
    /* 激活态蓝色边框 */
}

//
// 匹配现有数据scss
.route-header {
    padding: 8px;
    text-align: center;

    .airport-codes {
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        .departure {
            color: #67c23a;
            font-weight: 500;
        }

        .arrival {
            color: #e6a23c;
            font-weight: 500;
        }

        .arrow {
            margin: 0 8px;
            color: #909399;
        }
    }
}

.my-autocomplete li {
    line-height: normal;
    padding: 7px;
}

.my-autocomplete li .name {
    text-overflow: ellipsis;
    overflow: hidden;
}

.my-autocomplete li .addr {
    font-size: 12px;
    color: #b4b4b4;
}

.my-autocomplete li .highlighted .addr {
    color: #ddd;
}

.flight-detail {
    padding: 8px;

    .flight-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .flight-number {
            font-weight: 600;
            color: #2c3e50;
        }
    }

    .time-range {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #606266;

        .time-icon {
            color: #409eff;
        }

        .departure-time {
            color: #67c23a;
        }

        .arrival-time {
            color: #e6a23c;
        }
    }

    .duration {
        margin-top: 8px;
        color: #909399;
        font-size: 0.9em;
    }
}

.declaration-info {
    .checkpoint {
        margin: 8px 0;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-tag {
            width: 60px;
            justify-content: center;
        }
    }
}

//
.country-overfly-table {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.route-tag {
    margin: 4px;
    padding: 0 12px;
    border-radius: 14px;
}

.flight-count {
    font-size: 0.8em;
    color: #666;
    margin-left: 8px;
}

.detail-content {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 15px;
}

.route-block {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
}

.route-title {
    margin: 0 0 12px 0;
    color: #2c3e50;
    font-size: 16px;
}

.code-count {
    font-size: 0.9em;
    color: #666;
    font-weight: normal;
}

.time-plan {
    line-height: 1.8;
}

.time-plan .label {
    color: #999;
    margin-right: 8px;
}

.waypoints {
    display: flex;
    align-items: center;
    gap: 8px;
}

.arrow {
    color: #666;
    padding: 0 4px;
}

.flight-table {
    margin-top: 12px;
}

:deep(.el-collapse-item__header) {
    font-weight: 500;
    padding-left: 12px;
    background: #f5f7fa;
}

//手工制作申请文件
/* 强制显示前缀 */
.prefix-cxa {
    color: #909399;
    padding-right: 5px;
    user-select: none;
}

/* 错误状态标识 */
.el-input.is-error .prefix-cxa {
    color: #F56C6C;
}

.data-tables {
    margin-top: 20px;
}

.table-section {
    margin: 20px 0;
    border: 1px solid #eee;
    padding: 15px;
}

.no-data {
    color: #999;
    padding: 10px;
    background: #f5f5f5;
}

h3 {
    margin-bottom: 10px;
    color: #409EFF;
}

/* 禁用状态视觉反馈 */
.el-input.is-disabled .el-input__inner {
    background-color: #f5f7fa;
    color: #909399;
}
</style>