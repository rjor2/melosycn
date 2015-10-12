

//

var audioCtx = new AudioContext();
// Audio SourceNode
// keep as "global" for now
var source;

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
                 source = audioCtx.createMediaStreamSource(stream);
                 source.connect(audioCtx.destination);
            },
            // Error callback
            function(err) {
                console.log('The following gUM error occurred: ' + err);
            }
);