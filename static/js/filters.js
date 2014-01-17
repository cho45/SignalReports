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


