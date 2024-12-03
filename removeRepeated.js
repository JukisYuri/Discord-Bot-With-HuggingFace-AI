// Xóa câu hỏi gốc khỏi phản hồi bot
function removeRepeatedQuestion(question, response) {
    // Kiểm tra nếu câu hỏi lặp lại ở đầu câu trả lời
    if (response.startsWith(question)) {
        // Loại bỏ phần câu hỏi lặp lại
        return response.slice(question.length).trim();
    }
    return response;
}

module.exports = { removeRepeatedQuestion };
