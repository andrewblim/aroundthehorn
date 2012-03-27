
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
						
		var inningURL = gameURL + "/inning/inning_all.xml";
		
		var gameID = $(this).data('gameday');
		var homeTeam = $(this).data('homeTeam');
		var awayTeam = $(this).data('awayTeam');
		
		$.get(inningURL, function(data) {
			
			$(data).children('game').each(function() {
				
				var inning, atbat, gameEvent;
				var gameEventText, gameEventZuluRaw, gameEventZulu, gameEventInning;
				var inningNumber = 1, atbatNumber = 1;
				var inningHalves = ['top', 'bottom'];
				var gameEventZuluRegexp = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)Z/;
				
				var homeR = 0, awayR = 0;
				
				// iterate over inning number, then top/bottom, then atbat number
				// not using .each() because it should work regardless of the order
				// of the data in the XML doc
				
				for (;; inningNumber++) {
					inning = $(this).children('inning[num=' + inningNumber + ']');
					if (inning.length == 0) { break; }
					for (var i = 0; i < inningHalves.length; i++) {
						for (;; atbatNumber++) {
							
							atbat = inning.children(inningHalves[i]).children('atbat[num=' + atbatNumber + ']');
							if (atbat.length == 0) { break; }

							gameEventText = atbat.attr('des');
							gameEventZuluRaw = gameEventZuluRegexp.exec(atbat.attr('start_tfs_zulu'));
							gameEventZulu = new Date(gameEventZuluRaw[1], gameEventZuluRaw[2]-1, gameEventZuluRaw[3], 
														 gameEventZuluRaw[4], gameEventZuluRaw[5], gameEventZuluRaw[6]);
							
							gameEventInning = inningNumber;
							if (inningHalves[i] == 'top') { gameEventInning = 'TOP ' + gameEventInning; }
							else if (inningHalves[i] == 'bottom') { gameEventInning = 'BOT ' + gameEventInning; }
							
							if (atbat.attr('home_team_runs') != undefined) { homeR = atbat.attr('home_team_runs'); }
							if (atbat.attr('away_team_runs') != undefined) { awayR = atbat.attr('away_team_runs'); }

							gameEvent = $('<li class="event ' + gameID + '" />');
							gameEvent.append($('<div class="eventTimestamp">' + zuluTimeToString(gameEventZulu) + '</div>'));
							gameEvent.append($('<div class="eventScoreboard"><div class="eventScoreboardWrap">' + 
											   '<div class="eventScoreboardInning">' + gameEventInning + '</div>' +
											   '<div class="eventScoreboardAway">' + 
											   '<div class="eventScoreboardTeam">' + awayTeam + '</div>' + 
											   '<div class="eventScoreboardScore">' + awayR + '</div>' + 
											   '</div><div class="eventScoreboardHome">' + 
											   '<div class="eventScoreboardTeam">' + homeTeam + '</div>' + 
											   '<div class="eventScoreboardScore">' + homeR + '</div>' +
											   '</div></div></div>'));
							
							gameEvent.append($('<div class="eventDescription">' + gameEventText + '</div>'));

							gameEvent.data('zulu', gameEventZulu.valueOf());

							$('#eventList').append(gameEvent);
							
						}
					}
				}
				
			});

			
			$('#eventList > li.event').tsort({ 
				sortFunction: function(a,b) {
					return b.e.data('zulu') - a.e.data('zulu');
				} 
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