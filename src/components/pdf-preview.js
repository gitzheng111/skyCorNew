
import { ref, onBeforeUnmount } from 'vue'
// import * as pdfjsLib from 'pdfjs-dist/webpack'
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// import 'pdfjs-dist/build/pdf.worker.entry'
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js'
console.log('Worker状态:', pdfjsLib.GlobalWorkerOptions.workerPort);

console.log('pdfjsLib', pdfjsLib)

export function usePdfPreview() {
    const previewVisible = ref(false);
    const previewContent = ref(null);
    const currentPage = ref(1);
    const pageCount = ref(0);
    const pdfDocument = ref(null);

    const previewPdf = async (file) => {
        const fileReader = new FileReader();
        console.log('file',file)

        fileReader.onload = async (event) => {
            console.log('event',event)
            const typedArray = new Uint8Array(event.target.result);
            console.log('typedArray',typedArray)

            try {
                pdfDocument.value = await pdfjsLib.getDocument(typedArray).promise;
                console.log('pdfDocument', pdfDocument.value);
                if (!pdfDocument.value) {
                  throw new Error('无法加载 PDF 文档');
                }
              } catch (error) {
                console.error('加载 PDF 文档失败:', error);
              }            
              console.log('pdfDocument',pdfDocument.value)

            pageCount.value = pdfDocument.value.numPages;
            
            renderPage(currentPage.value);
        };
        fileReader.readAsArrayBuffer(file);
        fileReader.onerror = (error) => {
            console.error('文件读取错误:', error);
          };
    };

    const renderPage = async (pageNumber) => {
        if (pdfDocument.value) {
            const page = await pdfDocument.value.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.getElementById('pdf-preview-container').appendChild(document.createElement('canvas'));
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;
        }
    };

    const nextPage = () => {
        if (currentPage.value < pageCount.value) {
            currentPage.value++;
            renderPage(currentPage.value);
        }
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            renderPage(currentPage.value);
        }
    };

    return {
        previewVisible,
        previewPdf,
        currentPage,
        pageCount,
        nextPage,
        prevPage
    };
}
// export function usePdfPreview() {
//     const pdfDoc = ref(null)
//     const currentPage = ref(1)
//     const pageCount = ref(0)
//     const previewPdf = async (file) => {
//         console.log('file',file)

//         // let blobUrl = null;
//         try {
//             if (!file || !(file instanceof Blob)) {
//                 throw new Error('无效的文件对象');
//             }
//             if (file.size === 0) {
//                 throw new Error('文件内容为空');
//             }
//             // blobUrl = URL.createObjectURL(file);
//             file.arrayBuffer().catch(err => {
//                 console.error('文件读取失败:', err);
//               });
//             let arrayBuffer = await file.arrayBuffer();
            
//             if (arrayBuffer.byteLength ===0) {
//                 arrayBuffer = await createStableArrayBuffer(file);
//                 console.error('Buffer可能未正确加载');

//             }
//             console.log('arrayBuffer',arrayBuffer)
//             console.log('arrayBuffer.byteLength',arrayBuffer.byteLength)

//             const loadingTask = pdfjsLib.getDocument(arrayBuffer);
//             const pdf = await Promise.race([
//                 loadingTask.promise,
//                 new Promise((_, reject) => 
//                     setTimeout(() => reject(new Error('PDF加载超时')), 5000)
//                 )
//             ]);
    
//             pdfDoc.value = pdf;
//             pageCount.value = pdf.numPages;
//             await renderPage(currentPage.value);
//         } finally {
//             // blobUrl && URL.revokeObjectURL(blobUrl);
//         }
//     }
//     function createStableArrayBuffer(file) {
//         return new Promise((resolve) => {
//             const reader = new FileReader();
//             reader.onload = () => {
//                 const originalBuf = reader.result;
//                 // 创建新副本
//                 const newBuf = new ArrayBuffer(originalBuf.byteLength);
//                 new Uint8Array(newBuf).set(new Uint8Array(originalBuf));
//                 resolve(newBuf);
//             };
            
//             reader.readAsArrayBuffer(file);
//             reader.onerror = (e) => reject(new Error(`文件读取失败: ${e}`));

//         });
//     }
//     const renderPage = async (pageNum) => {
//         if (!pdfDoc.value) return

//         const page = await pdfDoc.value.getPage(pageNum)
//         const canvas = document.createElement('canvas')
//         const viewport = page.getViewport({ scale: 1.5 })

//         canvas.height = viewport.height
//         canvas.width = viewport.width

//         const ctx = canvas.getContext('2d')
//         await page.render({
//             canvasContext: ctx,
//             viewport: viewport
//         }).promise

//         const container = document.getElementById('pdf-preview-container')
//         container.innerHTML = ''
//         container.appendChild(canvas)
//     }

//     onBeforeUnmount(() => {
//         if (pdfDoc.value) {
//             pdfDoc.value.destroy()
//         }
//     })

//     return {
//         previewPdf,
//         currentPage,
//         pageCount,
//         nextPage: () => {
//             if (currentPage.value < pageCount.value) {
//                 currentPage.value++
//                 renderPage(currentPage.value)
//             }
//         },
//         prevPage: () => {
//             if (currentPage.value > 1) {
//                 currentPage.value--
//                 renderPage(currentPage.value)
//             }
//         }
//     }
// }
