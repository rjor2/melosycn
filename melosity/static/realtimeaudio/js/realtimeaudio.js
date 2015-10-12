

//

var audioCtx = new AudioContext();
// Audio SourceNode
// keep as "global" for now
var source;

var analyser = audioCtx.createAnalyser();
analyser.fftSize = 64;
var frequencyData = new Uint8Array(analyser.frequencyBinCount);
// Set up the visualisation elements
var frequencyVisualisation = $("#frequency");
var barSpacingPercent = 100 / analyser.frequencyBinCount;
for (var i = 0; i < analyser.frequencyBinCount; i++) {
    $("<div/>").css("left", i * barSpacingPercent + "%").css("width", barSpacingPercent + "%").appendTo(frequencyVisualisation);

}
var bars = $("#frequency > div");


// analyser.getByteFrequencyData(frequencyData);

// Set getUserMedia and gather Stream data
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);
navigator.getUserMedia (
        // constraints - only audio needed for this app
            {
                audio: true
            },
            // Success callback
            function(stream) {
                startstream(stream);
            },
            // Error callback
            function(err) {
                console.log('The following gUM error occurred: ' + err);
            }
);


function startstream(stream) {
                 source = audioCtx.createMediaStreamSource(stream);
                 source.connect(analyser)
                 analyser.connect(audioCtx.destination);
            };


function update() {
    // Schedule the next update
    requestAnimationFrame(update);

    // Get the new frequency data
    analyser.getByteFrequencyData(frequencyData);

    // Update the visualisation
    bars.each(function (index, bar) {
        bar.style.height = frequencyData[index] + 'px';
    });
};

// Kick it off...
update();