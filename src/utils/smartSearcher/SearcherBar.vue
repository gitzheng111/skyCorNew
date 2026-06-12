<template>
    <div class="search-card">
        <div class="main-searchBar">
            <SeasonSelect v-model="season" class="season-select" />
            <!-- 搜索框 -->
            <el-input v-model="keyword" clearable size="large" class="search-input" placeholder="搜索航班号、机场、国家、航路、机型...">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
            <div class="search-toolbar">



                <el-tag round type="success" size="large">
                    {{ resultCount }} 条数据
                </el-tag>

            </div>

        </div>

        <!-- 第二行 -->


        <!-- 搜索提示 -->
        <div class="quick-tags">
            快速检索
            <el-tag v-for="item in quickKeywords" :key="item" round effect="plain" class="quick-tag"
                @click="keyword = item">
                {{ item }}
            </el-tag>

        </div>

    </div>
</template>

<script setup>
import {
    ref,
    watch,
    computed
} from 'vue'

import {
    useDebounceFn
} from '@vueuse/core'

import SeasonSelect
    from '../../utils/seasonSelect.vue'

import {
    useSeasonData
} from '../../components/useSeasonUtils.js'

import {
    useSearchIndex
} from './useSearchIndex.js'

import {
    useSmartSearch
} from './useSmartSearch.js'

const quickKeywords = [
  '菲律宾',
  '日本',
  '韩国',
  '泰国',
  'MF',
  'A321',
  'G471'
]
const props = defineProps({
    list: Array,
    mode: String
})

const emit =
    defineEmits([
        'update:result'
    ])

const {
    todaySeason
} = useSeasonData()

const keyword = ref('')

const season = ref(
    todaySeason?.value?.en || ''
)

const resultCount = ref(0)

const indexedList =
    useSearchIndex(
        computed(
            () => props.list
        )
    )

const {
    search
} = useSmartSearch()

function searchData() {

    let data =
        props.list

    if (season.value) {

        data =
            data.filter(
                i =>
                    !i.season ||
                    i.season === season.value
            )
    }

    const indexed =
        indexedList.value.filter(
            i =>
                !season.value ||
                i.raw.season === season.value
        )

    const result =
        search(
            indexed,
            keyword.value
        )

    resultCount.value =
        result.length

    emit(
        'update:result',
        result
    )
}

const debouncedSearch =
    useDebounceFn(
        searchData,
        200
    )

watch(
    [
        keyword,
        season,
        () => props.list
    ],
    debouncedSearch,
    {
        immediate: true
    }
)
</script>

<style scoped>
.search-card {

    background: white;

    border-radius: 20px;

    width: 95%;

    margin: auto;

    padding: 18px 22px;

    /* margin: 18px 0px; */

    /* border: 1px solid #ebeef5; */

    transition: .25s;
}

.search-card:hover {

    box-shadow:
        0 10px 30px rgba(0, 0, 0, .04);
}

.main-searchBar {
    display: flex;

    align-items: center;

    gap: 18px;
}

.search-input {
    width: 80%;
    /* height: 40px; */
    /* margin-bottom: 14px; */
}

.search-toolbar {

    display: flex;

    align-items: center;

    justify-content: space-between;
}

.season-select {

    width: 10%;
}

.quick-tags {

    margin-top: 14px;

    display: flex;

    flex-wrap: wrap;

    gap: 8px;
}

.quick-tag {

    cursor: pointer;

    transition: .2s;
}

.quick-tag:hover {

    transform: translateY(-1px);
}
</style>