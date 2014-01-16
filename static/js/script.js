var signalReportsApp = angular.module('signalReportsApp', ['ngResource']);

signalReportsApp.Utils = {
	RST : {
		R : [
			"Unreadable",
			"Barely readable, occasional words distinguishable",
			"Readable with considerable difficulty",
			"Readable with practically no difficulty",
			"Perfectly readable"
		],
		S : [
			"Faint signal, barely perceptible",
			"Very weak",
			"Weak",
			"Fair",
			"Fairly good",
			"Good",
			"Moderately strong",
			"Strong",
			"Very strong signals"
		],
		T : [
			"Sixty cycle a.c or less, very rough and broad",
			"Very rough a.c., very harsh and broad",
			"Rough a.c. tone, rectified but not filtered",
			"Rough note, some trace of filtering",
			"Filtered rectified a.c. but strongly ripple-modulated",
			"Filtered tone, definite trace of ripple modulation",
			"Near pure tone, trace of ripple modulation",
			"Near perfect tone, slight trace of modulation",
			"Perfect tone, no trace of ripple or modulation of any kind"
		]
	},

	setDateAndTime : function (entry) {
		var dt = new Date(entry.datetime * 1000);

		entry.date = dt.strftime('%Y-%m-%d');
		entry.time = dt.strftime('%H:%M');
		return entry;
	},

	JCC : {
		resolve : function (number) {
			var ret = new Deferred();
			$.ajax({
				url: "/js/jcc.json",
				type : "GET",
				data : {},
				dataType: 'json'
			}).
			done(function (data) {
				signalReportsApp.Utils.JCC.resolve = function (number) {
					var ret = new Deferred();
					setTimeout(function () {
						try {
							var index = data.index[number];
							ret.call(data.list.slice(index[0], index[0] + index[1]));
						} catch (e) {
							ret.call([]);
						}
					}, 0);
					return ret;
				};
				signalReportsApp.Utils.JCC.resolve(number).next(function (list) {
					ret.call(list);
				});
			}).
			fail(function (e) {
				ret.fail(e);
			});
			return ret;
		}
	}
};


//signalReportsApp.config(function ($httpProvider) {
//	 $httpProvider.defaults.headers.post =
//	 $httpProvider.defaults.headers.put =
//	 $httpProvider.defaults.headers.patch = {
//		 'Content-Type' : 'application/x-www-form-urlencoded' 
//	 };
//});

signalReportsApp.filter('strftime', function () {
	return function (datetime, format) {
		return new Date(datetime * 1000).strftime(format) ;
	};
});

signalReportsApp.filter('frequency', function () {
	console.log('frequency');
	return function (frequency) {
		return String(+frequency * 1e6).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,').replace(/,/, '.').slice(0, -1);
	};
});

signalReportsApp.factory('$exceptionHandler', function () {
	return function (exception, cause) {
		alert(exception.message);
	};
});


signalReportsApp.factory('Reports', function ($resource) {
	var transformResponse = function (data, headers) {
		data = angular.fromJson(data);
		if (!data.ok) throw "API failed";
		return data.entry;
	};

	var transformRequest = function (data, headers) {
		var ret = '';
		for (var key in data) if (data.hasOwnProperty(key)) {
			var val = data[key];
			ret += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(val);
		}
		return ret;
	};

	var Reports = $resource('/api/entries', { id : '@id' }, {
		'query':  {
			method:'GET',
			isArray: true,
			transformResponse : function (data, headers) {
				data = angular.fromJson(data);
				if (!data.ok) throw "API failed";
				Reports.hasMore = data.has_more;
				Reports.count = data.count;
				return data.entries;
			}
		},
		'save':  {
			method:'POST',
			transformResponse : transformResponse,
			transformRequest: transformRequest,
			headers : {
				'Content-Type' : 'application/x-www-form-urlencoded'
			}
		},
		'delete':  {
			method:'DELETE',
			transformResponse : transformResponse
		}
	});
	return Reports;
});

signalReportsApp.directive('srTypeaheadCallsign', function () {
	return {
		link : function (scope, element, attrs) {
			element.typeahead({
				name : 'callsign',
				template: 'callcompl',
				engine: {
					compile : function (string) {
						return {
							render : template(string)
						};
					}
				},
				remote : '/api/callsign?q=%QUERY'
			});
		}
	};
});

signalReportsApp.directive('srTypeaheadMode', function () {
	return {
		link : function (scope, element, attrs) {
			element.typeahead({
				name : 'mode',
				local : [
					'CW',
					'SSB',
					'AM',
					'FM',
					'RTTY'
				]
			});
		}
	};
});

signalReportsApp.directive('srEditDialog', function () {
	return {
		link : function (scope, inputForm, attrs) {
			var inputBackupTimer;
			var inputFormForm = inputForm.find('form');

			inputForm.
				on('shown.bs.modal', function () {
					var callsign = inputForm.find('input[name=callsign]');

					callsign.
						focus().
						typeahead('setQuery', callsign.val());
				}).
				find('input, textarea').
					change(function () {
						scope.formChanged = true;
					}).
				end().
				find('input[name=mode]').
					change(function () {
						var classes = inputForm.attr('class');
						for (var i = 0, len = classes.length; i < len; i++) {
							if (classes[i].match(/^mode-/)) {
								inputForm.removeClass(classes[i]);
							}
						}

						inputForm.addClass('mode-' + this.value);
					}).
					change().
					blur(function () {
						var $this = $(this);
						$this.val($this.val().toUpperCase()).change();
					}).
				end().
				find('input[name=callsign]').
					blur(function () {
						var $this = $(this);
						$this.val($this.val().toUpperCase()).change();

						if ($this.val() && !inputFormForm.find('input[name=time]').val()) {
							$('#now').click();
						}

						$.ajax({
							url: "/api/callsign",
							type : "GET",
							data : { q : $this.val() },
							dataType: 'json'
						}).
						done(function (data) {
							if (data.length && data[0].value === $this.val()) {
								if (!scope.editingReport.name) scope.editingReport.name = data[0].name || '';
								if (!scope.editingReport.address) scope.editingReport.address = data[0].address || data[0].country || '';
								scope.$apply();
							}
						}).
						fail(function (e) {
						});
					}).
					keydown(function (e) {
						var $this = $(this);
						var key = keyString(e);
						if (key === 'RET') {
							$this.data('ttView').inputView.trigger('enterKeyed', e);
						} else
						if (key === 'C-n') {
							e.ctrlKey = false;
							$this.data('ttView').inputView.trigger('downKeyed', e);
						} else
						if (key === 'C-p') {
							e.ctrlKey = false;
							$this.data('ttView').inputView.trigger('upKeyed', e);
						}
					}).
				end().
				find('input[name=ur_rst], input[name=my_rst]').
					focus(function () {
						$(this).parent().find('.rst-dropdown').show();
					}).
					blur(function () {
						$(this).parent().find('.rst-dropdown').hide();
					}).
					keyup(function () {
						var $this = $(this);
						var rst = $this.val().split('');

						$this.parent().find('tr.readability td').text( (rst[0] || '') + ' ' + (signalReportsApp.Utils.RST.R[rst[0] - 1] || '') );
						$this.parent().find('tr.strength td').text( (rst[1] || '') + ' ' + (signalReportsApp.Utils.RST.S[rst[1] - 1] || '') );
						$this.parent().find('tr.tone td').text( (rst[2] || '') + ' ' + (signalReportsApp.Utils.RST.T[rst[2] - 1] || '') );
					}).
				end().
				find('textarea').
					textcomplete([
						{
							match : /(^|\s)(jc[cg]\d{2,})$/i,
							search : function (query, next) {
								signalReportsApp.Utils.JCC.resolve(query.toUpperCase()).next(next);
							},
							template : function (value) {
								return value.number + ' (' + value.name + ')';
							},
							replace : function (value) {
								return '$1' + value.number + ' ';
							}
						}
					]).
				end()
				;
			
			scope.$watch('editing', function (report) {
				console.log('editing');
				// reset form
				inputFormForm.deserialize({
					frequency : '',
					mode      : '',
					date      : '',
					time      : '',
					callsign  : '',
					ur_rst    : '',
					my_rst    : '',
					name      : '',
					address   : '',
					memo      : '',
					id        : ''
				});

				if (report) {
					scope.formChanged = false;
					inputForm.unbind('hide.bs.modal').on('hide.bs.modal', function () {
						clearInterval(inputBackupTimer);
						if (scope.editing && scope.formChanged) {
							if (confirm('Sure?')) {
								scope.editing = null;
								return true;
							} else {
								return false;
							}
						}
					});

					if (scope.isNew) {
						var last = scope.reports[0];
						if (last) {
							// fill in partial data
							scope.editingReport.frequency = last.frequency;
							scope.editingReport.mode = last.mode;
						}

						if (localStorage.inputBackup) {
							console.log('Restore from backup');
							inputFormForm.deserialize(localStorage.inputBackup);
						}

						inputBackupTimer = setInterval(function () {
							if (scope.formChanged) {
								localStorage.inputBackup = inputFormForm.serialize();
								console.log('backup saved');
							}
						}, 1000);
					} else {
						var data = angular.copy(report);
						signalReportsApp.Utils.setDateAndTime(data);
						inputFormForm.deserialize(data);
					}

					inputForm.modal({
						keyboard: false
					});
				} else {
					inputForm.find('form')[0].reset();
					inputForm.modal('hide');
				}
			});
		}
	};
});

signalReportsApp.controller('SignalReportListCtrl', function ($scope, $http, $timeout, Reports) {
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
		if (report) {
			$scope.editing = report;
			$scope.isNew   = false;
			$scope.editType = 'Edit (id=' + report.id + ')';
		} else {
			$scope.editing = new Reports({});
			$scope.isNew   = true;
			$scope.editType = 'New';
		}
		$scope.editingReport = signalReportsApp.Utils.setDateAndTime(angular.copy($scope.editing));
		console.log($scope.editingReport);
	};

	$scope.closeForm = function () {
		$scope.editing = null;
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
		var report = $scope.editing;
		var data = $scope.editingReport;
		for (var key in data) if (data.hasOwnProperty(key)) {
			report[key] = data[key];
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
