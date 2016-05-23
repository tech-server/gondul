"use strict";

var nmsSearch = nmsSearch || {
	_handler: false,
	_lastId: false
};

nmsSearch.helpText =  [
	"The search box can be used to identify switches in several ways. The simplest is by name.",
	"Searching by name can be done by just entering text, or if you want to match \"foobar1\" but not \"foobar15\" you can enclose the name in quotation marks. E.g.: foobar1 matches foobar1 and foobar1123123123, while \"foobar1\" only matches exactly foobar1.",
	"If you are using the non-public version of Gondul, you can also perform smart searches.",
	"Distro search: Type the name of a distro-switch and all access switches registered to that distro switch will also be hilighted.",
	'Active ports: Type "active>x", "active<x" or "active=x" to identify switch with "x" amount of active gigabit ethernet (ge) ports. E.g.: "active>30".',
	'IP search: Start typing an IP and any switch with that IP registered either as management IP or part of its subnet will be identified',
	'SNMP search: Type anything found in the "sysDescr" SNMP OID to hilight a switch matching that. Practical examples include version numbers for firmware (e.g.: "JUNOS 12." vs "JUNOS 14.").'];

/*
 * Test if the search expression "id" matches the switch "sw"
 *
 * Return true if it does.
 */
nmsSearch.searchTest = function(id, sw) {
	try {
		var re = new RegExp(id,"i");
		if(re.test(sw)) {
			return true;
		}
		if (id[0] == "\"") {
			if (("\"" + sw.toLowerCase() + "\"") == id.toLowerCase()) {
				return true;
			} else {
				return false;
			}
		}
		try {
			if (nmsData.switches.switches[sw].distro_name.toLowerCase() == id) {
				return true;
			}
		} catch (e) {}
		try {
		if (id.match("active")) {
			var limit = id;
			limit = limit.replace("active>","");
			limit = limit.replace("active<","");
			limit = limit.replace("active=","");
			var operator = id.replace("active","")[0];
			if (limit == parseInt(limit)) {
				var ports = parseInt(nmsData.switchstate.switches[sw].ifs.ge.live);
				limit = parseInt(limit);
				if (operator == ">" ) {
					if (ports > limit) {
						return true;
					}
				} else if (operator == "<") {
					if (ports < limit) {
						return true;
					}
				} else if (operator == "=") {
					if (ports == limit) {
						return true;
					}
				}
			}
		}
		} catch (e) {}
		try {
			if (nmsData.smanagement.switches[sw].mgmt_v4_addr.match(id)) {
				return true;
			}
			if (nmsData.smanagement.switches[sw].mgmt_v6_addr.match(id)) {
				return true;
			}
		} catch (e) {}
		try {
			if (nmsData.smanagement.switches[sw].subnet4.match(id)) {
				return true;
			}
			if (nmsData.smanagement.switches[sw].subnet6.match(id)) {
				return true;
			}
		} catch (e) {}
		if (nmsData.snmp.snmp[sw].misc.sysDescr[0].toLowerCase().match(id)) {
			return true;
		}
	} catch (e) {
		return false;
	}
	return false;
};

nmsSearch.reset = function() {
	var el = document.getElementById("searchbox");
	el.value = "";
	nmsSearch.search();
}

nmsSearch._enableTimer = function() {
	if (nmsSearch._handler == false) {
		nmsSearch._handler = setInterval(nmsSearch.search,1000);
	}
}

nmsSearch._disableTimer = function() {
	if (nmsSearch._handler != false) {
		clearInterval(nmsSearch.search);
	}
}

nmsSearch.search = function() {
	var el = document.getElementById("searchbox");
	var id = false;
	var matches = [];
	if (el) {
		id = el.value.toLowerCase();
	}
	if(id) {
		nmsMap.enableHighlights();
		for(var sw in nmsData.switches.switches) {
			if (nmsSearch.searchTest(id,sw)) {
				matches.push(sw);
				nmsMap.setSwitchHighlight(sw,true);
			} else {
				nmsMap.setSwitchHighlight(sw,false);
			}
		}
		nmsSearch._enableTimer();
	} else {
		nmsSearch._disableTimer();
		nmsMap.disableHighlights();
	}
	if(matches.length == 1) {
		document.getElementById("searchbox-submit").classList.add("btn-primary");
		document.getElementById("searchbox").dataset.match = matches[0];
	} else {
		document.getElementById("searchbox-submit").classList.remove("btn-primary");
		document.getElementById("searchbox").dataset.match = '';
	}
};

nmsSearch._searchKeyListener = function(e) {
	switch (e.keyCode) {
		case 13:
			var sw = document.getElementById("searchbox").dataset.match;
			if(sw != '') {
				nmsInfoBox.showWindow("switchInfo",sw);
			}
			break;
		case 27:
			document.getElementById("searchbox").dataset.match = '';
			document.getElementById("searchbox").value = '';
			nmsInfoBox._search();
			nmsInfoBox.hide();
			break;
	}
}

nmsSearch.init = function() {
	$("#searchbox").keyup(function(e) {
		nmsSearch._searchKeyListener(e);
	});
}
