// composables/useSeasonUtils.js
import { ref } from 'vue'
import dayjs from 'dayjs'
import { seasonCalculate } from '../utils/season.js'

export function useSeasonData() {
    const today = new Date();
    const result = seasonCalculate(today)

  const seasonData = ref([result.current, result.next])
  const curSeason = ref(result.current)
  console.log('seasonData',seasonData)
  return {
    seasonData,
    curSeason
  }
}
