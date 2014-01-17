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

signalReportsApp.factory('$exceptionHandler', function () {
	return function (exception, cause) {
		alert(exception.message);
	};
});



