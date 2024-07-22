(async() => {
	ui.notifications.info('Should display "Tester 1" Token image on the left.')
	const testerToken = game.canvas.tokens.placeables.find(t => t.name === 'Tester 1')

	new Sequence().effect().from(testerToken).atLocation({x: 1700, y: 1500}).duration(5000).play()
})()