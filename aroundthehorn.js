
var gamedayURL = "http://gd2.mlb.com/components/game/mlb";

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
	
	scoreboardURL = gamedayURL + 
					"/year_" + asOfDate.getFullYear() + 
					"/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
					"/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
					"/miniscoreboard.xml";
	
	$('#eventList').empty();
	
	$.get(scoreboardURL, function(data) { 
		
		var gameBox, gameBoxData, gameBoxCheckBox;
		$('#gameList').empty();
		
		games = $(data).find('game').each(function() {
			
			gameBox = $('<li class="gameBox" />');
			gameBoxData = $('<span class="gameBoxData" />');
			gameBoxCheckBox = $('<input class="gameBoxCheckBox" type="checkbox" />');
			
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
		
		$('#gameList > li.gameBox').tsort();
		displayEvents();
		
	});

}

function displayEvents() {
	
	$('#gameList').children().each(function() {
		
		var gameURL = gamedayURL + 
					  "/year_" + asOfDate.getFullYear() +
					  "/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
					  "/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
					  "/gid_" + $(this).data('gameday');
						
		var inningURL = gameURL + "/inning/inning_all.xml";
		
		var homeTeam, homeR, awayTeam, awayR, inning, inningHalf;
		
		gameID = $(this).data('id');
		homeTeam = $(this).data('homeTeam');
		awayTeam = $(this).data('awayTeam');
		
		$.get(inningURL, function(data) {
				
			$(data).find('atbat').each(function() {
				
				var gameEvent;
				var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
				
				var gameEventText = $(this).attr('des');
				var gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('start_tfs_zulu'));
				var gameEventZulu = new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], 
											 gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
				
				gameEvent = $('<li class="event ' + gameID + '" />');
				gameEvent.append($('<div class="eventTimestamp">' + gameEventZulu.toTimeString() + '</div>'));
				gameEvent.append($('<div class="eventScoreboard">' + homeTeam + ' @ ' + awayTeam + '</div>'));
				gameEvent.append($('<div class="eventDescription">' + gameEventText + '</div>'));
				
				gameEvent.data('zulu', gameEventZulu);
				
				$('#eventList').append(gameEvent);
				
			});
			/*
			$('#eventList > li.event').tsort({
				sortFunction: function(a,b) {
					if (a.data('zulu') < b.data('zulu')) { return 1; }
					else if (a.data('zulu') > b.data('zulu')) { return -1; }
					else { return 0; }
				}
			});*/
			$('#eventList > li.event').tsort({ order: 'desc' });
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
	
	$('#selectAll').click(function() { 
		$('input.gameBoxCheckBox').each(function() { $(this).prop('checked', true); });
	});
	$('#deselectAll').click(function() { 
		$('input.gameBoxCheckBox').each(function() { $(this).prop('checked', false); });
	});
	
});