// utils.js

/**
 * Chia một chuỗi thành các đoạn nhỏ hơn với độ dài tối đa.
 * @param {string} content - Chuỗi cần chia nhỏ.
 * @param {number} maxLength - Độ dài tối đa cho mỗi đoạn (mặc định 2000).
 * @returns {string[]} - Mảng các đoạn nhỏ hơn.
 */
function splitMessage(content, maxLength = 2000) {
    const chunks = [];
    while (content.length > 0) {
        let chunk = content.slice(0, maxLength);
        if (content.length > maxLength) {
            const lastSpace = chunk.lastIndexOf(' ');
            if (lastSpace > -1) {
                chunk = content.slice(0, lastSpace);
            }
        }
        chunks.push(chunk.trim());
        content = content.slice(chunk.length).trim();
    }
    return chunks;
}

module.exports = { splitMessage };