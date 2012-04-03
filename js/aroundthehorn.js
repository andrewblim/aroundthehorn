
var gamedayURL = "http://gd2.mlb.com/components/game/mlb";
var teams = {
	'AL East': ['BAL', 'BOS', 'NYY', 'TB', 'TOR'],
	'AL Central': ['CLE', 'CWS', 'DET', 'KC', 'MIN'],
	'AL West': ['LAA', 'OAK', 'SEA', 'TEX'],
	'NL East': ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'],
	'NL Central': ['CHC', 'CIN', 'HOU', 'MIL', 'PIT', 'STL'],
	'NL West': ['ARI', 'COL', 'LAD', 'SD', 'SF']
};

function numberToOrdinal(n) {
	if ((n % 10) == 1 && (n % 100) != 11) { return n + 'st'; }
	else if ((n % 10) == 2 && (n % 100) != 12) { return n + 'nd'; }
	else if ((n % 10) == 3 && (n % 100) != 13) { return n + 'rd'; }
	else { return n + 'th'; }
}

function padNumber(number, pad, places) {
	return Array(Math.max(places - number.toString().length, 0) + 1).join(pad) + number;
}

function setDefaultsIfUndefined() {
	
	for (var division in teams) {
		for (var i = 0; i < teams[division].length; i++) {
			if (localStorage['aroundthehorn_' + teams[division][i]] == undefined) {
				localStorage['aroundthehorn_' + teams[division][i]] = true;
			}
		}
	}
	if (localStorage['aroundthehorn_autoRefreshInterval'] == undefined) { localStorage['aroundthehorn_autoRefreshInterval'] = 0; }
	if (localStorage['aroundthehorn_dateRollOffset'] == undefined) { localStorage['aroundthehorn_dateRollOffset'] = 0; }
	if (localStorage['aroundthehorn_otherTeams'] == undefined) { localStorage['aroundthehorn_otherTeams'] = true; }
	
}

function daysBetween(date1, date2) {
	var date1Flat = new Date(date1.getYear(), date1.getMonth(), date1.getDate());
	var date2Flat = new Date(date2.getYear(), date2.getMonth(), date2.getDate());
	return (date2Flat - date1Flat)/(1000 * 60 * 60 * 24);
}