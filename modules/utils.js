function getToday() {
    return new Date().toISOString().slice(0,10).replace(/-/g,'');
}

module.exports = { getToday };