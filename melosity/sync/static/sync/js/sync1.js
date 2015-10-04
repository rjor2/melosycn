var context = new AudioContext();
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);
var myBuffer = context.createBuffer(1,22050,44100)
var source

var recBuffer = [[],[]];
var recLength = 0;


var drumBuffer = context.createBuffer(1,22050,44100)
var drumSource;

function playDrum(){
    drumSource = context.createBufferSource();
    drumSource.buffer = drumBuffer;
    // drumSource.loop = true;
    drumSource.connect(context.destination);
    drumSource.start(0);
}

function loadAudio( object, url) {

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            object.buffer = buffer;
            drumBuffer = context.createBuffer(buffer.numberOfChannels,buffer.length * 8,context.sampleRate)
            for (var channel = 0; channel < 2; channel++){
                var channelData = new Float32Array(buffer.length * 8);
                for (i = 0; i < 8; i++){
                    channelData.set(buffer.getChannelData(channel), buffer.length * i);
                }

            }
            drumBuffer.copyToChannel(channelData,0,0)
        });
    }
    request.send();
}

function addAudioProperties(object) {
    object.name = object.id;
    object.source = $(object).data('sound');
    loadAudio(object, object.source);
    object.play = function () {
        var s = context.createBufferSource();
        s.buffer = object.buffer;
        s.connect(context.destination);
        s.start(0);
        object.s = s;
    }
}

node = context.createScriptProcessor(8192,2,2);
node.onaudioprocess = function(event) {
    recLength += event.inputBuffer.getChannelData(0).length;
    for (var channel = 0; channel < 2; channel++){
        recBuffer[channel].push(new Float32Array(event.inputBuffer.getChannelData(channel)));

    }
    console.log(event.inputBuffer.getChannelData(0)[0]);
}


$(function() {
	$('#sp div').each(function() {
        addAudioProperties(this);
    });

    $('#sp div').click(function() {
        this.play();
    });

    $('#play').click(function() {
        playDrum();

        source = context.createBufferSource();
        source.buffer = myBuffer;
        // source.loop = true;
        source.connect(context.destination);
        source.start(0);
    });

    $('#stop').click(function() {

        drumSource.stop();

        if (source.toString() === "[object AudioBufferSourceNode]"){
            source.stop();
        }
        else{
            node.disconnect()
            myBuffer = context.createBuffer(2,recLength,context.sampleRate)
            var buffer = [];
            for (var channel = 0; channel < 2; channel++){
                var channelData = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffer[0].length; i++){
                    channelData.set(recBuffer[channel][i], offset);
                    offset += recBuffer[0][i].length;
                }
                myBuffer.copyToChannel(channelData,channel,0);
            }




            source.disconnect();
        }
    });

    $('#rec').click(function() {

        navigator.getUserMedia (
        // constraints - only audio needed for this app
            {
                audio: true
            },
            // Success callback
            function(stream) {
                 source = context.createMediaStreamSource(stream);
                 source.connect(node);
                 node.connect(context.destination);
            },
            // Error callback
            function(err) {
                my_err = err;
                console.log('The following gUM error occured: ' + err);
            }
        );
        playDrum();
    });
});


// Drawing Canvase
var canvas = $('#canvas')[0];
var canvasCtx = canvas.getContext('2d')
function draw() {
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.beginPath();
    // var sliceWidth = canvas.width * 1.0 / drumBuffer.length;
    var numberOfPoints = 2000;
    var sliceWidth = canvas.width * 1.0 / numberOfPoints;
    var x = 0;
    // for(var i = 0; i < drumBuffer.length; i++) {
    for(var i = 0; i < drumBuffer.length; i += Math.floor(drumBuffer.length / numberOfPoints)) {

        var v = drumBuffer.getChannelData(0)[i] / 1.0;
        var y = v * canvas.height/2 + 150;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
};