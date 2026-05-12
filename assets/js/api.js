/**
 * ========================================================
 * MODULE API CONTROLLER
 * Dự án: Hệ thống Thực hành Trắc địa HCMUS
 * Chức năng: Quản lý kết nối trung tâm giữa Frontend và Google Apps Script
 * ========================================================
 */

// URL Web App của Google Apps Script (Lấy từ file cấu hình .env)
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwPCv22W8Hhi8WRC9kNRXkEbMLSsh2cEzVnZB05ngT0QYNQL2lZOIao05lEawmZEBBc/exec";

const API = {
    url: GAS_ENDPOINT,
    
    // Cài đặt thời gian chờ tối đa (Timeout) là 15 giây (Dành cho mạng 4G yếu ngoài thực địa)
    timeoutDuration: 15000, 

    /**
     * Hàm gọi API Core (Giao tiếp với Google Apps Script)
     * @param {string} action - Tên hành động (VD: 'LOGIN', 'SUBMIT_SESSION')
     * @param {object} payload - Dữ liệu cần gửi lên
     * @returns {Promise<object>} - Kết quả JSON trả về từ Server
     */
    async call(action, payload = {}) {
        // Đóng gói dữ liệu chuẩn bị gửi
        const requestData = {
            action: action,
            data: payload,
            timestamp: new Date().toISOString()
        };

        // Tạo một bộ đếm thời gian (AbortController) để ngắt kết nối nếu mạng quá lag
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutDuration);

        try {
            const response = await fetch(this.url, {
                method: "POST",
                // MẸO CHUYÊN GIA: Dùng 'text/plain' để tránh lỗi CORS Preflight (OPTIONS request) chặn bởi Google
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Xóa bộ đếm nếu gọi API thành công

            // Phân tích kết quả trả về
            const result = await response.json();
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            
            // Xử lý lỗi Timeout khi mạng yếu
            if (error.name === 'AbortError') {
                console.error(`[API Error] Quá thời gian kết nối (${this.timeoutDuration/1000}s)`);
                return { 
                    status: "error", 
                    message: "Kết nối mạng không ổn định. Vui lòng kiểm tra 4G/Wifi và thử lại!" 
                };
            }

            console.error("[API Error] Lỗi hệ thống:", error);
            return { 
                status: "error", 
                message: "Không thể kết nối đến hệ thống máy chủ HCMUS lúc này." 
            };
        }
    },

    /**
     * ==============================================
     * CÁC HÀM NGHIỆP VỤ TRẮC ĐỊA (BUSINESS LOGIC)
     * ==============================================
     */

    /**
     * 1. Nộp bài thực hành (Chung cho cả 9 buổi)
     * @param {string} mssv - Mã số sinh viên
     * @param {number} sessionId - Mã buổi học (1 đến 9)
     * @param {object} sessionData - Số liệu đo đạc (JSON)
     */
    async submitSession(mssv, sessionId, sessionData) {
        return await this.call("SUBMIT_SESSION", {
            mssv: mssv,
            buoiHoc: sessionId,
            data: sessionData
        });
    },

    /**
     * 2. Lấy dữ liệu lịch sử đã nộp (Dành cho việc render bảng Bình sai Buổi 8)
     */
    async getHistory(mssv) {
        return await this.call("GET_HISTORY", { mssv: mssv });
    },

    /**
     * 3. Upload ảnh minh chứng lên Google Drive (Chuyển ảnh sang Base64)
     * @param {string} base64String - Chuỗi mã hóa của ảnh
     * @param {string} fileName - Tên file muốn lưu (VD: Buoi1_22110001.jpg)
     */
    async uploadImage(base64String, fileName) {
        return await this.call("UPLOAD_FILE", {
            filename: fileName,
            mimeType: "image/jpeg",
            fileData: base64String.split(',')[1] // Cắt bỏ phần header data:image/jpeg;base64,
        });
    }
};

// Đảm bảo API object có thể truy xuất toàn cục
window.API = API;
