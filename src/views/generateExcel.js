import express from 'express';
import fs from 'fs';
import path from 'path';
import XlsxTemplate from 'xlsx-template';
import XLSX from 'xlsx';

const router = express.Router();
function urlToLocalPath(fileUrl) {
    const { pathname } = new URL(fileUrl)
    // pathname: /uploads/applyTemplate_files/韩国/xxx.xlsx

    return path.join(process.cwd(), pathname)
}
router.post('/excel', async (req, res) => {
    try {
        const data = req.body.data;
        console.log('收到的data', data)

        // console.log('收到的data', data.templatePath)
        // console.log('收到的data', new URL(data.templatePath))
        // console.log('收到的data',  new URL(data.templatePath).pathname)


        const pathname = decodeURIComponent(
            new URL(data.templatePath).pathname
        )
        const templatePath = path.join(process.cwd(), pathname)
        if (!fs.existsSync(templatePath)) {
            throw new Error(`模板文件不存在：${templatePath}`)
        }
        const content = fs.readFileSync(templatePath);

        // 2. 创建模板实例
        const template = new XlsxTemplate(content);

        // 3. 替换变量（第一个 sheet）
        template.substitute(1, data);

        // 4. 生成文件
        const buffer = template.generate({ type: 'nodebuffer' });

        const wb = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        
        console.log('📄 Excel 内容预览（前 30 个单元格）:');
        Object.keys(sheet)
          .filter(k => !k.startsWith('!'))
          .slice(0, 30)
          .forEach(k => {
            console.log(k, '=>', sheet[k].v);
          });
        // 5. 返回文件
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="schedule.xlsx"'
        );
        res.end(buffer)
        // res.send(buffer);

    } catch (err) {
        console.error('Excel 生成失败:', err);
        res.status(500).json({ message: 'Excel 生成失败' });
    }
});

export default router;