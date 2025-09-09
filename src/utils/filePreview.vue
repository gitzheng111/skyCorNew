<!-- utils/filePreview.vue -->
<template>
    <div v-if="inline">
        <div v-loading="loading" style="height: 80vh;overflow: auto;width: 100%;">
            <!-- Word 预览 -->
            <vue-office-docx  v-if="previewType === 'docx' && previewContent" :src="previewContent"
                class="office-preview" />
        </div>
    </div>
    <el-dialog v-else v-model="visible" width="80%" :title="fileName" destroy-on-close>
        <div v-loading="loading" style="height: 80vh;">
            <!-- PDF -->
            <iframe v-if="previewType === 'pdf' && previewContent" :src="previewContent"
                style="width: 100%; height: 100%; border: none"></iframe>

            <!-- Word -->
            <vue-office-docx v-if="previewType === 'docx' && previewContent" :src="previewContent"
                class="office-preview" />

            <!-- Excel -->
            <vue-office-excel v-if="previewType === 'xlsx' && previewContent" :src="previewContent"
                class="office-preview" />

            <!-- 不支持 -->
            <div v-if="!['pdf', 'docx', 'xlsx'].includes(previewType)">
                暂不支持该文件类型预览
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, watch, watchEffect, onMounted } from 'vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
import { fixEncoding } from '../utils/fileNameEncode.js'

import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
const fileName = ref('文件预览')
const props = defineProps({
    file: Object,
    visible: Boolean,
    inline:Boolean

})
const emit = defineEmits(['update:visible', 'extract-fields'])

const visible = ref(props.visible)
watch(() => props.visible, val => (visible.value = val))
watch(visible, val => emit('update:visible', val))

const previewType = ref('')
const previewContent = ref(null)
const loading = ref(false)

watch(
    () => props.file,
    async (file) => {
        if (!file) return
        if (file.source == 'net') {
            console.log('读取网络file', file)

            if (!file?.url || !file.name) return
            // fileName.value = fixEncoding(file.name)
            fileName.value = file.name
            const ext = file.name.split('.').pop().toLowerCase()
            console.log('ext', ext)
            previewType.value = ext
            console.log('previewType', previewType)
            loading.value = true
            const encodedURL = encodeURI(file.url)

            try {
                if (ext === 'pdf') {
                    previewContent.value = encodedURL
                } else if (ext === 'docx') {
                    const buffer = await fetch(encodedURL).then(res => res.arrayBuffer())

                    previewContent.value = buffer
                    console.log('previewContent', previewContent.value)
                    await extractDocxVariables(buffer)
                } else if (ext === 'xlsx') {
                    const buffer = await fetch(encodedURL).then(res => res.arrayBuffer())
                    previewContent.value = buffer
                    await extractXlsxVariables(buffer)
                } else {
                    previewContent.value = null
                }
            } catch (e) {
                console.error('预览失败', e)
            } finally {
                loading.value = false
            }
        } else {

            console.log('读取本地file', file)

            previewType.value = file.type
            loading.value = true
            try {
                previewContent.value = file.URL
                console.log('previewContent',previewContent.value)
            } catch (e) {
                console.error('预览失败', e)
                previewContent.value = null
            } finally {
                loading.value = false
            }
        }

    },
    { immediate: true }
)

watchEffect(() => {

})

const extractDocxVariables = async (buffer) => {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    const text = result.value || ''
    const fields = extractFieldsFromText(text)
    emit('extract-fields', fields)
}

const extractXlsxVariables = async (buffer) => {
    const data = new Uint8Array(buffer)
    const workbook = XLSX.read(data, { type: 'array' })

    let fullText = ''
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        fullText += XLSX.utils.sheet_to_csv(sheet) + '\n'
    })

    const fields = extractFieldsFromText(fullText)
    emit('extract-fields', fields)
}

const extractFieldsFromText = (text) => {
    const matches = text.match(/{{\s*[\w.-]+\s*}}/g) || []
    return [...new Set(matches.map(m => m.replace(/{{\s*|\s*}}/g, '')))]
}

onMounted(() => {
    console.log('file-preview mounted')
})
</script>

<style scoped>
.office-preview {
    height: 100%;
    width: 100%;
    overflow: auto;
}
</style>