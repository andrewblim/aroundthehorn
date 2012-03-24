
var gamedataURL = "http://gd2.mlb.com/components/game/mlb/";

function setAsOfDate(date) {
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	$("#asOfDate").attr("value", dayNames[date.getDay()] + ' ' +
								 date.getDate() + ' ' + 
							   	 monthNames[date.getMonth()] + ' ' + 
								 date.getFullYear());
}

function padNumber(number, pad, places) {
	return Array(Math.max(places - number.toString().length, 0) + 1).join(pad) + number;
}

$(document).ready(function() {
	
	var asOfDate = new Date();
	var scoreboardData;

	$("#asOfDate").datepicker({
		dateFormat: 'D d M yy',
		defaultDate: +0,
		changeMonth: true,
		changeYear: true
	});
	
	$("#asOfDate").change(function() {
		
		asOfDate = new Date(Date.parse($("#asOfDate").attr("value")));
		
		var scoreboardURL = "http://gd2.mlb.com/components/game/mlb/year_" + asOfDate.getFullYear() + 
							"/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
							"/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
							"/miniscoreboard.json";
		
		$.get(scoreboardURL, function(data) { 
			
			var li;
			games = data.data.games.game;
			$("#gameList").empty();
			
			for (var i = 0; i < games.length; i++) {
				li = $("<li />");
				li.text(games[i].id);
				$("#gameList").append(li);
			}
			
		});
		
		asOfDate = Date.parse($("#asOfDate").attr("value"));
		
	});
	
	setAsOfDate(asOfDate);

})