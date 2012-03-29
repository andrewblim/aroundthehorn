
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
		
		var gameBox, gameBoxCheckBox, gameBoxData, gameBoxStatus, gameBoxStatusDescription;
		$('#gameList').empty();
		
		games = $(data).find('game').each(function() {
			
			gameBox = $('<li class="gameBox" />');
			gameBox.data('id', $(this).attr('id'));
			gameBox.data('gameday', $(this).attr('id').replace(/[\-\/]/g, '_'));
			// not sure why $(this).attr('gameday') doesn't work
			gameBox.data('homeTeam', $(this).attr('home_name_abbrev'));
			gameBox.data('awayTeam', $(this).attr('away_name_abbrev'));
			gameBox.data('homeTeamR', $(this).attr('home_team_runs'));
			gameBox.data('awayTeamR', $(this).attr('away_team_runs'));
			
			var ampm, timeRaw, timeRegExp = /(\d+):(\d\d)/;
			if ($(this).attr('ampm').toUpperCase() == "PM") { ampm = 12; }
			else { ampm = 0; }
			timeRaw = timeRegExp.exec($(this).attr('time'));
			gameBox.data('startTime', asOfDate.valueOf() + ((timeRaw[1] + ampm) * 60 + timeRaw[2]) * 1000);
			
			gameBoxCheckBox = $('<input class="gameBoxCheckBox" type="checkbox" />');
			gameBoxCheckBox.prop('checked', true);
			gameBox.append(gameBoxCheckBox);
			
			gameBoxData = $('<div class="gameBoxData" />');
			gameBoxData.append($('<span>' + 
							   gameBox.data('awayTeam') + ' ' + 
							   (gameBox.data('awayTeamR') == undefined ? '' : gameBox.data('awayTeamR') + ' ') + '@ ' + 
							   gameBox.data('homeTeam') + ' ' + 
							   (gameBox.data('homeTeamR') == undefined ? '' : gameBox.data('homeTeamR')) + 
							   '</span>'));
			gameBoxData.append($('<br/>'));
			
			gameBoxStatus = $('<span class="gameBoxStatus" />');
			if ($(this).attr('status').toLowerCase() == "in progress") {
				if ($(this).attr('top_inning').toLowerCase() == 'y') { gameBoxStatusDescription = 'Top '; }
				else { gameBoxStatusDescription = 'Bot '; }
				gameBoxStatus.text(gameBoxStatusDescription + numberToOrdinal($(this).attr('inning')));
			}
			else if ($(this).attr('status').toLowerCase() == "final") {
				if ($(this).attr('inning') != 9) { gameBoxStatus.text('Final (' + $(this).attr('inning') + ')'); }
				else { gameBoxStatus.text('Final'); }
			}
			else if ($(this).attr('status').toLowerCase() == "preview") {
				gameBoxStatus.text($(this).attr('time') + ' ' + $(this).attr('ampm') + ' ' + $(this).attr('time_zone'));
			}
			else if ($(this).attr('status') != undefined) {
				gameBoxStatus.text($(this).attr('status'));
			}
			else { gameBoxStatus.html('&nbsp;') }
			gameBoxData.append(gameBoxStatus);
			
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
		
		$('#gameList > li.gameBox').tsort({
			sortFunction: function(a,b) {
				if (a.e.data('startTime') != b.e.data('startTime')) { 
					return a.e.data('startTime') - b.e.data('startTime');
				}
				else if (a.e.data('awayTeam') > b.e.data('awayTeam')) { return 1; }
				else if (a.e.data('awayTeam') < b.e.data('awayTeam')) { return -1; }
				else if (a.e.data('homeTeam') > b.e.data('homeTeam')) { return 1; }
				else if (a.e.data('homeTeam') < b.e.data('homeTeam')) { return -1; }
				else { return 0; }
			}
		});
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
					
					var pitches;
					var homeR = 0, awayR = 0;
					var outs, isThirdOut;
					var batterID, pitcherID, onFirstID, onSecondID, onThirdID;
					var prevOnFirstID, prevOnSecondID, prevOnThirdID, tempID;
					
					outs = 0;
					onFirstID = '';
					onSecondID = '';
					onThirdID = '';
					
					// still problems: moving runners on actions
					// comes up on SB/CS/PO, error on PO, WP/PB, balks
					
					$(this).find('atbat,action[event!="Game Advisory"]').each(function() {
						
						inning = $(this).parent().parent().attr('num');
						if ($(this).parent().is('top')) { inningHalf = 'Top'; }
						else if ($(this).parent().is('bottom')) { inningHalf = 'Bot'; }
						
						isThirdOut = false;
						if ($(this).attr('o') != undefined) { 
							outs = $(this).attr('o'); 
							if (outs == 3) isThirdOut = true;
						}
						if ($(this).attr('des') != undefined) { gameEventText = $(this).attr('des'); }
						
						if ($(this).is('atbat')) {
							
							pitches = $(this).children('pitch');
							if (pitches.length > 0) {
								gameEventZuluRaw = gameEventZuluRegexp.exec(pitches.last().attr('tfs_zulu'));
							}
							else {
								gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('start_tfs_zulu'));
							}
							if ($(this).attr('batter') != undefined) { batterID = $(this).attr('batter'); }
							if ($(this).attr('pitcher') != undefined) { pitcherID = $(this).attr('pitcher'); }
							
						}
						else {
							
							gameEventZuluRaw = gameEventZuluRegexp.exec($(this).attr('tfs_zulu'));
							
							// on action tags we want the batter/pitcher of the next atbat
							// because actions are listed prior to the atbat they occurred in
							
							if ($(this).nextAll('atbat').length > 0) {
							 	batterID = $(this).nextAll('atbat').first().attr('batter');
								pitcherID = $(this).nextAll('atbat').first().attr('pitcher');
							}
							
						}
						
						gameEventZulu = new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
						
						homeRchanged = false;
						awayRchanged = false;
						if ($(this).attr('home_team_runs') != undefined) {
							if (homeR != $(this).attr('home_team_runs')) { homeRchanged = true; }
							homeR = $(this).attr('home_team_runs'); 
						}
						if ($(this).attr('away_team_runs') != undefined) { 
							if (awayR != $(this).attr('away_team_runs')) { awayRchanged = true; }
							awayR = $(this).attr('away_team_runs'); 
						}
						
						inningDescription = inningHalf + ' ' + numberToOrdinal(inning) + ', <span class="eventScoreboardOuts">' + outs + ' out</span>';
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
										   '<div class="eventScoreboardScore' + (awayRchanged ? ' scoreChanged' : '') + '">' + awayR + '</div>' + 
										   '</div><div class="eventScoreboardHome">' + 
										   '<div class="eventScoreboardTeam">' + homeTeam + '</div>' + 
										   '<div class="eventScoreboardScore' + (homeRchanged ? ' scoreChanged' : '') + '">' + homeR + '</div>' +
										   '</div></div></div>'));
					
						gameEvent.append($('<div class="eventAtBat"><div class="eventAtBatWrap">' + 
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">P:</div><div class="eventAtBatPlayer">' + players[pitcherID].shortName + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">AB:</div><div class="eventAtBatPlayer">' + players[batterID].shortName + '</div></div>' +
										   '</div></div>'));
										
						gameEvent.append($('<div class="eventAtBat"><div class="eventAtBatWrap ' + (isThirdOut ? ' eventAtBatThirdOut' : '') + '">' + 
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">1st:</div><div class="eventAtBatPlayer">' + (onFirstID == '' ? '' : players[onFirstID].shortName) + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">2nd:</div><div class="eventAtBatPlayer">' + (onSecondID == '' ? '' : players[onSecondID].shortName) + '</div></div>' +
										   '<div class="eventAtBatPosition"><div class="eventAtBatLabel">3rd:</div><div class="eventAtBatPlayer">' + (onThirdID == '' ? '' : players[onThirdID].shortName) + '</div></div>' +
										   '</div></div>'));
					
						gameEvent.append($('<div class="eventDescription' + (awayRchanged || homeRchanged ? ' scoringPlay' : '') + '">' + gameEventText + '</div>'));
						
						if ($(this).is('atbat')) {
							if (isThirdOut) {
								onFirstID = '';
								onSecondID = '';
								onThirdID = '';
							}
							else {
								prevOnFirstID = onFirstID;
								prevOnSecondID = onSecondID;
								prevOnThirdID = onThirdID;
								$(this).children('runner').each(function() {
									if ($(this).attr('start') == '') { tempID = batterID; }
									else if ($(this).attr('start') == '1B') { tempID = prevOnFirstID; if (onFirstID == prevOnFirstID) { onFirstID = ''; } }
									else if ($(this).attr('start') == '2B') { tempID = prevOnSecondID; if (onSecondID == prevOnSecondID) { onSecondID = ''; } }
									else if ($(this).attr('start') == '3B') { tempID = prevOnThirdID; if (onThirdID == prevOnThirdID) { onThirdID = ''; } }
									if ($(this).attr('end') == '1B') { onFirstID = tempID; }
									else if ($(this).attr('end') == '2B') { onSecondID = tempID; }
									else if ($(this).attr('end') == '3B') { onThirdID = tempID; }
								});
							}
						}
						
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