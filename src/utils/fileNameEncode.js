export function fixEncoding(str) {
    // 检查传入的数据是否是有效字符串
    if (typeof str !== 'string' || !str) {
        console.error('Invalid data: ', str);
        return;
    }

    // 将字符串按 Latin1 编码成字节
    const bytes = Uint8Array.from(str, c => c.charCodeAt(0));

    // 用 UTF-8 解码
    try {
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.error('Text decoding failed:', e);
        return null;
    }
}