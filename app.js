var request = require('request');
var async = require('async');

var Point = function(name, lat, lng) {
	this.name = name;
	this.lat = lat;
	this.lng = lng;
}

var Route = function(start, end) {
	this.start = start;
	this.end = end;
}

var calcBestDetour = function (route1, route2, cb) {
	
	console.log('\nWelcome to the Optimal Detour Finder!');
	console.log('Calculating the optimal detour between these routes:');
	console.log('\t' + route1.start.name + ' to ' + route1.end.name);
	console.log('\t' + route2.start.name + ' to ' + route2.end.name);
	console.log('\n');	
	/*  Calc the shortest of these route combinations
		A - B - C - D
		A - C - B - D
		A - C - D - B
		C - D - A - B
		C - A - D - B
		C - A - B - D
	*/

	// Create the 6 routes
	var path1 = [route1.start, route1.end, route2.start, route2.end];
	var path2 = [route1.start, route2.start, route1.end, route2.end];
	var path3 = [route1.start, route2.start, route2.end, route1.end];	
	var path4 = [route2.start, route2.end, route1.start, route1.end];
	var path5 = [route2.start, route1.start, route2.end, route1.end];
	var path6 = [route2.start, route1.start, route1.end, route2.end];	

	var paths = [path1, path2, path3, path4, path5, path6];

	var result;
	var shortestDistance = 0;

	async.forEach(paths, function(path, callback) {
		getRouteDistance(path, function(err, distance) {

			if (err) {
				callback(err, null);
			} else {
				if (shortestDistance == 0 || shortestDistance > distance) {
					shortestDistance = distance;
					result = path;
				}
				callback(null);
			}
		});
	}, function(err) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, result);
		}
	});
}

/*
 * Returns the total time in seconds of the specified routePoints.
 * routePoints - an array of Points, e.g. SF, LV, DT, NY
 */
var getRouteDistance = function (routePoints, callback) {

	var duration = 0.0;
	var routes = [];
	for (var i=0; i < routePoints.length - 1; i++) {
		routes[i] = new Route(routePoints[i], routePoints[i+1]);
	}

	async.forEach(routes, function(route, cb) {
		var url = 'http://maps.googleapis.com/maps/api/directions/json?origin=' + route.start.lat + ',' + route.start.lng +
			'&destination=' + route.end.lat + ',' + route.end.lng + '&sensor=false&mode=driving'; 

		request(url, function(error, response, body) {
			
			if (!error && response.statusCode == 200) {

				var results = JSON.parse(body);
				if (results.status != "OK") {
					cb(new Error(results.status), null);
				} else {
					var routeResult = results.routes[0];
					var legs = routeResult.legs[0];
					duration += legs.duration.value;
					cb(null);
				}
			} else {
				cb(error);
			}
		});
	}, function(err) {
		if (!err) {
			var r = routePoints;
			console.log('Debug: Duration from ' + r[0].name + r[1].name + r[2].name + r[3].name + ' is ' + duration + ' seconds.');
			callback(null, duration);
		} else {
			callback(err, null);
		}
	})
}

var pointA = new Point(' SF ', 37.78, -122.41);
var pointB = new Point(' Las Vegas ', 36.08, -115.15);
var pointC = new Point(' Detroit ', 42.33, -83.04);
var pointD = new Point(' New York ', 40.79, -73.95);

// SF to Las Vegas
var routeAB = new Route(pointA, pointB);

// Detroit to New York
var routeCD = new Route(pointC, pointD);

calcBestDetour(routeAB, routeCD, function(err, result) {
	if (err) {
		console.log('Unable to determine the detour. ' + err);
	} else {
		console.log('\n\n*****');
		console.log('The shortest detour route is: ' + result[0].name + result[1].name + result[2].name + result[3].name);
		console.log('*****');
	}
});
