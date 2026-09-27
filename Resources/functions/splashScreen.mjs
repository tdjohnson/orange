export function closeStart() {
	document.getElementById("startScreen").style.display = "none";
	return true;
}

export function showStart() {
	document.getElementById("startScreen").style.display = "block";
	return true;
}

export function showMessageContent(text) {
	const messageElement = document.getElementById("message");
	if (messageElement) {
		messageElement.innerHTML = text;
	}
}
