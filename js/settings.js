
var teams = {
	'AL East': ['BAL', 'BOS', 'NYY', 'TB', 'TOR'],
	'AL Central': ['CLE', 'CWS', 'DET', 'KC', 'MIN'],
	'AL West': ['LAA', 'OAK', 'SEA', 'TEX'],
	'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
	'NL Central': ['CHC', 'CIN', 'HOU', 'MIL', 'PIT', 'STL'],
	'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF']
};

function setDefaultsIfUndefined() {
	
	for (var division in teams) {
		for (var i = 0; i < teams[division].length; i++) {
			if (localStorage['aroundthehorn_' + teams[division][i]] == undefined) {
				localStorage['aroundthehorn_' + teams[division][i]] = true;
			}
		}
	}
	
	if (localStorage['aroundthehorn_dateRollOffset'] == undefined) { localStorage['aroundthehorn_dateRollOffset'] = 0; }
	if (localStorage['aroundthehorn_otherTeams'] == undefined) { localStorage['aroundthehorn_otherTeams'] = true; }
	
}

function createTeamCheckboxes() {
	
	var appendString;
	for (var division in teams) {
		
		appendString = '<div class="teamSelectBoxDivision">' + 
						'<div class="teamSelectBoxDivisionName">' + division + '</div>' + 
						'<ul class="teamSelectBoxDivisionList">';
		
		for (var i = 0; i < teams[division].length; i++) {
			appendString += '<li><input id="' + teams[division][i] + '" type="checkbox" /> ' + teams[division][i] + '</li>';
		}
		
		appendString += '</ul></div>';
		$('#teamSelectBoxRow').append(appendString); 
	}
}

$(document).ready(function() {
	
	$('#saveSettings').click(function() {
		
		for (var division in teams) {
			for (var i = 0; i < teams[division].length; i++) {
				if ($('#' + teams[division][i]).prop('checked') == true) {
					localStorage['aroundthehorn_' + teams[division][i]] = true;
				}
				else { 
					localStorage['aroundthehorn_' + teams[division][i]] = false;
				}
			}
		}
		
		if ($('#otherTeams').prop('checked')) { localStorage['aroundthehorn_otherTeams'] = true; }
		else { localStorage['aroundthehorn_otherTeams'] = false; }
		localStorage['aroundthehorn_dateRollOffset'] = $('#dateRollOffset').attr('value') * 60 * 60 * 1000;
		
	});
	
	setDefaultsIfUndefined();
	createTeamCheckboxes();
	
	for (var division in teams) {
		for (var i = 0; i < teams[division].length; i++) {
			if (localStorage['aroundthehorn_' + teams[division][i]] == 'true') { 
				$('#' + teams[division][i]).prop('checked', true);
			}
			else { 
				$('#' + teams[division][i]).prop('checked', false); 
			}
		}
	}
	
	if (localStorage['aroundthehorn_otherTeams'] == 'true') { $('#otherTeams').prop('checked', true); }
	else { $('#otherTeams').prop('checked', false); }
	$('#dateRollOffset').attr('value', localStorage['aroundthehorn_dateRollOffset'] / 60 / 60 / 1000);
	
})