
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

function populateScoreboard() {
	
	var scoreboardURL;
	
	asOfDate = new Date(Date.parse($("#asOfDate").attr("value")));
	
	scoreboardURL = "http://gd2.mlb.com/components/game/mlb/year_" + asOfDate.getFullYear() + 
					"/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
					"/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
					"/miniscoreboard.xml";
	
	$.get(scoreboardURL, function(data) { 
		
		var gameBox, gameBoxData, gameBoxCheckBox;
		$("#gameList").empty();
		
		games = $(data).find('game').each(function() {
			
			gameBox = $('<li class="gameBox" />');
			gameBoxData = $('<span class="gameBoxData" />');
			gameBoxCheckBox = $('<input type="checkbox" />');
			
			gameBox.data('id', $(this).attr('id'));
			gameBox.data('gameday', $(this).attr('id').replace(/[\-\/]/g, '_'));
			// no idea why $(this).attr('gameday') doesn't work, by the way
			gameBox.data('homeTeam', $(this).attr('home_name_abbrev'));
			gameBox.data('awayTeam', $(this).attr('away_name_abbrev'));
			
			gameBoxCheckBox.prop('checked', true);
			gameBox.append(gameBoxCheckBox);
			gameBoxData.text($(this).attr('away_name_abbrev') + ' @ ' + $(this).attr('home_name_abbrev'));
			gameBox.append(gameBoxData);
			
			gameBox.click(function() { 
				var checkBox = $($(this).children('input'));
				if (checkBox.prop('checked')) { checkBox.prop('checked', false); }
				else { checkBox.prop('checked', true); }
			});
			
			// this one should override the above click() bind on the checkbox itself
			gameBoxCheckBox.click(function() { 
				if ($(this).prop('checked')) { $(this).prop('checked', false); }
				else { $(this).prop('checked', true); }
			});
			
			$('#gameList').append(gameBox);
			
		});
		
		displayEvents();
		
	});

}

function displayEvents() {
	
	$('#eventList').empty();
	
	$('#gameList').children().each(function() {
		
		var gamedayURL = "http://gd2.mlb.com/components/game/mlb/year_" + asOfDate.getFullYear() +
						"/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
						"/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
						"/gid_" + $(this).data('gameday') + "/";
						
		var inningURL = gamedayURL + "inning/inning_all.xml";
		var scoreboardURL = gamedayURL + "miniscoreboard.xml";
		
		var homeTeam, homeR, awayTeam, awayR, inning, inningHalf;
		
		homeTeam = $(this).data('homeTeam');
		awayTeam = $(this).data('awayTeam');
		
		$.get(inningURL, function(data) {
			
			var gameEvent;
			var gameEvents = [];
			
			$(data).find('atbat').each(function() {
				gameEvent = $('<li class="event" />');
				gameEvent.append($('<div class="eventDescription">' + $(this).attr('des') + '</div>'));
				gameEvents.push(gameEvent);
			});

			for (var i = 0; i < gameEvents.length; i++) { 
				gameEvents[i].prepend($('<div class="eventScoreboard">' + homeTeam + ' ' + awayTeam + '</div>'));
				$('#eventList').append(gameEvents[i]); 
			}
		});
		
	});
	
}


// "main" //////////////////////////////////////////

$(document).ready(function() {
	
	var asOfDate = new Date();
	var scoreboardData;

	$('#asOfDate').datepicker({
		dateFormat: 'D d M yy',
		defaultDate: +0,
		changeMonth: true,
		changeYear: true
	});
	
	$('#asOfDate').change(populateScoreboard);
	
	setAsOfDate(asOfDate);
	populateScoreboard();

});