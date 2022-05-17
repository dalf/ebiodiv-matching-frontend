module.exports = {
 publicPath: '',
 outputDir: process.env.NODE_ENV === 'production'
    ? 'demo'
    : 'dev'
}