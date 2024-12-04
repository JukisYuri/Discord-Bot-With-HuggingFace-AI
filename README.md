## Mô tả các tệp

### `permission.js`
Tệp này chứa danh sách **ID các kênh** (`channels`) mà bot được phép hoạt động và **ID của chủ sở hữu bot** (`owner_id`). Bạn có thể chỉnh sửa tệp này để thay đổi quyền truy cập của bot vào các kênh hoặc cập nhật thông tin chủ sở hữu.

### `.env`
Tệp này được sử dụng để lưu trữ các thông tin nhạy cảm như **Discord Bot Token** và **HuggingFace Token**. Hãy đảm bảo giữ tệp này an toàn và không chia sẻ công khai để tránh rủi ro bảo mật.

### `autismbot.js`
Đây là tệp chính để chạy bot. Khi khởi động tệp này, bot sẽ kết nối đến Discord và HuggingFace API, đồng thời thực hiện các chức năng được lập trình.

## Cách sử dụng?
Bắt đầu bằng việc clone tất cả đoạn code về máy local, sau đó setup với 2 files `permission.js` và `.env` và khi setup xong hãy quay lại `autismbot.js` để chạy nó
