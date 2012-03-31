
// globals ////////////////////////////////////////////////////////////////////

var gamedayURL = "http://gd2.mlb.com/components/game/mlb";

// helper functions ///////////////////////////////////////////////////////////

function setAsOfDate(date) {
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	$("#asOfDate").attr("value", dayNames[date.getDay()] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear());
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

function zuluTimestampToDate(zuluTime) {
	try {
		var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
		var gameEventZuluRaw = gameEventZuluRegexp.exec(zuluTime);
		return new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
	}
	catch (err) { return undefined; }
}

function zuluTimeToString(zuluTime) {
	
	var zuluTimeLocal; 
	var retString = '';
	
	try {
		zuluTimeLocal = new Date(zuluTime.valueOf() - zuluTime.getTimezoneOffset() * 60 * 1000);
	}
	catch (err) { return undefined; }
	
	if (zuluTimeLocal.getDate() < asOfDate.getDate()) { 
		retString = '(' + (zuluTimeLocal.getDate() - asOfDate.getDate()) + 'd) ';
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
	
	asOfDate = new Date(Date.parse($("#asOfDate").attr("value")));
	
	var scoreboardURL = gamedayURL + 
						"/year_" + asOfDate.getFullYear() + 
						"/month_" + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
						"/day_" + padNumber(asOfDate.getDate(), 0, 2) + 
						"/miniscoreboard.xml";
	
	$('#eventList').empty();
	
	$.get(scoreboardURL, function(data) { 
		
		$('#gameList').empty();
		
		games = $(data).find('game').each(function() {
			
			var gameBox = $('<li class="gameBox" />');
			gameBox.data('id', $(this).attr('id'));
			gameBox.data('gameday', $(this).attr('id').replace(/[\-\/]/g, '_'));
			// not sure why $(this).attr('gameday') doesn't work
			gameBox.data('homeTeam', $(this).attr('home_name_abbrev'));
			gameBox.data('awayTeam', $(this).attr('away_name_abbrev'));
			gameBox.data('homeTeamR', $(this).attr('home_team_runs'));
			gameBox.data('awayTeamR', $(this).attr('away_team_runs'));
			$('#gameList').append(gameBox);
			
			var ampm = 0, timeRaw;
			if ($(this).attr('ampm').toUpperCase() == "PM") { ampm = 12; }
			timeRaw =  /(\d+):(\d\d)/.exec($(this).attr('time'));
			gameBox.data('startTime', asOfDate.valueOf() + ((timeRaw[1] + ampm) * 60 + timeRaw[2]) * 1000);
			
			var gameBoxCheckBox = $('<input class="gameBoxCheckBox" type="checkbox" />');
			gameBoxCheckBox.prop('checked', true);
			gameBox.append(gameBoxCheckBox);
			
			var gameBoxData;
			gameBoxData = $('<div class="gameBoxData" />');
			gameBox.append(gameBoxData);
			
			var gameBoxScoreline = $('<div class="gameBoxScoreline">');
			gameBoxScoreline.text(gameBox.data('awayTeam') + ' ' + 
								  (gameBox.data('awayTeamR') == undefined ? '' : gameBox.data('awayTeamR') + ' ') + '@ ' + 
								  gameBox.data('homeTeam') + ' ' + 
								  (gameBox.data('homeTeamR') == undefined ? '' : gameBox.data('homeTeamR')));
			gameBoxData.append(gameBoxScoreline);
			
			var gameBoxStatus = $('<div class="gameBoxStatus" />');
			var gameStatus = $(this).attr('status').toLowerCase();
			var inning = $(this).attr('inning');
			var topInning = $(this).attr('top_inning');
			
			if (gameStatus == "in progress") {
				if (topInning.toLowerCase() == 'y') { gameBoxStatus.text('Top ' + numberToOrdinal(inning)); }
				else { gameBoxStatus.text('Bot ' + numberToOrdinal(inning)); }
			}
			else if (gameStatus == "final") {
				if (inning != 9) { gameBoxStatus.text('Final (' + inning + ')'); }
				else { gameBoxStatus.text('Final'); }
			}
			else if (gameStatus == "preview") {
				gameBoxStatus.text($(this).attr('time') + ' ' + $(this).attr('ampm') + ' ' + $(this).attr('time_zone'));
			}
			else if (gameStatus == "pre-game" || gameStatus == "warmup") {
				gameBoxStatus.text('Pregame');
			}
			else if (gameStatus != undefined) {
				gameBoxStatus.text(gameStatus);
			}
			else { gameBoxStatus.html('&nbsp;') }
			gameBoxData.append(gameBoxStatus);
			
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
				
					var gameEventText, gameEventZulu, prevGameEventZulu;
					var runnerIndex;
					
					var homeR = 0, awayR = 0, outs = 0;
					var batterID = '', pitcherID = '', onFirstID = '', onSecondID = '', onThirdID = '';
					var prevOnFirstID, prevOnSecondID, prevOnThirdID, tempID;
					
					prevGameEventZulu = new Date(asOfDate);
					
					// still problems: pinch runners
					// if inning ends on CS/PO it gets duped
					
					$(this).find('atbat,action[event!="Game Advisory"]').each(function() {
						
						var inning, inningHalf;
						inning = $(this).parent().parent().attr('num');
						if ($(this).parent().is('top')) { inningHalf = 'Top'; }
						else if ($(this).parent().is('bottom')) { inningHalf = 'Bot'; }
						
						if ($(this).attr('o') != undefined) { outs = $(this).attr('o'); }
						if ($(this).attr('des') != undefined) { gameEventText = $(this).attr('des'); }
						
						if ($(this).is('atbat')) {
							
							runnerIndex = 0;
							
							var pitches = $(this).children('pitch');
							if (pitches.length > 0) { gameEventZulu = zuluTimestampToDate(pitches.last().attr('tfs_zulu')); }
							else { gameEventZulu = zuluTimestampToDate($(this).attr('start_tfs_zulu')); }
							
							if ($(this).attr('batter') != undefined) { batterID = $(this).attr('batter'); }
							if ($(this).attr('pitcher') != undefined) { pitcherID = $(this).attr('pitcher'); }
							
						}
						else {  // .is('action')
							
							gameEventZulu = zuluTimestampToDate($(this).attr('tfs_zulu'));
							
							// on action tags we want the batter/pitcher of the next atbat
							// because actions are listed prior to the atbat they occurred in
							
							if ($(this).nextAll('atbat').length > 0) {
							 	batterID = $(this).nextAll('atbat').first().attr('batter');
								pitcherID = $(this).nextAll('atbat').first().attr('pitcher');
							}
							
							var pinchRunnerData = /Pinch runner (\w*) (\w*) replaces (\w*) (\w*)/.exec(gameEventText);
							
						}
						
						// in case gameEventZulu was undefined, just use the previous timestamp plus a small value
						// this shouldn't happen in MLB's XML files but occasionally does
						
						if (gameEventZulu == undefined) { gameEventZulu = new Date(prevGameEventZulu.valueOf() + 1); }
						prevGameEventZulu = gameEventZulu; 
						
						var homeRchanged = false;
						var awayRchanged = false;
						if ($(this).attr('home_team_runs') != undefined) {
							if (homeR != $(this).attr('home_team_runs')) { homeRchanged = true; }
							homeR = $(this).attr('home_team_runs'); 
						}
						if ($(this).attr('away_team_runs') != undefined) { 
							if (awayR != $(this).attr('away_team_runs')) { awayRchanged = true; }
							awayR = $(this).attr('away_team_runs'); 
						}
						
						var gameEvent = $('<li class="event ' + gameID + '" />');
						
						gameEvent.data('zulu', gameEventZulu.valueOf());
						$('#eventList').append(gameEvent);
						
						gameEvent.append($('<div class="eventTimestamp">' + zuluTimeToString(gameEventZulu) + '</div>'));
						
						var gameEventScoreboard = $('<div class="eventScoreboard" />');
						gameEvent.append(gameEventScoreboard);
						
						var inningDescription = inningHalf + ' ' + numberToOrdinal(inning) + ', <span class="eventScoreboardOuts">' + outs + ' out</span>';
						gameEventScoreboard.append('<div class="eventScoreboardInning">' + inningDescription + '</div>');
						
						var gameEventScoreboardWrap = $('<div class="eventScoreboardWrap" />');
						gameEventScoreboard.append(gameEventScoreboardWrap);
						
						var gameEventScoreboardAway = $('<div class="eventScoreboardAway" />');
						gameEventScoreboard.append(gameEventScoreboardAway);
						gameEventScoreboardAway.append($('<div class="eventScoreboardTeam">' + awayTeam + '</div>'));
						gameEventScoreboardAway.append($('<div class="eventScoreboardScore' + (awayRchanged ? ' scoreChanged' : '') + '">' + awayR + '</div>'));
						var gameEventScoreboardHome = $('<div class="eventScoreboardHome" />');
						gameEventScoreboard.append(gameEventScoreboardHome);
						gameEventScoreboardHome.append($('<div class="eventScoreboardTeam">' + homeTeam + '</div>'));
						gameEventScoreboardHome.append($('<div class="eventScoreboardScore' + (homeRchanged ? ' scoreChanged' : '') + '">' + homeR + '</div>'));
						
						var gameEventAtBat, gameEventAtBatWrap, gameEventAtBatPosition;
						
						gameEventAtBat = $('<div class="eventAtBat" />');
						gameEvent.append(gameEventAtBat);
						gameEventAtBatWrap = $('<div class="eventAtBatWrap" />');
						gameEventAtBat.append(gameEventAtBatWrap);
						gameEventAtBatPosition = gameEventAtBatWrap.append($('<div class="eventAtBatPosition" />'));
						gameEventAtBatPosition.append($('<div class="eventAtBatLabel">P:</div>'));
						gameEventAtBatPosition.append($('<div class="eventAtBatPlayer">' + players[pitcherID].shortName + '</div>'));
						gameEventAtBatPosition = gameEventAtBatWrap.append($('<div class="eventAtBatPosition" />'));
						gameEventAtBatPosition.append($('<div class="eventAtBatLabel">AB:</div>'));
						gameEventAtBatPosition.append($('<div class="eventAtBatPlayer">' + players[batterID].shortName + '</div>'));
						
						gameEventAtBat = $('<div class="eventAtBat" />');
						gameEvent.append(gameEventAtBat);
						gameEventAtBatWrap = $('<div class="eventAtBatWrap ' + (outs == 3 ? ' eventAtBatThirdOut' : '') + '" />');
						gameEventAtBat.append(gameEventAtBatWrap);
						gameEventAtBatPosition = gameEventAtBatWrap.append($('<div class="eventAtBatPosition" />'));
						gameEventAtBatPosition.append($('<div class="eventAtBatLabel">1st:</div>'));
						gameEventAtBatPosition.append($('<div class="eventAtBatPlayer">' + (onFirstID == '' ? '' : players[onFirstID].shortName) + '</div>'));
						gameEventAtBatPosition = gameEventAtBatWrap.append($('<div class="eventAtBatPosition" />'));
						gameEventAtBatPosition.append($('<div class="eventAtBatLabel">2nd:</div>'));
						gameEventAtBatPosition.append($('<div class="eventAtBatPlayer">' + (onSecondID == '' ? '' : players[onSecondID].shortName) + '</div>'));
						gameEventAtBatPosition = gameEventAtBatWrap.append($('<div class="eventAtBatPosition" />'));
						gameEventAtBatPosition.append($('<div class="eventAtBatLabel">3rd:</div>'));
						gameEventAtBatPosition.append($('<div class="eventAtBatPlayer">' + (onThirdID == '' ? '' : players[onThirdID].shortName) + '</div>'));
					
						gameEvent.append($('<div class="eventDescription' + (awayRchanged || homeRchanged ? ' scoringPlay' : '') + '">' + gameEventText + '</div>'));
						
						if ($(this).is('atbat')) {
							
							$(this).children('runner').each(function() {
								tempID = $(this).attr('id');
								if ($(this).attr('start') == '1B' && (onFirstID == tempID)) { onFirstID = ''; }
								else if ($(this).attr('start') == '2B' && (onSecondID == tempID)) { onSecondID = ''; }
								else if ($(this).attr('start') == '3B' && (onThirdID == tempID)) { onThirdID = ''; }
								if ($(this).attr('end') == '1B') { onFirstID = tempID; }
								else if ($(this).attr('end') == '2B') { onSecondID = tempID; }
								else if ($(this).attr('end') == '3B') { onThirdID = tempID; }
							});
							
						}
						else {  // .is('action')
							
							var atBatEvent = $(this).next('atbat').children().eq(runnerIndex);
							var atBatEventZulu;
							while (atBatEvent.length > 0) {
								
								atBatEventZulu = zuluTimestampToDate(atBatEvent.attr('tfs_zulu'));
								if (atBatEventZulu != undefined && atBatEventZulu > gameEventZulu) { break; }
								
								if (atBatEvent.is('runner')) {
									
									tempID = atBatEvent.attr('id');
									if (atBatEvent.attr('start') == '1B' && (onFirstID == tempID)) { onFirstID = ''; }
									else if (atBatEvent.attr('start') == '2B' && (onSecondID == tempID)) { onSecondID = ''; }
									else if (atBatEvent.attr('start') == '3B' && (onThirdID == tempID)) { onThirdID = ''; }
									if (atBatEvent.attr('end') == '1B') { onFirstID = tempID; }
									else if (atBatEvent.attr('end') == '2B') { onSecondID = tempID; }
									else if (atBatEvent.attr('end') == '3B') { onThirdID = tempID; }
									
								}
								
								atBatEvent = atBatEvent.next();
								runnerIndex++;
								
							}
						}
						
						if (outs == 3) { onFirstID = ''; onSecondID = ''; onThirdID = ''; }
					});
				});
			
				$('#eventList > li.event').tsort({ 
					sortFunction: function(a,b) { return b.e.data('zulu') - a.e.data('zulu'); } 
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