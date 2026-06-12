// modules/task/composables/useTaskSubmit.js

import dayjs from 'dayjs'
import sha256 from 'crypto-js/sha256'

import {
    addTask
} from '@/api'

export function useTaskSubmit() {

    const submitTask = async (
        taskList,
        taskName,
        taskSeason,
        taskAttribution
    ) => {

        const now =
            dayjs().format(
                'YYYY-MM-DD HH:mm:ss'
            )

        const taskKey =
            sha256(
                JSON.stringify(taskList) + now
            ).toString()

        const payload = {

            taskName,

            taskKey,

            taskSeason,

            taskAttribution,

            createTime: now,

            updateTime: now,

            data:
                JSON.stringify(taskList)
        }

        return await addTask(payload)
    }

    return {
        submitTask
    }
}