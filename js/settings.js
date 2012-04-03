
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
		
		var hasError = false;
		var errorMessage = '';
		if (Number($('#autoRefreshInterval').attr('value')) == undefined ||
			isNaN(Number($('#autoRefreshInterval').attr('value')))) {
			hasError = true;
			errorMessage += 'Auto-refresh field must be a number. ';
		}
		if (Number($('#dateRollOffset').attr('value')) == undefined ||
			isNaN(Number($('#dateRollOffset').attr('value')))) {
			hasError = true;
			errorMessage += 'Date rollover field must be a number. ';
		}
		if (hasError) {
			var saveMessage = $('<span id="saveMessage">Error: ' + errorMessage + '</span>');
			$(this).after(saveMessage);
			return;
		}
		
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
		
		localStorage['aroundthehorn_autoRefreshInterval'] = $('#autoRefreshInterval').attr('value') * 1000;
		if ($('#otherTeams').prop('checked')) { localStorage['aroundthehorn_otherTeams'] = true; }
		else { localStorage['aroundthehorn_otherTeams'] = false; }
		localStorage['aroundthehorn_dateRollOffset'] = $('#dateRollOffset').attr('value') * 60 * 60 * 1000;
		
		var saveMessage = $('<span id="saveMessage">Settings saved.</span>');
		$(this).after(saveMessage);
		
	});
	
	$('input[id!=saveSettings]').change(function() { $('#saveMessage').remove(); });
	
	$('#selectAll').click(function() {
		$('ul.teamSelectBoxDivisionList > li > input[type=checkbox]').prop('checked', true);
		$('#otherTeams').prop('checked', true);
	});
	$('#deselectAll').click(function() {
		$('ul.teamSelectBoxDivisionList > li > input[type=checkbox]').prop('checked', false);
		$('#otherTeams').prop('checked', false);
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
	
	$('#autoRefreshInterval').attr('value', localStorage['aroundthehorn_autoRefreshInterval'] / 1000);
	if (localStorage['aroundthehorn_otherTeams'] == 'true') { $('#otherTeams').prop('checked', true); }
	else { $('#otherTeams').prop('checked', false); }
	$('#dateRollOffset').attr('value', localStorage['aroundthehorn_dateRollOffset'] / 60 / 60 / 1000);
	
})