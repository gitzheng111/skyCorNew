<template>
    <el-time-picker ref="picker" v-model="innerDate" 
        format="HH:mm" 
        placeholder="请输入或选择时间"
        :editable="true"
        @input="onInput"
        @change="onChange"
        @blur="handleBlur"

        :picker-options="{ step: '00:05' }"
        style="width: 160px"
        />
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: String,
        default: ''    // 对外暴露为 "HH:mm" 或 ""（空）
    }
})
const emit = defineEmits(['update:modelValue'])

const innerDate = ref(null)  // 内部绑定给 el-time-picker 的 Date
const picker = ref(null)

// --- 工具函数 ---
function pad2(n) { return String(n).padStart(2, '0') }

function strToDate(timeStr) {
    if (!timeStr) return null
    // 支持 "HHmm" 或 "HH:mm"
    let normalized = timeStr
    if (/^\d{4}$/.test(timeStr)) normalized = timeStr.slice(0, 2) + ':' + timeStr.slice(2)
    const m = normalized.match(/^(\d{1,2}):(\d{2})$/)
    if (!m) return null
    let hh = parseInt(m[1], 10)
    let mm = parseInt(m[2], 10)
    if (isNaN(hh) || isNaN(mm)) return null
    if (hh > 23) hh = 23
    if (mm > 59) mm = 59
    const d = new Date()
    d.setHours(hh, mm, 0, 0)
    return d
}

function dateToStr(date) {
    if (!(date instanceof Date) || isNaN(date)) return ''
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function roundToNearest5(min) {
    return Math.round(min / 5) * 5
}

// --- 同步 props -> innerDate（初始化 / 外部变更） ---
watch(() => props.modelValue, (val) => {
    innerDate.value = strToDate(val)
}, { immediate: true })

// --- 当内部 Date 改变时，导出字符串到父级 ---
watch(innerDate, (d) => {
    // innerDate 可能是 null 或 Date
    emit('update:modelValue', dateToStr(d))
})

// --- 处理用户在输入框里直接敲入的情形（el-time-picker 的 input 有时会发 string） ---
function onInput(val) {
    // val can be Date or string depending on el-time-picker behavior
    if (typeof val === 'string') {
        const raw = val.trim()
        // 4 位纯数字如 1210
        if (/^\d{4}$/.test(raw)) {
            let hh = parseInt(raw.slice(0, 2), 10)
            let mm = parseInt(raw.slice(2, 4), 10)
            if (isNaN(hh) || isNaN(mm)) return
            if (hh > 23) hh = 23
            if (mm > 59) mm = 59
            mm = roundToNearest5(mm)
            if (mm === 60) { mm = 0; hh = (hh + 1) % 24 }
            const nd = new Date()
            nd.setHours(hh, mm, 0, 0)
            innerDate.value = nd
            return
        }

        // 如果是像 "12:3" 或 "12:03" 之类，尝试解析
        const parsed = strToDate(raw)
        if (parsed) innerDate.value = parsed
        return
    }

    if (val instanceof Date) {
        // 用户选择了时间，确保分钟为 5 的倍数
        let hh = val.getHours()
        let mm = val.getMinutes()
        mm = roundToNearest5(mm)
        if (mm === 60) { mm = 0; hh = (hh + 1) % 24 }
        const nd = new Date(val)
        nd.setHours(hh, mm, 0, 0)
        innerDate.value = nd
    }
}

// 当用户通过选择器改变时，也进行同样的处理（保险）
function onChange(val) {
    if (val instanceof Date) {
        let hh = val.getHours()
        let mm = val.getMinutes()
        mm = roundToNearest5(mm)
        if (mm === 60) { mm = 0; hh = (hh + 1) % 24 }
        const nd = new Date(val)
        nd.setHours(hh, mm, 0, 0)
        innerDate.value = nd
    } else if (typeof val === 'string') {
        // fallback，交给 onInput 逻辑
        onInput(val)
    }
}

function handleBlur(e) {
  const raw = e.target.value.trim()
  if (!raw) return

  const parsed = parseTimeInput(raw)
  if (parsed) {
    emit("update:modelValue", parsed)
    innerValue.value = parsed
  }
}

// ⏱ 解析四位数字 & 限制分钟只能 0/5 结尾
function parseTimeInput(value) {
  // 支持 3 位或 4 位纯数字
  if (!/^\d{3,4}$/.test(value)) return null
  const padded = value.padStart(4, "0")
  let hour = parseInt(padded.slice(0, 2), 10)
  let minute = parseInt(padded.slice(2, 4), 10)

  if (hour > 23) hour = 23
  if (minute > 59) minute = 59

  // 分钟四舍五入到 5 的倍数
  minute = Math.round(minute / 5) * 5
  if (minute >= 60) {
    minute = 55
  }

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`
}

</script>