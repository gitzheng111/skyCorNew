import { ElMessage } from 'element-plus'

export const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);

  const pad = (n) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 月份从 0 开始
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

export const formatDate = (input) => {
  if (!input) return '';

  let date;

  // 1. 如果是 Date 对象
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // 2. 如果是 "2026年6月30" 这种中文格式
    const zhMatch = input.match(/^(\d{4})年(\d{1,2})月(\d{1,2})/);
    if (zhMatch) {
      date = new Date(`${zhMatch[1]}/${zhMatch[2]}/${zhMatch[3]}`);
    } else {
      // 3. 其他情况直接让 Date 去解析（支持 "2025/6/30", "Sun Oct 26 2025 ..." 等）
      date = new Date(input);
    }
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return ''; // 非法日期

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份从 0 开始
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();

  return `${year}/${month}/${day} ${hour}:${min}`;
};

export const onlyDate = (input) => {
  if (!input) return '';

  let date;

  // 1. 如果是 Date 对象
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // 2. 如果是 "2026年6月30" 这种中文格式
    const zhMatch = input.match(/^(\d{4})年(\d{1,2})月(\d{1,2})/);
    if (zhMatch) {
      date = new Date(`${zhMatch[1]}/${zhMatch[2]}/${zhMatch[3]}`);
    } else {
      // 3. 其他情况直接让 Date 去解析（支持 "2025/6/30", "Sun Oct 26 2025 ..." 等）
      date = new Date(input);
    }
  } else {
    return '';
  }

  if (isNaN(date.getTime())) return ''; // 非法日期

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份从 0 开始
  const day = date.getDate();
  const hour = date.getHours();
  const min = date.getMinutes();

  return `${year}/${month}/${day}`;
};
// 返回年月日：
export const normalizeDate = (dateStr) => {
  const d = new Date(dateStr.replace(/-/g, '/'))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

export const sortBy = (field, type = 'string') => {
  return (a, b) => {
    const va = a[field]
    const vb = b[field]

    // 1. 处理空值：null、undefined、'' 统一放最后
    if (!va && !vb) return 0
    if (!va) return 1
    if (!vb) return -1

    switch (type) {
      case 'number':
        return Number(va) - Number(vb)

      case 'time': {
        // 格式：HH:mm
        const ta = parseTimeToMinutes(va)
        const tb = parseTimeToMinutes(vb)
        return ta - tb
      }

      case 'date': {
        // 格式：YYYY/MM/DD 或 YYYY-MM-DD
        return new Date(va).getTime() - new Date(vb).getTime()
      }

      case 'datetime': {
        return new Date(va).getTime() - new Date(vb).getTime()
      }

      default: // 字符串
        return String(va).localeCompare(String(vb))
    }
  }
}
const parseTimeToMinutes = (t) => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// export const validateFlightNumber = (flightNumber) => {
//     const flightNumberError = ref(false)
//     const val = flightNumber || '';
//     const upperVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

//     if (!upperVal.startsWith('MF')) {
//         flightNumberError.value = true;
//         ElMessage.error('航班号格式错误：必须以 MF 开头');
//         return;
//     }

//     const numPart = upperVal.slice(2);

//     if (numPart.length < 3 || numPart.length > 4 || !/^\d+$/.test(numPart)) {
//         flightNumberError.value = true;
//         ElMessage.error('航班号格式错误：MF 后需为 3~4 位数字');
//     } else {
//         flightNumberError.value = false;
//         flightNumber = `MF${numPart}`; // 纠正格式，保证统一
//     }
//     return flightNumberError
// };
export const validateFlightNumber = (row) => {
  const val = row.flightNumber || '';
  const upperVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!upperVal.startsWith('MF')) {
    ElMessage.error('航班号格式错误：必须以 MF 开头');
    return false;
  }

  const numPart = upperVal.slice(2);

  if (numPart.length < 3 || numPart.length > 4 || !/^\d+$/.test(numPart)) {
    ElMessage.error('航班号格式错误：MF 后需为 3~4 位数字');
    return false;
  }

  // 格式正确时，直接修正 row 的值
  row.flightNumber = `MF${numPart}`;
  return true;
};
export const validateIATA = (row) => {
  const pattern = /^[A-Z]{3}$/;
  if (!pattern.test(row.IATACode)) {
    ElMessage.error('IATA Code 必须是三位大写字母');

    row.IATACode = ''; // 清空无效输入
  }
}
export const validateICAO = (row) => {
  const pattern = /^[A-Z]{4}$/;
  if (!pattern.test(row.ICAOCode)) {
    ElMessage.error('ICAO Code 必须是四位大写字母');

    row.ICAOCode = ''; // 清空无效输入
  }
}
//规范周期
export function normalizeDays(days) {
  // 转成数组数字
  let arr = Array.isArray(days) ? days : (days ? days.toString().split('').map(Number) : [])

  // 初始化 [0,0,0,0,0,0,0]
  const result = Array(7).fill(0)

  // 填充对应位置
  arr.forEach(d => {
    const idx = parseInt(d, 10) - 1
    if (idx >= 0 && idx < 7) {
      result[idx] = d   // 保留原来的数字
    }
  })

  return result
}

export const daysArrayToString = (daysArray) => {
  if (!Array.isArray(daysArray) || daysArray.length !== 7) {
    console.warn("输入必须是长度为7的数组");
    return '';
  }

  return daysArray
    .map((val, idx) => (val === '1' ? (idx + 1).toString() : '')) // 有效的天数
    .join('');
};