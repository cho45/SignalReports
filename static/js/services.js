signalReportsApp.factory('CATSocketService', function () {
	var service = $({});

	service.connect = function () {
		if (service.socket) return;
		service.socket = new WebSocket("ws://raspberrypi.local:51234");

		service.socket.onopen = function () {
			console.log('onopen');
			service.connected = true;
			if (service.onopen) service.onopen();
		};

		service.socket.onclose = function () {
			service.connected = false;
			console.log('onclose');
			if (service.onclose) service.onclose();
			delete service.socket;
			setTimeout(function () {
				console.log('reconnecting');
				service.connect();
			}, 1000);
		};

		service.socket.onmessage = function (e) {
			var data = JSON.parse(e.data);
			service.status = data;
			console.log('ws.onmessage', data);
			service.triggerHandler('message', [ data ]);
		};
	};

	service.send = function (data) {
		service.socket.send(JSON.stringify(data));
	};

	service.command = function (cmd, arg) {
		service.send({ command: cmd, value : arg });
	};

	service.connect();

	return service;
});

signalReportsApp.factory('JCCService', function ($http, $q) {
	var JCCService = {
		resolve : function (number) {
			var ret = $q.defer();

			$http.get('/js/lib/jcc.json', { cache : true }).
				success(function (data, status, headers, config) {
					console.log(data);
					try {
						var index = data.index[number];
						ret.resolve(data.list.slice(index[0], index[0] + index[1]));
					} catch (e) {
						ret.resolve([]);
					}
				}).
				error(function (data, status, headers, config) {
					ret.reject(data);
				});

			return ret.promise;
		}
	};

	return JCCService;
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

