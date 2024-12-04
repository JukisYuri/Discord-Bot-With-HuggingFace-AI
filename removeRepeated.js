// Xóa câu hỏi gốc khỏi phản hồi bot
function removeRepeatedQuestion(question, response) {
    const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape ký tự đặc biệt
    const regex = new RegExp(`^${escapedQuestion}\\s*`, 'i');
    return response.replace(regex, '').trim();
}

module.exports = { removeRepeatedQuestion };