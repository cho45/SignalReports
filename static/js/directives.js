
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

signalReportsApp.directive('srEditDialog', function (JCCService) {
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
					console.log('formChanged');
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
						if ($this.val() != $this.val().toUpperCase()) {
							$this.val($this.val().toUpperCase()).change();
						}
					}).
				end().
				find('input[name=callsign]').
					blur(function () {
						var $this = $(this);
						if ($this.val() != $this.val().toUpperCase()) {
							$this.val($this.val().toUpperCase()).change();
						}

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
								JCCService.resolve(query.toUpperCase()).then(next);
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
				if (report) {
					scope.formChanged = false;
					inputForm.on('hide.bs.modal', function () {
						inputForm.unbind('hide.bs.modal');
						clearInterval(inputBackupTimer);
						if (scope.formChanged) {
							if (confirm('Sure?')) {
								scope.editing = null;
								return true;
							} else {
								return false;
							}
						} else {
							scope.editing = null;
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
							$('input, textarea').change();
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


