jQuery(document).ready(function() {
    // Selektiere alle <ol>-Elemente mit einem 'start'-Attribut.
    jQuery('ol[start]').each(function() {
        // Hole den Startwert aus dem 'start'-Attribut und subtrahiere 1,
        // weil die Zählung beim ersten <li>-Element sofort um eins erhöht wird.
        var startValue = parseInt(jQuery(this).attr('start'), 10) - 1;
        // Setze den CSS-Counter (step-counter) auf den angepassten Startwert.
        // Diese Einstellung passt den Beginn der Nummerierung der Listenelemente an.
        jQuery(this).css('counter-reset', 'step-counter ' + startValue);
    });
});

