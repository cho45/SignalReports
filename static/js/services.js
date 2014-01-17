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

