
describe('controllers', function () {
	describe("SignalReportListCtrl", function () {
		var scope, ctrl, $httpBackend;

		beforeEach(module('signalReportsApp'));
		beforeEach(inject(function (_$httpBackend_, $rootScope, $controller) {
			$httpBackend = _$httpBackend_;
			$httpBackend.expectGET('/api/entries?query=').respond({
				ok : true,
				has_more : false,
				entries : [
					{
						id: 1
					}
				]
			});

			scope = $rootScope.$new();
			ctrl = $controller('SignalReportListCtrl', { $scope: scope });
		}));


		it('should load initial array of reports', inject(function () {
			expect(scope.reports.length).toBe(0);

			$httpBackend.flush();

			expect(scope.reports.length).toBe(1);
		}));
	});
});

