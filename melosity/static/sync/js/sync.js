
// 1600 pixels = 332136 frames

var audioCtx = new AudioContext();
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

var track1Buffer = audioCtx.createBuffer(1,22050,44100)
var track1Source;

var scriptNode = audioCtx.createScriptProcessor(4096, 2, 2);

var time = 0;

var lag = 0;
// rec
var recording = false;
var recBuffer = [[],[]];
var recLength = 0;
recNode = audioCtx.createScriptProcessor(8192,2,2);

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
                 source.connect(recNode);
                 recNode.connect(audioCtx.destination);
            },
            // Error callback
            function(err) {
                my_err = err;
                console.log('The following gUM error occured: ' + err);
            }
);

function loadBeat(object) {

    var request = new XMLHttpRequest();
    request.open('GET', "https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/snare.wav", true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        audioCtx.decodeAudioData(request.response, function(buffer) {
            object.buffer = audioCtx.createBuffer(buffer.numberOfChannels,buffer.length * 8,audioCtx.sampleRate)
            for (var channel = 0; channel < 2; channel++){
                var channelData = new Float32Array(buffer.length * 8);
                for (i = 0; i < 8; i++){
                    channelData.set(buffer.getChannelData(channel), buffer.length * i);
                }
            }
            object.buffer.copyToChannel(channelData,0,0);
            object.draw();

            // starts draw loop;
            draw();
        });

    }
    request.send();
}

// Processors Nodes
// Give the node a function to process audio events
scriptNode.onaudioprocess = function(audioProcessingEvent) {
  time += audioProcessingEvent.inputBuffer.duration
  var inputBuffer = audioProcessingEvent.inputBuffer;
  var outputBuffer = audioProcessingEvent.outputBuffer;

  // Loop through the output channels (in this case there is only one)
  for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
    var inputData = inputBuffer.getChannelData(channel);
    var outputData = outputBuffer.getChannelData(channel);

    // Loop through the 4096 samples
    for (var sample = 0; sample < inputBuffer.length; sample++) {
      // make output equal to the same as the input
      outputData[sample] = inputData[sample];

    }
  }
}
recNode.onaudioprocess = function(audioProcessingEvent) {
    if (!recording) return;
    recLength += audioProcessingEvent.inputBuffer.getChannelData(0).length;
    for (var channel = 0; channel < 2; channel++){
        recBuffer[channel].push(new Float32Array(audioProcessingEvent.inputBuffer.getChannelData(channel)));
    }
    // console.log(event.inputBuffer.getChannelData(0)[0]);
}




function addBeat(object) {
    object.name = object.id;
    object.play = function () {
        var s = audioCtx.createBufferSource();
        s.buffer = object.buffer;
        s.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);
        // s.connect(audioCtx.destination);
        s.start(0);
        object.s = s;
    }

    object.record = function (){
        recBuffer = [[],[]];
        recLength = 0;
        recording = true;

    }

    object.draw = function () {
        var canvas = object
        var canvasCtx = canvas.getContext('2d');
        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();
        var numberOfPoints = 1000;
        var sliceWidth = (canvas.width * 1.0 * object.buffer.length) / (numberOfPoints * 332136);
        var x = 0;
        for(var i = 0; i < object.buffer.length; i += Math.floor(object.buffer.length / numberOfPoints)) {

            var v = object.buffer.getChannelData(0)[i] / 1.0;
            var y = v * canvas.height/2 + canvas.height/2;

            if(i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height/2);
        canvasCtx.stroke();


    }
}

$(function() {
	$('#track1 canvas').each(function() {
        addBeat(this);
        loadBeat(this);

    });

    $('#track2 canvas').each(function() {
        addBeat(this);
    });

    $('#play').click(function() {
        time = 0;
        var track1 = $('#track1 canvas')[0]
        track1.play();
        var track2 = $('#track2 canvas')[0]
        track2.play();
    });

    $('#rec').click(function() {
        var track1 = $('#track1 canvas')[0]
        track1.play();
        var track2 = $('#track2 canvas')[0]
        track2.record();
    });

    $('#stop').click(function() {
        // this is really stop recording
        recording = false;
        time = 0;

        myBuffer = audioCtx.createBuffer(2,recLength,audioCtx.sampleRate)
        var buffer = [];
        for (var channel = 0; channel < 2; channel++){
            var channelData = new Float32Array(recLength);
            var offset = 0;
            for (var i = 0; i < recBuffer[0].length; i++){
                channelData.set(recBuffer[channel][i], offset);
                offset += recBuffer[0][i].length;
            }

            if (lag > 0){
                myBuffer.copyToChannel(channelData.slice(lag),channel,0);
            }
            else{
                myBuffer.copyToChannel(channelData,channel,-lag);
            }
        }

        var object = $('#track2 canvas')[0]
        object.buffer = myBuffer;
        object.draw();
    });

    $('#lag').keyup(function() {
        lag = parseInt(this.value);
    })

    $('#main canvas').mousedown( function(e) {
        frameLengthStart = e.pageX
    })

    $('#main canvas').mouseup( function(e) {
        frameLengthStop = e.pageX
        frameLength = frameLengthStop - frameLengthStart;
        $('#frames')[0].value = frameLength * 332136.0 / 1600
    })
});


function draw() {
      var canvas = $('#main canvas')[0];
      var canvasCtx = canvas.getContext('2d');

      // draw main canvas
      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      drawVisual = requestAnimationFrame(draw);

      // canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      // canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // clear
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = 'rgb(255, 0, 0)';

      // drums
      drumCanvas = $('#track1 canvas')[0];
      canvasCtx.drawImage(drumCanvas,0,0)

      // rec
      recCanvas = $('#track2 canvas')[0];
      canvasCtx.drawImage(recCanvas,0,200)


      // time line
      canvasCtx.beginPath();

      var x = 0;

      canvasCtx.moveTo(time * canvas.width / (drumCanvas.buffer.duration), 0);
      canvasCtx.lineTo(time * canvas.width / (drumCanvas.buffer.duration), canvas.height);

      canvasCtx.stroke();

};

