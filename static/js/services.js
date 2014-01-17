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

