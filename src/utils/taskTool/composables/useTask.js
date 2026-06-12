// modules/task/composables/useTask.js

import { ref } from 'vue'

import {
    useTaskBuilder
} from './useTaskBuilder'

import {
    useTaskSelection
} from './useTaskSelection'

import {
    useTaskSubmit
} from './useTaskSubmit'

export function useTask() {

    const taskNeedData = ref([])

    const {
        taskList,
        createTask
    } = useTaskBuilder()

    const selection =
        useTaskSelection()

    const {
        submitTask
    } = useTaskSubmit()

    return {

        taskNeedData,

        taskList,

        createTask,

        submitTask,

        ...selection
    }
}