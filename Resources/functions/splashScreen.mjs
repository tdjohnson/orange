export function closeStart() {
	document.getElementById("startScreen").style.display="none";
	return true;
}

export function showMessageContent(text) {
	document.getElementById("message").innerHTML = text;
}

export function toggleClickToStart() {
	const button = document.getElementById("clickStart");
	const computedStyle = window.getComputedStyle(button);

	console.log(computedStyle);
	if (computedStyle.visibility === 'visible') {
		button.style.visibility = "hidden";
	} else {
		if (computedStyle.visibility === "hidden") {
			button.style.visibility = "visible";
		}
	}
}