/**
 * ========================================================
 * MODULE XUẤT BÁO CÁO PDF (PDF EXPORTER)
 * Dự án: Hệ thống Thực hành Trắc địa 
 * Chức năng: Ánh xạ dữ liệu từ Form vào Template Ẩn và render file PDF chuẩn A4
 * Yêu cầu thư viện: html2pdf.js (Cần chèn CDN vào file HTML)
 * ========================================================
 */

const PDFExporter = {
    /**
     * Hàm cấu hình và xuất PDF
     * @param {string} templateId - ID của thẻ div chứa mẫu A4 (thường để display: none)
     * @param {string} sessionName - Tên buổi thực hành (để đặt tên file)
     */
    async export(templateId, sessionName = "Buoi_Thuc_Hanh") {
        const templateElement = document.getElementById(templateId);
        
        if (!templateElement) {
            console.error(`[PDF Exporter] Không tìm thấy template với ID: ${templateId}`);
            alert("Lỗi: Không tìm thấy mẫu báo cáo!");
            return;
        }

        // Lấy thông tin sinh viên từ phiên đăng nhập (đã lưu ở bước Auth)
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : { mssv: 'Khach', name: 'Chưa đăng nhập' };
        
        // Đặt tên file xuất ra (Ví dụ: Buoi1_22110001_15-05-2026.pdf)
        const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        const filename = `${sessionName}_${user.mssv}_${dateStr}.pdf`;

        // Chuẩn bị giao diện Template (Bỏ class hidden tạm thời để html2canvas có thể chụp ảnh)
        templateElement.classList.remove('hidden');
        templateElement.style.display = 'block';

        // Điền trước các thông tin chung của sinh viên vào template
        this.fillContextData(templateElement, user);

        // Nút bấm chuyển sang trạng thái Loading (nếu có id là btnExportPDF)
        const btn = document.getElementById('btnExportPDF');
        let originalBtnText = "Xuất báo cáo PDF";
        if (btn) {
            originalBtnText = btn.innerHTML;
            btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tạo PDF...`;
            btn.disabled = true;
        }

        // Cấu hình thông số chuẩn A4 cho in ấn hành chính
        const opt = {
            margin:       15, // Căn lề 15mm chuẩn văn bản
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, // Scale = 2 để chữ và bảng biểu không bị vỡ hạt (anti-aliasing)
                useCORS: true, // Cho phép load ảnh minh chứng từ Google Drive
                logging: false 
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // Chạy quá trình build PDF
            await html2pdf().set(opt).from(templateElement).save();
            console.log(`[PDF Exporter] Đã tải xuống file: ${filename}`);
        } catch (error) {
            console.error("[PDF Exporter] Lỗi khi tạo PDF:", error);
            alert("Có lỗi xảy ra trong quá trình tạo PDF. Hãy thử lại!");
        } finally {
            // Ẩn lại Template và trả lại trạng thái nút bấm
            templateElement.classList.add('hidden');
            templateElement.style.display = 'none';
            if (btn) {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        }
    },

    /**
     * Hàm Helper: Tự động ánh xạ (Map) dữ liệu từ LocalStorage/Form vào trong Template HTML.
     * Thuật toán: Tìm tất cả các thẻ có chứa data-pdf-field="tên_biến" và điền giá trị tương ứng.
     */
    fillContextData(templateElement, user) {
        // 1. Điền thông tin cá nhân
        const contextData = {
            student_name: user.name || user.fullname,
            student_id: user.mssv,
            group_id: user.classId || 'N/A',
            access_datetime: new Date().toLocaleString('vi-VN')
        };

        // 2. Điền số liệu đo đạc (Lấy từ hệ thống AutoSave)
        const pageName = window.location.pathname.split('/').pop() || 'session';
        const storageKey = `autosave_${user.mssv}_${pageName}`;
        const savedString = localStorage.getItem(storageKey);
        
        if (savedString) {
            const formData = JSON.parse(savedString);
            Object.assign(contextData, formData); // Gộp chung số đo vào mảng biến
        }

        // 3. Quét vòng lặp và gán giá trị vào Template
        for (const [key, value] of Object.entries(contextData)) {
            // Tìm các node dạng <span data-pdf-field="val_avg"></span>
            const nodes = templateElement.querySelectorAll(`[data-pdf-field="${key}"]`);
            nodes.forEach(node => {
                // Kiểm tra nếu là URL hình ảnh
                if (typeof value === 'string' && value.startsWith('data:image')) {
                    node.innerHTML = `<img src="${value}" alt="Minh chứng" style="max-width:100%; height:auto; border-radius:8px;" />`;
                } else {
                    node.textContent = value || '........';
                }
            });
        }
    }
};

// Khai báo ra môi trường Global để các file HTML có thể gọi thẳng
window.PDFExporter = PDFExporter;
