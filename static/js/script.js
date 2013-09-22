
var RST = {
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
};

SignalReports = {
	tz : (new Date().getTimezoneOffset()),

	setDateAndTime : function (entry) {
		var dt = new Date(entry.datetime * 1000);

		entry.date = dt.strftime('%Y-%m-%d');
		entry.time = dt.strftime('%H:%M');
	},
	
	init : function () {
		var self = this;

		self.inputForm = $('#input-form');
		self.inputFormForm = self.inputForm.find('form');
		self.entriesContainer = $('#entries');

		self.bindEvents();
		self.loadEntries();
	},

	loadEntries : function (opts) {
		var self = this;

		$.ajax({
			url: "/api/entries",
			type : "GET",
			data : opts,
			dataType: 'json'
		}).
		done(function (data) {
			for (var i = 0, it; (it = data.entries[i]); i++) {
				var row = $(template('entry', it));
				row.data('data', it);
				row.appendTo(self.entriesContainer);
			}
		}).
		fail(function (e) {
		});

	},

	bindEvents : function () {
		var self = this;

		self.inputForm.
			on('shown.bs.modal', function () {
				self.inputForm.find('input[name=frequency]').focus();
			}).
			on('hide.bs.modal', function () {
				clearInterval(self.inputForm.data('timer'));
				if (self.inputForm.data('changed')) {
					return confirm('Sure?');
				}
			});

		self.inputForm.find('form').submit(function () {
			var $this = $(this);
			var data = $this.serializeArray();
			data.push({ name : 'tz', value: (new Date()).getTimezoneOffset()  });
			$.ajax({
				url: "/api/entries",
				type : "POST",
				data : data,
				dataType: 'json'
			}).
			done(function (data) {
				localStorage.inputBackup = '';

				self.inputForm.data('changed', false);
				self.inputForm.find('form')[0].reset();
				self.inputForm.modal('hide');

				var row = $(template('entry', data.entry));
				row.data('data', data.entry);

				var exists = self.entriesContainer.find('[data-id=' + data.entry.id + ']');
				if (exists.length) {
					exists.replaceWith(row);
				} else {
					row.prependTo(self.entriesContainer);
				}
			}).
			fail(function (e) {
			});
			return false;
		});

		self.inputForm.find('input, textarea').change(function () {
			self.inputForm.data('changed', true);
		});

		self.inputForm.find('input[name=mode]').
			typeahead({
				name : 'mode',
				local : [
					'CW',
					'SSB',
					'AM',
					'FM',
					'RTTY'
				]
			}).
			change(function () {
				var classes = self.inputForm.attr('class');
				for (var i = 0, len = classes.length; i < len; i++) {
					if (classes[i].match(/^mode-/)) {
						self.inputForm.removeClass(classes[i]);
					}
				}

				self.inputForm.addClass('mode-' + this.value);
			}).
			change();

		self.inputForm.find('input[name=callsign]').
			typeahead({
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
			}).
			blur(function () {
				var $this = $(this);
				$this.val($this.val().toUpperCase());

				$.ajax({
					url: "/api/callsign",
					type : "GET",
					data : { q : $this.val() },
					dataType: 'json'
				}).
				done(function (data) {
					if (data.length && data[0].value === $this.val()) {
						self.inputForm.find('input[name=name]').val(data[0].name);
						self.inputForm.find('input[name=address]').val(data[0].address || data[0].country);
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
			});

		self.inputForm.find('input[name=ur_rst], input[name=my_rst]').
			focus(function () {
				$(this).parent().find('.rst-dropdown').show();
			}).
			blur(function () {
				$(this).parent().find('.rst-dropdown').hide();
			}).
			keyup(function () {
				var $this = $(this);
				var rst = $this.val().split('');

				$this.parent().find('tr.readability td').text( (rst[0] || '') + ' ' + (RST.R[rst[0] - 1] || '') );
				$this.parent().find('tr.strength td').text( (rst[1] || '') + ' ' + (RST.S[rst[1] - 1] || '') );
				$this.parent().find('tr.tone td').text( (rst[2] || '') + ' ' + (RST.T[rst[2] - 1] || '') );
			});

		self.inputForm.find('#now').
			click(function () {
				var date = self.inputForm.find('input[name=date]');
				var time = self.inputForm.find('input[name=time]');
				var now = new Date();
				date.val(
					now.getFullYear() + '-' +
					String(now.getMonth() + 101).slice(1) + '-' +
					String(now.getDate() + 100).slice(1)
				);

				time.val(
					String(now.getHours() + 100).slice(1) + ':' +
					String(now.getMinutes() + 100).slice(1)
				);
			}).
			click();

		$(window).on('hashchange', function () {
			if (location.hash === '#new') {
				self.openForm();
			} else
			if (location.hash === '#home') {
				self.entriesContainer.empty();
				self.loadEntries({});
				location.hash = '#';
			} else
			if (location.hash.match(/^#find:(.+)/)) {
				var query = RegExp.$1;
				self.entriesContainer.empty();
				self.loadEntries({ query : query });
			}
		});

		self.inputForm.on('hidden.bs.modal', function () {
			location.hash = '';
		});

		self.entriesContainer.on('click', 'tr', function () {
			var data = $(this).data('data');
			self.openForm(data);
		});

		self.inputForm.find('input').keydown(function (e) {
			var key = keyString(e);
			var current = $(this);
			if (key === 'RET') {
				var inputs  = current.closest("form").find("input, button").filter(":visible");
				var next = inputs.eq(inputs.index(this) + 1);
				if (next.length) {
					next.focus();
					return false;
				}
			}
		});


//		$(window).on('beforeunload', function () {
//			return 'Sure to unload?';
//		});
//

		$('#search-form').submit(function () {
			var $this = $('#search');
			if ($this.val()) {
				location.hash = '#find:' + $this.val();
			} else {
				location.hash = '#home';
			}
			$this.data('prev', $this.val());
			return false;
		});

		$('#search').
			keyup(function () {
				var $this = $(this);
				var timer  = $this.data('timer');

				clearTimeout(timer);
				$this.data('timer', setTimeout(function () {
					console.log('timer', [$this.data('prev'), $this.val()]);
					if ($this.data('prev') !== $this.val()) {
						if ($this.val()) {
							location.hash = '#find:' + $this.val();
						} else {
							location.hash = '#home';
						}
						$this.data('prev', $this.val());
					}
				}, 1000));
			});
	},

	openForm : function (data) {
		var self = this;

		if (data) {
			self.inputForm.find('.edit-type').text('Edit (id=' + data.id + ')');

			SignalReports.setDateAndTime(data);
			self.inputFormForm.deserialize(data);
		} else {
			self.inputForm.find('.edit-type').text('New');

			var last = self.entriesContainer.find('tr:first').data('data');
			if (last) {
				self.inputFormForm.deserialize({
					frequency : last.frequency,
					mode : last.mode
				});
			}

			if (localStorage.inputBackup) {
				self.inputFormForm.deserialize(localStorage.inputBackup);
			}

			self.inputForm.data('timer', setInterval(function () {
				if (self.inputForm.data('changed')) {
					localStorage.inputBackup = self.inputFormForm.serialize();
				}
			}, 1000));
		}

		self.inputForm.data('changed', false);
		self.inputForm.modal({
			keyboard: false
		});
	}
};


$(function () {
	SignalReports.init();
});
