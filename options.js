var google = new OAuth2('google', {
	client_id: '<INSERT YOUR CLIENT ID HERE>',
	client_secret: '<INSERT YOUR CLIENT SECRET HERE>',
	api_scope: 'https://www.google.com/m8/feeds/'
});

function authorize(providerName) {
	var provider = window[providerName];
	provider.authorize(checkAuthorized);
}

function clearAuthorized() {
	console.log('clear');
	['google'].forEach(function(providerName) {
		var provider = window[providerName];
		provider.clearAccessToken();
	});
	checkAuthorized();
}

function httpGet(theUrl, accessToken) {
	var xmlHttp = null;

	xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", theUrl, false);
	xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	xmlHttp.send(null);
	var status = xmlHttp.status;
	console.log("Status code is: " + status);
	if (status == 200) {
		return xmlHttp.responseText;
	} else {
		return 0;
	}
}

function checkAuthorized() {
	console.log('checkAuthorized');
	['google'].forEach(function(providerName) {
		var provider = window[providerName];
		var button = document.querySelector('#' + providerName);
		if (provider.hasAccessToken()) {
			var access_token = provider.getAccessToken();
			var xml = httpGet("https://www.google.com/m8/feeds/contacts/default/full?max-results=900", access_token);
			if (xml != 0) {
				$("#hide_initial").show();
				$("#google").text("Logged in");
				var xmlDoc = $.parseXML(xml),
					$xml = $(xmlDoc);
				var frm_email = $xml.find('id').get(0);
				var email_list = $xml.find('email');
				var myContacts = new Array();
				$(email_list).each(function(index) {
					var elist = email_list.get(index);
					var address_val = $(elist).attr('address');
					myContacts[index] = address_val;
				});
				var fromAddress = frm_email.textContent;
				localStorage.setItem("myContacts", myContacts);
				localStorage.setItem("fromAddress", fromAddress);
				button.classList.add('authorized');

				var storedString = localStorage.getItem("myContacts");
				var availableTags = storedString.split(',');
				$("#tags").autocomplete({
					source: availableTags
				});

				var fromAddress = localStorage.getItem("fromAddress");
				var fromAddressJSON = new Object();
				fromAddressJSON.FromAddress = fromAddress;
				fromAddressJSON.AccessToken = access_token;
				$.post("http://SlickShare.com/LinkGetter.php", fromAddressJSON, function(data) {
					$('#link_display').append(data);
					$($('a#get_links')).click(function() {
						chrome.tabs.create({
							url: $(this).attr('href')
						});
						return false;
					});
					console.log("Data Loaded: " + data);
				});
				var myJSON = new Object();
				chrome.tabs.query({
					'active': true
				}, function(tabs) {
					var url = tabs[0].url;
					myJSON.link = url;
					var dots = ""
					if (url.length > 30) {
						dots = "...";
					}
					$("#current").text(url.substring(0, 30) + dots);
					$("#current").attr("href", url);
					console.log(url);
					$('#current').click(function() {
						chrome.tabs.create({
							url: $(this).attr('href')
						});
						return false;
					});
					$("button#send").click(function() {
						var toAddress = $("#tags").val();
						var fromAddress = localStorage.getItem("fromAddress");
						myJSON.from_address = fromAddress;
						myJSON.to_address = toAddress;
						myJSON.AccessToken = access_token;
						$.post("http://SlickShare.com/LinkSender.php", myJSON, null);
						$("#check").show();
					});
				});
			} else {
				$("#hide_initial").hide();
				$("#google").text("Login");
			}
		} else {
			button.classList.remove('authorized');
			$("#hide_initial").hide();
			$("#google").text("Login");
		}
	});
}

document.addEventListener('DOMContentLoaded', function() {
	$("#check").hide();
	document.querySelector('#google').addEventListener('click', function() {
		authorize('google');
	});
	checkAuthorized();
});
