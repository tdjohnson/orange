export function closeStart() {
	document.getElementById("startScreen").style.display="none";
	return true;
}

export function showMessageContent(text) {
	document.getElementById("message").innerHTML = text;
}