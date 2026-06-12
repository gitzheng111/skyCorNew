// utils/smartSearcher.vue/highlight.js

export function highlight(
    text,
    keyword
) {

    if (!text) return ''

    if (!keyword) {
        return text
    }

    const tokens =
        keyword
            .replace(/,/g, ' ')
            .split(/\s+/)
            .filter(Boolean)

    let result = text

    tokens.forEach(token => {

        const reg =
            new RegExp(
                token,
                'ig'
            )

        result =
            result.replace(
                reg,
                '<mark>$&</mark>'
            )
    })

    return result
}