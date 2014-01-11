
var SignalReports = function () {
	this.inputDialog = $('#input-form');
	this.inputForm   = $('#input-form form');
	this.inputDelete = $('#delete');
	this.inputs = {
		callsign  : element(by.model('editingReport.callsign')),
		frequency : element(by.model('editingReport.frequency')),
		mode      : element(by.model('editingReport.mode')),
		date      : element(by.model('editingReport.date')),
		time      : element(by.model('editingReport.time')),
		ur_rst    : element(by.model('editingReport.ur_rst')),
		my_rst    : element(by.model('editingReport.my_rst')),
		name      : element(by.model('editingReport.name')),
		address   : element(by.model('editingReport.address')),
		memo      : element(by.model('editingReport.memo'))
	};

	this.openForm = function () {
		$('a[href="#new"]').click();
	};

	this.submitForm = function () {
		$('#input-form form input[type=submit]').click();
	};

	this.getReportRow = function (n) {
		var row = by.repeater('report in reports').row(0);
	};

	this.createNewReport  = function (data) {
	};
};



describe("SignalReports", function () {

	beforeEach(function() {
		browser.get('/');
	});

	it("should post new report", function () {
		var signalReports = new SignalReports();

		signalReports.openForm();
		expect(signalReports.inputDialog.isDisplayed()).toBe(true);

		signalReports.inputs.callsign.sendKeys('JH1UMV');
		signalReports.inputs.mode.sendKeys('CW');
		signalReports.inputs.frequency.sendKeys('7.1');

		signalReports.inputs.ur_rst.click();

		expect(signalReports.inputs.date.getAttribute('value')).toMatch(/^\d\d\d\d-\d\d-\d\d$/);
		expect(signalReports.inputs.time.getAttribute('value')).toMatch(/^\d\d:\d\d$/);

		signalReports.inputs.ur_rst.sendKeys('599');
		signalReports.inputs.my_rst.sendKeys('589');
		signalReports.inputs.memo.sendKeys('TEST MEMO');
		signalReports.inputs.name.sendKeys('HIRO');

		signalReports.submitForm();

		var row = by.repeater('report in reports').row(0);
		expect(element(row.column('callsign')).getText()).toEqual('JH1UMV');
		expect(element(row.column('callsign')).getText()).toEqual('JH1UMV');
		expect(element(row.column('mode')).getText()).toEqual('CW');
		expect(element(row.column('frequency')).getText()).toEqual('7.1');
		expect(element(row.column('ur_rst')).getText()).toEqual('599');
		expect(element(row.column('my_rst')).getText()).toEqual('589');
		expect(element(row.column('datetime')).getText()).toMatch(/^\d\d\d\d-\d\d-\d\d \d\d:\d\d$/);
		expect(element(row.column('address')).getText()).toEqual('Japan');
		expect(element(row.column('memo')).getText()).toEqual('TEST MEMO');
		expect(element(row.column('name')).getText()).toEqual('HIRO');
	});

	it("should delete a report", function () {
		var signalReports = new SignalReports();
		var alert;
		element(by.repeater('report in reports').row(0)).click();

		expect(signalReports.inputDialog.isDisplayed()).toBe(true);
		expect(signalReports.inputDelete.isDisplayed()).toBe(true);
		expect(element(by.binding('editType')).getText()).toMatch(/Edit/);

		signalReports.inputDelete.click();
		alert = browser.switchTo().alert();
		expect(alert.getText()).toMatch(/Sure/);
		alert.dismiss();

		expect(signalReports.inputDialog.isDisplayed()).toBe(true);
		expect(signalReports.inputDelete.isDisplayed()).toBe(true);

		signalReports.inputDelete.click();
		alert = browser.switchTo().alert();
		expect(alert.getText()).toMatch(/Sure/);
		alert.accept();

		expect(signalReports.inputDialog.isDisplayed()).toBe(false);
		expect(signalReports.inputDelete.isDisplayed()).toBe(false);
	});
});


