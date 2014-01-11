
describe("SignalReports", function () {
	it("should load initial reports", function () {
		browser.get('/');
		expect($('.navbar .navbar-brand').getText()).toBe("Signal Reports");
	});
});


