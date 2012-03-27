
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

function zuluTimeToString(zuluTime) {
	
	var zuluTimeLocal = new Date(zuluTime.valueOf() - zuluTime.getTimezoneOffset() * 60 * 1000);
	var retString = '';
	if (zuluTimeLocal.getDate() < asOfDate.getDate()) { retString += '(-1d) '; }
	else if (zuluTimeLocal.getDate() > asOfDate.getDate()) { retString += '(+1d) '; }
	
	retString += padNumber(zuluTimeLocal.getHours(), 0, 2) + ':' +
				 padNumber(zuluTimeLocal.getMinutes(), 0, 2) + ':' + 
				 padNumber(zuluTimeLocal.getSeconds(), 0, 2);
	return retString;
	
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
				if (checkBox.prop('checked')) { 
					checkBox.prop('checked', false);
					$('li.' + $(this).data('gameday')).css('display', 'none'); 
				}
				else { 
					checkBox.prop('checked', true); 
					$('li.' + $(this).data('gameday')).css('display', 'table-row'); 
				}
			});
			
			// fixes clicking on the checkbox itself
			gameBoxCheckBox.click(function() { $(this).parent().click(); });
			
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
		
		var gameID = $(this).data('gameday');
		var homeTeam = $(this).data('homeTeam');
		var awayTeam = $(this).data('awayTeam');
		
		// add some handling in case a game is not found
		$.get(inningURL, function(data) {
			
			$(data).find('atbat').each(function() {
				
				var gameEvent;
				var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
				
				var gameEventText = $(this).attr('des');
				var gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('start_tfs_zulu'));
				var gameEventZulu = new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], 
											 gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
				
				gameEvent = $('<li class="event ' + gameID + '" />');
				gameEvent.append($('<div class="eventTimestamp">' + zuluTimeToString(gameEventZulu) + '</div>'));
				gameEvent.append($('<div class="eventScoreboard">' + homeTeam + ' @ ' + awayTeam + '</div>'));
				gameEvent.append($('<div class="eventDescription">' + gameEventText + '</div>'));
				
				gameEvent.data('zulu', gameEventZulu);
				
				$('#eventList').append(gameEvent);
				
			});

			
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
		$('li.gameBox').each(function() { 
			if ($(this).children('input.gameBoxCheckBox').prop('checked') == false) { $(this).click(); } 
		});
	});
	$('#deselectAll').click(function() { 
		$('li.gameBox').each(function() { 
			if ($(this).children('input.gameBoxCheckBox').prop('checked') == true) { $(this).click(); } 
		});
	});
	
});