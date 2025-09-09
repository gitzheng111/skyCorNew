<template>
    <div class="document-container preview-box-Indeady">
        <!-- 添加加载状态 -->
        <el-skeleton :loading="loading" animated :rows="10">
            <template #default>
                <div v-for="(block, index) in contentBlocks" :key="block.id || index">
                    <!-- 添加内容区域点击保护 -->
                    <div class="content-section" @click.stop>
                        <template v-if="block.type === 'html'">
                            <div class="word-content" v-html="block.content" @dblclick="handleContentEdit(block)"></div>
                        </template>

                        <template v-else-if="block.type === 'table'">
                            <div class="table-wrapper">
                                <el-table :data="block.data.rows" border stripe size="small" :max-height="500"
                                    style="width: 100%">
                                    <!-- 动态列渲染 -->
                                    <el-table-column v-for="(header) in normalizedHeaders(block)" :key="header.key"
                                        :prop="header.key" :label="header.label" :min-width="120">
                                        <template #default="{ row, $index }">
                                            <editable-cell :ref="(el) => registerCellRef(row.id, header.key, el)"
                                                :row="row" :header="header" :index="$index"
                                                @edit-complete="handleEditComplete" />
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                        </template>
                    </div>
                </div>
            </template>
        </el-skeleton>
    </div>
</template>

<script setup>
// 优化后的脚本部分
import { ref, computed, watch, nextTick, defineProps } from 'vue'
import EditableCell from './EditableCell.vue' // 抽离可编辑单元格组件
import _ from 'lodash';

const props = defineProps({
    showData: {
        type: Array,
        required: true,
        validator: value => value.every(item => 'type' in item && 'content' in item)
    }
})
console.log('props',props.showData)
const cellRefs = ref(new Map())

const registerCellRef = (rowId, headerKey, el) => {
    if (!el) return
    const key = `${rowId}-${headerKey}`
    cellRefs.value.set(key, el)
}
// 响应式数据
const loading = ref(true)
const contentBlocks = computed(() => {
    return props.showData.data.map(block => ({
        ...block,
        id: block.id || generateUID() // 确保唯一标识
    }))
})

// 方法优化
const normalizedHeaders = (block) => {
    return block.data.headers.map(header => ({
        key: header.key || `col_${Date.now()}`,
        label: header.label || '未命名列',
        width: header.width || 'auto'
    }))
}

// 性能优化：防抖处理
const handleContentEdit = _.debounce((block) => {
    // 双击编辑逻辑
}, 300)

// 初始化完成自动关闭加载
watch(() => props.showData, (newVal) => {
    console.log('newVal',newVal)
    if (newVal.data.length > 0) {
        setTimeout(() => {
            loading.value = false
        }, 500)
    }
}, { immediate: true })

// 唯一ID生成
const generateUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>

.document-container {
  padding: 20px;
}

/* 添加安全区域样式 */
.preview-box-Indeady {
    max-height: 80vh;
    overflow-y: auto;
    padding: 12px;
    background: #fff;
    padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 500px;
  margin-top: 50px;
}

.content-section {
    margin-bottom: 24px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 12px;
}

.table-wrapper {
    margin: 12px 0;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}

:deep(.el-table) th {
    background: #f8f9fa !important;
}
</style>