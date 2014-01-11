exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: [
        '*spec.js'
    ],

    baseUrl : 'http://localhost:5000',

    jasmineNodeOpts: {
        showColors: true // Use colors in the command line report.
    }
};
