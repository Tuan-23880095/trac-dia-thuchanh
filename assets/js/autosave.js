/**
 * ========================================================
 * MODULE AUTOSAVE (LƯU DỮ LIỆU TỰ ĐỘNG)
 * Dự án: Hệ thống Thực hành Trắc địa HCMUS
 * Chức năng: Lưu nháp số liệu nhập vào LocalStorage để tránh mất phiên
 * ========================================================
 */

const AutoSave = {
    formId: 'sessionForm', // ID mặc định của form trong các trang Buổi học (session1.html,...)
    storageKey: '',        // Khóa lưu trữ sẽ được tạo động
    timeoutId: null,       // Bộ đếm cho cơ chế Debounce

    init() {
        const form = document.getElementById(this.formId);
        if (!form) return;

        // 1. Tạo Storage Key duy nhất (Kết hợp MSSV và tên file trang hiện tại)
        // Việc này giúp nháp của Buổi 1 không bị đè lên Buổi 2
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : { mssv: 'guest' };
        const pageName = window.location.pathname.split('/').pop() || 'session';
        
        this.storageKey = `autosave_${user.mssv}_${pageName}`;

        // 2. Khôi phục dữ liệu ngay khi tải trang xong
        this.loadData(form);

        // 3. Lắng nghe các sự kiện gõ phím/chọn đáp án để lưu tự động
        this.bindEvents(form);
    },

    bindEvents(form) {
        // Lắng nghe sự kiện 'input' (gõ text/number) và 'change' (chọn select/checkbox)
        const saveAction = (e) => {
            // Cơ chế Debounce: Đợi sinh viên ngừng gõ 500ms mới tiến hành lưu
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.saveData(form);
                this.showIndicator();
            }, 500);
        };

        form.addEventListener('input', saveAction);
        form.addEventListener('change', saveAction);
    },

    saveData(form) {
        const formData = new FormData(form);
        const dataObj = {};

        // Thu thập các input dạng text, number, select
        for (let [key, value] of formData.entries()) {
            dataObj[key] = value;
        }

        // Thu thập riêng các input dạng checkbox (vì FormData bỏ qua checkbox không check)
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            dataObj[cb.name] = cb.checked;
        });

        // Nén thành chuỗi JSON và lưu vào bộ nhớ trình duyệt
        localStorage.setItem(this.storageKey, JSON.stringify(dataObj));
    },

    loadData(form) {
        const savedString = localStorage.getItem(this.storageKey);
        if (!savedString) return; // Không có nháp thì bỏ qua

        try {
            const dataObj = JSON.parse(savedString);
            
            // Duyệt qua từng trường dữ liệu đã lưu để đắp ngược lại Form
            for (let key in dataObj) {
                const input = form.elements[key];
                if (input) {
                    // Checkbox cần xử lý riêng
                    if (input.type === 'checkbox') {
                        input.checked = dataObj[key];
                    } 
                    // Các loại input khác
                    else {
                        input.value = dataObj[key];
                    }
                    
                    // Kích hoạt giả sự kiện 'input' để các hàm tính Trung Bình tự động chạy lại
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            console.log("[AutoSave] Khôi phục số liệu thành công.");
        } catch(e) {
            console.error("[AutoSave] Lỗi khôi phục dữ liệu nháp:", e);
        }
    },

    /**
     * Hàm dùng để xóa nháp. 
     * Rất quan trọng: Phải gọi hàm này sau khi sinh viên bấm SUBMIT THÀNH CÔNG!
     */
    clearData() {
        if (this.storageKey) {
            localStorage.removeItem(this.storageKey);
            console.log("[AutoSave] Đã xóa bản nháp sau khi nộp bài.");
        }
    },

    /**
     * Hiển thị Toast thông báo trạng thái "Đã lưu nháp" góc dưới màn hình
     */
    showIndicator() {
        let indicator = document.getElementById('autosave-indicator');
        
        // Nếu chưa có thẻ thông báo trong HTML thì tự động tạo bằng JS
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.className = 'fixed bottom-4 right-4 bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg opacity-0 transition-opacity duration-300 z-50 pointer-events-none flex items-center gap-1.5';
            indicator.innerHTML = `
                <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
                Đã lưu nháp
            `;
            document.body.appendChild(indicator);
        }

        // Hiển thị thông báo lên
        indicator.classList.remove('opacity-0');

        // Mờ đi sau 2 giây
        if (this.indicatorTimeout) clearTimeout(this.indicatorTimeout);
        this.indicatorTimeout = setTimeout(() => {
            indicator.classList.add('opacity-0');
        }, 2000);
    }
};

// Khởi chạy hệ thống AutoSave khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => AutoSave.init());
