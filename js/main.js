
function parseAsOfDate(date) {
	var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return dayNames[date.getDay()] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
}

function zuluTimestampToDate(zuluTime) {
	try {
		var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
		var gameEventZuluRaw = gameEventZuluRegexp.exec(zuluTime);
		return new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
	}
	catch (err) { return undefined; }
}

function zuluTimeToTimestamp(zuluTime) {
	
	var zuluTimeLocal; 
	var retString = '';
	
	try {
		zuluTimeLocal = new Date(zuluTime.valueOf() - zuluTime.getTimezoneOffset() * 60 * 1000);
	}
	catch (err) { return undefined; }
	
	if (zuluTimeLocal.valueOf() < asOfDate.valueOf()) { retString = '(-1d) '; }
	else if (zuluTimeLocal.valueOf() > asOfDate.valueOf()) { retString += '(+1d) '; }
	
	var hours = ((zuluTimeLocal.getHours() + 11) % 12) + 1;
	
	retString += hours + ':' +
				 padNumber(zuluTimeLocal.getMinutes(), 0, 2) + ':' + 
				 padNumber(zuluTimeLocal.getSeconds(), 0, 2);
	
	if (zuluTimeLocal.getHours() < 12) { retString += ' AM'; }
	else { retString += ' PM'; }
	
	return retString;
}

function populateScoreboard() {
	
	asOfDate = new Date(Date.parse($('#asOfDate').attr('value')));
	
	var scoreboardURL = gamedayURL + 
						'/year_' + asOfDate.getFullYear() + 
						'/month_' + padNumber(asOfDate.getMonth() + 1, 0, 2) + 
						'/day_' + padNumber(asOfDate.getDate(), 0, 2) + 
						'/miniscoreboard.xml';
	
	var teamList = [];
	for (var division in teams) { teamList = teamList.concat(teams[division]); }
	
	$('#eventList').empty();
	
	$.get(scoreboardURL, function(data) { 
		
		$('#gameList').empty();
		
		games = $(data).find('game').each(function() {
			
			var gameBox = $('<li class="gameBox" />');
			gameBox.data('id', $(this).attr('id'));
			gameBox.data('gameday', $(this).attr('id').replace(/[\-\/]/g, '_'));   // unsure why $(this).attr('gameday') doesn't work
			gameBox.attr('id', 'gameBox_' + gameBox.data('gameday'));
			
			gameBox.data('homeTeam', $(this).attr('home_name_abbrev'));
			gameBox.data('awayTeam', $(this).attr('away_name_abbrev'));
			gameBox.data('homeTeamR', $(this).attr('home_team_runs'));
			gameBox.data('awayTeamR', $(this).attr('away_team_runs'));
			$('#gameList').append(gameBox);
			
			var ampm = 0, timeRaw;
			if ($(this).attr('ampm').toUpperCase() == "PM") { ampm = 12; }
			timeRaw =  /(\d+):(\d\d)/.exec($(this).attr('time'));
			gameBox.data('startTime', asOfDate.valueOf() + (((timeRaw[1] == 12 ? 0 : timeRaw[1]) + ampm) * 60 + timeRaw[2]) * 1000);
			
			var gameBoxCheckBox = $('<input class="gameBoxCheckBox" type="checkbox" />');
			if (localStorage['aroundthehorn_' + gameBox.data('homeTeam')] == 'true' ||
				localStorage['aroundthehorn_' + gameBox.data('awayTeam')] == 'true') {
				gameBoxCheckBox.prop('checked', true);
			}
			else if (localStorage['aroundthehorn_otherTeams'] == 'true' && 
					($.inArray(gameBox.data('homeTeam'), teamList) == -1 || $.inArray(gameBox.data('awayTeam'), teamList) == -1)) {
				gameBoxCheckBox.prop('checked', true);
			}
			else {
				gameBoxCheckBox.prop('checked', false);
			}
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
			
			gameBox.data('complete', false);
			if (gameStatus == "in progress") {
				if (topInning.toLowerCase() == 'y') { gameBoxStatus.text('Top ' + numberToOrdinal(inning)); }
				else { gameBoxStatus.text('Bot ' + numberToOrdinal(inning)); }
			}
			else if (gameStatus == 'final' || gameStatus == 'game over' || gameStatus == 'completed early') {
				if (inning != 9) { gameBoxStatus.text('Final (' + inning + ')'); }
				else { gameBoxStatus.text('Final'); gameBox.data('complete', true); }
			}
			else if (gameStatus == 'delay') {
				gameBoxStatus.text('Delay');
			}
			else if (gameStatus == 'preview') {
				gameBoxStatus.text($(this).attr('time') + ' ' + $(this).attr('ampm') + ' ' + $(this).attr('time_zone'));
			}
			else if (gameStatus == 'pre-game' || gameStatus == 'warmup') {
				gameBoxStatus.text('Pregame');
			}
			else if (gameStatus != undefined) {
				gameBoxStatus.text(gameStatus);
			}
			else { gameBoxStatus.html('&nbsp;') }
			gameBoxData.append(gameBoxStatus);
			
			gameBox.click(function() { 
				var checkBox = $($(this).children('input[type=checkbox]'));
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
	
	var gamesLoaded = 0;
	var gamesTotal = $('#gameList').children().length;
	
	$('#gameList').children().each(function() {
		
		// uncomment to debug on single games
		// if ($(this).data('gameday') != "2012_03_29_minmlb_pitmlb_1") { return; }
		// if ($(this).data('homeTeam') != 'BOS' && $(this).data('awayTeam') != 'BOS') { return; }
		
		var isVisible;
		if ($('#gameBox_' + $(this).data('gameday') + ' > input[type=checkbox]').prop('checked') == true) {
			isVisible = true;
		}
		else { isVisible = false; }
		
		var isComplete = $(this).data('complete');
		
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
					
					var prevGameEventZulu;
					
					var homeR = 0, awayR = 0, outs = 0;
					var batterID = '', pitcherID = '', onFirstID = '', onSecondID = '', onThirdID = '';
					var prevOnFirstID, prevOnSecondID, prevOnThirdID, tempID;
					
					prevGameEventZulu = new Date(asOfDate);
					
					// still problems: if inning ends on CS/PO it gets duped
					
					$(this).find('atbat,action').each(function() {
						
						var eventType = $(this).attr('event').toLowerCase();
						if (eventType == 'game advisory' || eventType == 'defensive sub' || eventType == 'defensive switch') {
							return;
						}
						
						var inning, inningHalf;
						var gameEventText, gameEventZulu;
						
						inning = $(this).parent().parent().attr('num');
						if ($(this).parent().is('top')) { inningHalf = 'Top'; }
						else if ($(this).parent().is('bottom')) { inningHalf = 'Bot'; }
						
						if ($(this).attr('o') != undefined) { outs = $(this).attr('o'); }
						if ($(this).attr('des') != undefined) { gameEventText = $(this).attr('des'); }
						
						// <atbat> and <action> tags handled differently
						
						if ($(this).is('atbat')) {
							
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
							
							// Pinch runners are a problem... I don't see anywhere in the XML file where it is 
							// explicitly stated who is replacing whom (surprised it's not done with <runner>
							// tags). So I'm backing it out of the description, not ideal, I know. 
							
							var pinchRunnerData = /Pinch runner (\S+) (\S+) replaces (\S+) (\S+)\./.exec(gameEventText);
							if (pinchRunnerData != null) {
								if (onFirstID != '' && players[onFirstID].first == pinchRunnerData[3] && players[onFirstID].last == pinchRunnerData[4]) {
									onFirstID = $(this).attr('player');
								}
								else if (onSecondID != '' && players[onSecondID].first == pinchRunnerData[3] && players[onSecondID].last == pinchRunnerData[4]) {
									onFirstID = $(this).attr('player');
								}
								else if (onThirdID != '' && players[onThirdID].first == pinchRunnerData[3] && players[onThirdID].last == pinchRunnerData[4]) {
									onFirstID = $(this).attr('player');
								}
							}
							
						}
						
						// in case gameEventZulu was undefined, just use the previous timestamp plus a small value
						// this shouldn't happen in MLB's XML files but occasionally does
						
						if (gameEventZulu == undefined) { gameEventZulu = new Date(prevGameEventZulu.valueOf() + 1); }
						
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
						
						// main section: construct the DOM elements that create the event feed
						
						var gameEvent = $('<li class="event ' + gameID + '" />');
						gameEvent.data('zulu', gameEventZulu.valueOf());
						gameEvent.data('gameday', gameID);
						if (isVisible == false) { gameEvent.css('display', 'none'); }
						
						gameEvent.append($(
										'<div class="eventIcon">' + 
										'</div>' + 
										'<div class="eventTimestamp">' + zuluTimeToTimestamp(gameEventZulu) + '</div>' + 
										
										'<div class="eventScoreboard">' + 
										'<div class="eventScoreboardInning">' +
										inningHalf + ' ' + numberToOrdinal(inning) + ', <span class="eventScoreboardOuts">' + outs + ' out</span>' + 
										'</div>' + 
										'<div class="eventScoreboardWrap">' +
										'<div class="eventScoreboardAway">' + 
										'<div class="eventScoreboardTeam">' + awayTeam + '</div>' +
										'<div class="eventScoreboardScore' + (awayRchanged ? ' scoreChanged' : '') + '">' + awayR + '</div>' +
										'</div>' +
										'<div class="eventScoreboardHome">' + 
										'<div class="eventScoreboardTeam">' + homeTeam + '</div>' +
										'<div class="eventScoreboardScore' + (homeRchanged ? ' scoreChanged' : '') + '">' + homeR + '</div>' +
										'</div>' +
										'</div>' +
										'</div>' +
										
										'<div class="eventAtBat">' +
										'<div class="eventAtBatWrap">' +
										'<div class="eventAtBatPosition">' +
										'<div class="eventAtBatLabel">P:</div>' + 
										'<div class="eventAtBatPlayer">' + players[pitcherID].shortName + '</div>' +
										'</div>' +
										'<div class="eventAtBatPosition">' +
										'<div class="eventAtBatLabel">AB:</div>' +
										'<div class="eventAtBatPlayer">' + players[batterID].shortName + '</div>' + 
										'</div>' +
										'</div>' +
										'</div>' +
										
										'<div class="eventAtBat">' +
										'<div class="eventAtBatWrap ' + (outs == 3 ? ' eventAtBatThirdOut' : '') + '">' +
										'<div class="eventAtBatPosition">' + 
										'<div class="eventAtBatLabel">1st:</div>' +
										'<div class="eventAtBatPlayer">' + (onFirstID == '' ? '' : players[onFirstID].shortName) + '</div>' +
										'</div>' +
										'<div class="eventAtBatPosition">' + 
										'<div class="eventAtBatLabel">2nd:</div>' +
										'<div class="eventAtBatPlayer">' + (onSecondID == '' ? '' : players[onSecondID].shortName) + '</div>' +
										'</div>' +
										'<div class="eventAtBatPosition">' +
										'<div class="eventAtBatLabel">3rd:</div>' +
										'<div class="eventAtBatPlayer">' + (onThirdID == '' ? '' : players[onThirdID].shortName) + '</div>' +
										'</div>' +
										'</div>' +
										'</div>' +
										
										'<div class="eventDescription' + (awayRchanged || homeRchanged ? ' scoringPlay' : '') + '">' + gameEventText + '</div>'
										));
						
						gameEvent.hover(
							function() {
								var focusButton = $(
									'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20">' +
									'<defs>' +
									'<radialGradient id="focusButtonBG" cx="50%" cy="50%" r="50%">' + 
									'<stop id="focusButtonBG_innerColor" offset="0%" stop-color="rgb(208,208,208)" />' +
									'<stop id="focusButtonBG_outerColor" offset="100%" stop-color="rgb(176,176,176)" />' +
									'</radialGradient>' +
									'</defs>' +
									"<circle fill=\"url('#focusButtonBG')\" stroke-width=\"0\" cx=\"10\" cy=\"10\" r=\"10\" />'" +
									'<polygon fill="white" stroke="white" stroke-width="0" points="7,6 14,10 7,14 9,10" />' +
									'</svg>'
								);
								focusButton.hover(
									function() { 
										$('#focusButtonBG_innerColor').attr('stop-color', 'rgb(208,208,255)');
										$('#focusButtonBG_outerColor').attr('stop-color', 'rgb(160,160,255)');
									}, 
									function() {
										$('#focusButtonBG_innerColor').attr('stop-color', 'rgb(208,208,208)');
										$('#focusButtonBG_outerColor').attr('stop-color', 'rgb(176,176,176)');
									});
								focusButton.mousedown(function(e) {
									if (e.which == 1) { 
										$('#focusButtonBG_outerColor').attr('stop-color', 'rgb(128,128,255)'); 
									}
								});
								focusButton.mouseup(function(e) {
									if (e.which == 1) { 
										$('#focusButtonBG_outerColor').attr('stop-color', 'rgb(160,160,255)'); 
									}
								});
								focusButton.click(function(e) {
									if (e.which == 1) {
										var gameID = $(this).parent().parent().data('gameday');
										$('li.gameBox').each(function() { 
											if ($(this).data('gameday') == gameID) {												
												if ($(this).children('input.gameBoxCheckBox').prop('checked') == false) { 
													$(this).click(); 
												}
											}
											else {
												if ($(this).children('input.gameBoxCheckBox').prop('checked') == true) { 
													$(this).click(); 
												}
											}
										});
										$(window).scrollTop($(this).parent().parent().offset().top);
									}
								});
								$(this).children('.eventIcon').append(focusButton);
							},
							function() {
								$(this).children('.eventIcon').empty();
							}
						);
						$('#eventList').append(gameEvent);
						
						// update runner data
						
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
							
							var atBatEvent = $(this).nextAll('atbat').children().eq(0);
							var atBatEventZulu;
							
							while (atBatEvent.length > 0) {
								
								atBatEventZulu = zuluTimestampToDate(atBatEvent.attr('tfs_zulu'));
								if (atBatEventZulu != undefined) {
									if (atBatEventZulu <= prevGameEventZulu) { atBatEvent = atBatEvent.next(); continue; }
									if (atBatEventZulu > gameEventZulu) { break; }
								}
								
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
							}
							
						}
						
						prevGameEventZulu = gameEventZulu; 
						
					});
					
				});
				
				$('#eventList > li.event').tsort({ 
					sortFunction: function(a,b) { return b.e.data('zulu') - a.e.data('zulu'); } 
				});
				
				if (isComplete) {
					$('#eventList > li.event[class~=' + gameID + ']:first > div.eventScoreboard').addClass('eventScoreboardComplete');
				}
				
				gamesLoaded++;
				$('#loadStatus').text('Loaded ' + gamesLoaded + ' out of ' + gamesTotal + ' games...');
				$('#progressBar').progressbar({ value: (gamesLoaded / gamesTotal) * 100 });
			});
		});
	
	});

}

// "main" /////////////////////////////////////////////////////////////////////

$(document).ready(function() {
	
	setDefaultsIfUndefined();
	
	// var timer;
	$('#loadStatus').ajaxStart(function() {
		// timer = (new Date()).valueOf();
		$('#progressBar').progressbar({ value: 0 });
		$(this).text('Loading...');
	});
	$('#loadStatus').ajaxStop(function() {
		$('#progressBar').progressbar({ value: 100 });
		$(this).text('Ready');
		// alert(((new Date()).valueOf() - timer)/1000);
	});
	
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
	
	$('#progressBar').progressbar({ value: 100 });

	var asOfDate = new Date(Date.now() - Number(localStorage['aroundthehorn_dateRollOffset']));
	var scoreboardData;
	
	$('#asOfDate').datepicker({
		dateFormat: 'D d M yy',
		defaultDate: +0,
		changeMonth: true,
		changeYear: true
	});
	
	$('#asOfDate').change(populateScoreboard);
	$('#asOfDate').attr('value', parseAsOfDate(asOfDate));
	
	populateScoreboard();
	
});