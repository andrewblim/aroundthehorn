
// globals ////////////////////////////////////////////////////////////////////

var gamedayURL = "http://gd2.mlb.com/components/game/mlb";

// helper functions ///////////////////////////////////////////////////////////

function setAsOfDate(date) {
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	$("#asOfDate").attr("value", dayNames[date.getDay()] + ' ' +
								 date.getDate() + ' ' + 
							   	 monthNames[date.getMonth()] + ' ' + 
								 date.getFullYear());
}

function numberToOrdinal(n) {
	if ((n % 10) == 1 && (n % 100) != 11) { return n + 'st'; }
	else if ((n % 10) == 2 && (n % 100) != 12) { return n + 'nd'; }
	else if ((n % 10) == 3 && (n % 100) != 13) { return n + 'rd'; }
	else { return n + 'th'; }
}

function padNumber(number, pad, places) {
	return Array(Math.max(places - number.toString().length, 0) + 1).join(pad) + number;
}

function zuluTimeToString(zuluTime) {
	
	var zuluTimeLocal = new Date(zuluTime.valueOf() - zuluTime.getTimezoneOffset() * 60 * 1000);
	var retString = '';
	if (zuluTimeLocal.getDate() < asOfDate.getDate()) { 
		retString += '(' + (zuluTimeLocal.getDate() - asOfDate.getDate()) + 'd) '; 
	}
	else if (zuluTimeLocal.getDate() > asOfDate.getDate()) { 
		retString += '(+' + (zuluTimeLocal.getDate() - asOfDate.getDate()) + 'd) '; 
	}
	
	var hours = ((zuluTimeLocal.getHours() + 11) % 12) + 1;
	
	retString += hours + ':' +
				 padNumber(zuluTimeLocal.getMinutes(), 0, 2) + ':' + 
				 padNumber(zuluTimeLocal.getSeconds(), 0, 2);
	
	if (zuluTimeLocal.getHours() < 12) { retString += ' AM'; }
	else { retString += ' PM'; }
	
	return retString;
	
}

// functions //////////////////////////////////////////////////////////////////

function populateScoreboard() {
	
	var scoreboardURL;
	
	asOfDate = new Date(Date.parse($("#asOfDate").attr("value")));
	// need to fix this to prevent annoying rollovers around midnight;
	// should be in settings
	
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
						
		var inningURL = gameURL + "/game_events.xml"; 
		var playersURL = gameURL + "/players.xml";
		
		var gameID = $(this).data('gameday');
		var homeTeam = $(this).data('homeTeam');
		var awayTeam = $(this).data('awayTeam');
		
		$.get(playersURL, function(playersData) {
			
			var players = {};
			
			$(playersData).find('player').each(function() {
				players[$(this).attr('id')] = {
					first: $(this).attr('first'),
					last: $(this).attr('last'),
					number: $(this).attr('num'),
					shortName: $(this).attr('boxname')
				}
			});
			
			$.get(inningURL, function(inningData) {
			
				// Relies on each game_events.xml file presenting the data in 
				// chronological order, in order to correctly capture runs and
				// men on base. 
				
				$(inningData).children('game').each(function() {
				
					var inning, inningHalf, inningDescription;
					var gameEvent, gameEventText, gameEventZuluRaw, gameEventZulu;
					var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
				
					var homeR = 0, awayR = 0;
					var outs, batterID, pitcherID, onFirstID, onSecondID, onThirdID;
					outs = 0;
					onFirstID = '';
					onSecondID = '';
					onThirdID = '';
					
					// still problems: 
					// out of order events
					// handling certain actions, pinch hitters/runners, pickoffs, etc. 
					
					$(this).find('atbat').each(function() {
						
						inning = $(this).parent().parent().attr('num');
						if ($(this).parent().is('top')) { inningHalf = 'Top'; }
						else if ($(this).parent().is('bottom')) { inningHalf = 'Bot'; }
						
						gameEventText = $(this).attr('des');
						
						if ($(this).is('atbat')) { 
							gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('start_tfs_zulu'));
						}
						else {
							gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('tfs_zulu'));
						}
						
						gameEventZulu = new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
						
						if ($(this).attr('home_team_runs') != undefined) { homeR = $(this).attr('home_team_runs'); }
						if ($(this).attr('away_team_runs') != undefined) { awayR = $(this).attr('away_team_runs'); }
						if ($(this).attr('o') != undefined) { outs = $(this).attr('o'); }
						if ($(this).attr('batter') != undefined) { batterID = $(this).attr('batter'); }
						if ($(this).attr('pitcher') != undefined) { pitcherID = $(this).attr('pitcher'); }
						
						inningDescription = inningHalf + ' ' + numberToOrdinal(inning) + ', ' + outs + ' out';
						if ($(this) == $(this).parent().children().eq(0)) {
							outs = 0;
							onFirstID = '';
							onSecondID = '';
							onThirdID = '';
						}
						
						gameEvent = $('<li class="event ' + gameID + '" />');
						gameEvent.append($('<div class="eventTimestamp">' + zuluTimeToString(gameEventZulu) + '</div>'));
						gameEvent.append($('<div class="eventScoreboard">' + 
										   '<div class="eventScoreboardInning">' + inningDescription + '</div>' +
										   '<div class="eventScoreboardWrap">' + 
										   '<div class="eventScoreboardAway">' + 
										   '<div class="eventScoreboardTeam">' + awayTeam + '</div>' + 
										   '<div class="eventScoreboardScore">' + awayR + '</div>' + 
										   '</div><div class="eventScoreboardHome">' + 
										   '<div class="eventScoreboardTeam">' + homeTeam + '</div>' + 
										   '<div class="eventScoreboardScore">' + homeR + '</div>' +
										   '</div></div></div>'));
					
						gameEvent.append($('<div class="eventAtBat"><div class="eventAtBatWrap">' + 
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">P:</div><div class="eventAtBatPlayer">' + players[pitcherID].shortName + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">AB:</div><div class="eventAtBatPlayer">' + players[batterID].shortName + '</div></div>' +
										   '</div></div>'));
										
						gameEvent.append($('<div class="eventAtBat"><div class="eventAtBatWrap">' + 
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">1st:</div><div class="eventAtBatPlayer">' + (onFirstID == '' ? '' : players[onFirstID].shortName) + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">2nd:</div><div class="eventAtBatPlayer">' + (onSecondID == '' ? '' : players[onSecondID].shortName) + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">3rd:</div><div class="eventAtBatPlayer">' + (onThirdID == '' ? '' : players[onThirdID].shortName) + '</div></div>' +
										   '</div></div>'));
					
						gameEvent.append($('<div class="eventDescription">' + gameEventText + '</div>'));
						
						// b1-b3 show base status _after_ the event, which is not what I want to show
						// therefore they are assigned here
						if ($(this).attr('b1') != undefined) { onFirstID = $(this).attr('b1'); }
						if ($(this).attr('b2') != undefined) { onSecondID = $(this).attr('b2'); }
						if ($(this).attr('b3') != undefined) { onThirdID = $(this).attr('b3'); }
						
						gameEvent.data('zulu', gameEventZulu.valueOf());
						$('#eventList').append(gameEvent);
						
					});
				});
			
				$('#eventList > li.event').tsort({ 
					sortFunction: function(a,b) {
						return b.e.data('zulu') - a.e.data('zulu');
					} 
				});
				
			});
		});
	});
	
}


// "main" /////////////////////////////////////////////////////////////////////

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
			if ($(this).children('input.gameBoxCheckBox').prop('checked') == false) { 
				$(this).click(); 
			} 
		});
	});
	$('#deselectAll').click(function() { 
		$('li.gameBox').each(function() { 
			if ($(this).children('input.gameBoxCheckBox').prop('checked') == true) { 
				$(this).click(); 
			} 
		});
	});
	
});