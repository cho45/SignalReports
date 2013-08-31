
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
		var dt = new Date(entry.datetime);

		entry.date = dt;
		entry.tiem = dt;
	},
	
	init : function () {
		var self = this;

		self.inputForm = $('#input-form');
		self.inputFormForm = self.inputForm.find('form');
		self.entriesContainer = $('#entries');

		self.bindEvents();
		self.loadEntries();
	},

	loadEntries : function (n) {
		var self = this;

		$.ajax({
			url: "/api/entries",
			type : "GET",
			data : {},
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

		self.inputForm.find('form').submit(function () {
			var $this = $(this);
			$.ajax({
				url: "/api/input",
				type : "POST",
				data : $this.serialize(),
				dataType: 'json'
			}).
			done(function (data) {
				self.inputForm.data('changed', false);
				self.inputForm.find('form')[0].reset();
				self.inputForm.modal('hide');

				var row = $(template('entry', data.entry));
				row.data('data', data.entry);

				var exists = self.entriesContainer.find('[data-id=' + data.entry.id + ']');
				if (exists) {
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
				template: '<p style="width: 400px"><strong>[%= country %]</strong><br/>[%= area %]</p>',
				engine: {
					compile : function (string) {
						return {
							render : template(string)
						};
					}
				},
				remote : '/callsign?q=%QUERY'
			}).
			blur(function () {
				var $this = $(this);
				$this.val($this.val().toUpperCase());
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
			}
		}).hashchange();

		self.inputForm.on('hidden.bs.modal', function () {
			location.hash = '';
		});

		$('#entries').on('click', 'tr', function () {
			var data = $(this).data('data');
			self.openForm(data);
		});

//		$(window).on('beforeunload', function () {
//			return 'Sure to unload?';
//		});
//
	},

	openForm : function (data) {
		var self = this;

		console.log(['openForm', data]);

		var tiemr;
		if (data) {
			self.inputFormForm.deserialize(data);
		} else {
			self.inputFormForm.deserialize({});

			if (localStorage.inputBackup) {
				self.inputFormForm.deserialize(localStorage.inputBackup);
			}

			timer = setInterval(function () {
				localStorage.inputBackup = self.inputFormForm.serialize();
			}, 1000);
		}

		self.inputForm.data('changed', false);
		self.inputForm.modal({
			keyboard: false
		}).
			on('shown.bs.modal', function () {
				self.inputForm.find('input[name=frequency]').focus();
			}).
			on('hide.bs.modal', function () {
				if (self.inputForm.data('changed')) {
					return confirm('Sure?');
				}
			});
	}
};


$(function () {
	SignalReports.init();
});
