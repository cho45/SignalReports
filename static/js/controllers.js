signalReportsApp.controller('SignalReportListCtrl', function ($scope, $http, $timeout, $interval, $document, Reports, CATSocketService) {
	$document.bind('keydown', function (e) {
		var key = keyString(e);
		if (key === 'C-RET') {
			e.preventDefault();
			if ($scope.editing) {
				$scope.submit();
			} else {
				$scope.openForm();
			}
			$scope.$apply();
		} else {
		}
	});

	$scope.search = function me (immediate) {
		if (me.timer) $timeout.cancel(me.timer);

		if (immediate) {
			$scope.load();
			me.prev = $scope.query;
		} else {
			me.timer = $timeout(function () {
				if (me.prev !== $scope.query) {
					$scope.load();
					me.prev = $scope.query;
				}
			}, 500);
		} 
	};


	$scope.load = function () {
		$scope.reports = Reports.query({ query : $scope.query }, function (data) {
			$scope.total   = Reports.count;
			$scope.hasMore = Reports.hasMore;
		});
	};

	$scope.loadNext = function () {
		var before = $scope.reports[$scope.reports.length-1].id;
		var reports = Reports.query({ query : $scope.query, before: before }, function (data) {
			$scope.reports = $scope.reports.concat(reports);
			$scope.hasMore = Reports.hasMore;
		});
	};

	$scope.openForm = function (report) {
		console.log('openForm', $scope.editing);
		$scope.hasBackup = false;
		if (report) {
			$scope.editing = report;
			$scope.isNew   = false;
			$scope.editType = 'Edit (id=' + report.id + ')';
		} else {
			if (localStorage.inputBackup) {
				try {
					var backup = new Reports(angular.fromJson(localStorage.inputBackup));
					$scope.hasBackup = backup;
				} catch (e) {
					console.log('Failed to parse json');
				}
			}

			if (!$scope.editing) {
				var last = $scope.reports[0];
				if (last) {
					console.log('fillin last', last);
					$scope.editing = new Reports({
						frequency : last.frequency,
						mode : last.mode
					});
				} else {
					$scope.editing = new Reports({});
				}
			}
			$scope.isNew   = true;
			$scope.editType = 'New';

			$scope.backupTimer = $interval(function () {
				if ($scope.formChanged) {
					localStorage.inputBackup = angular.toJson($scope.editingReport);
					console.log(localStorage.inputBackup);
				}
			}, 1000);
		}
		$scope.editingReport = signalReportsApp.Utils.setDateAndTime(angular.copy($scope.editing));

		if ($scope.isNew) {
			CATSocketService.bind('message', function (e, data) {
				console.log(['isNew', data]);
				$scope.editingReport.frequency = data.frequency / 1e6;
				$scope.editingReport.mode = data.mode;
				$scope.editingReport.tx_power = data.power;
			});

			if (CATSocketService.connected)  CATSocketService.triggerHandler('message', [ CATSocketService.status ]);
		}
	};

	$scope.restoreBackup = function () {
		console.log('restoreBackup');
		$scope.editingReport = $scope.hasBackup;
		$scope.hasBackup = null;
	};

	$scope.closeForm = function () {
		console.log('closeForm');
		$scope.editing = null;
		$scope.editingReport = null;
		$interval.cancel($scope.backupTimer);
		CATSocketService.unbind('message');
	};

	$scope.deleteReport = function () {
		if (confirm('Sure to delete this entry?')) {
			$scope.editing.$delete(function () {
				for (var i = 0, it; (it = $scope.reports[i]); i++) {
					if (it.id === $scope.editing.id) {
						$scope.reports.splice(i, 1);
						break;
					}
				}
				$scope.editing = null;
				$scope.total--;
			});
		}
	};

	$scope.submit = function () {
		console.log('submit');
		var report = $scope.editing;
		var data = $scope.editingReport;
		for (var key in data) if (data.hasOwnProperty(key)) {
			report[key] = data[key] || '';
		}
		report.tz = (new Date()).getTimezoneOffset();

		report.$save(function () {
			localStorage.inputBackup = '';
			$scope.formChanged = false;
			$scope.editing = null;
			if ($scope.isNew) {
				$scope.reports.unshift(report);
				$scope.total++;
			}
		});
	};

	$scope.setDateTime = function () {
		var now = new Date();
		$scope.editingReport.date = 
			now.getFullYear() + '-' +
			String(now.getMonth() + 101).slice(1) + '-' +
			String(now.getDate() + 100).slice(1);

		$scope.editingReport.time = 
			String(now.getHours() + 100).slice(1) + ':' +
			String(now.getMinutes() + 100).slice(1);
	};

	$scope.query = "";
	$scope.hasMore = false;
	$scope.editing = null;
	$scope.orderProp = 'id';
	$scope.total = 0;
	$scope.load();
});

