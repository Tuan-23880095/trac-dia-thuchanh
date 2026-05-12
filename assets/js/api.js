const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxJw0k2Sj3RVFiLANLdLjE0KtUpbvMBYpUBDs_k3nQ49KCAq4wayoZsCJaW17dmbsc7/exec";

async function submitSessionData(mssv, sessionNumber, data) {
    const payload = {
        action: "SUBMIT_DATA",
        mssv: mssv,
        session: sessionNumber,
        payload: JSON.stringify(data)
    };

    try {
        const response = await fetch(GAS_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối hệ thống:", error);
    }
}
