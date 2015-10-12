var comm = new Icecomm('HZXOhS47SjJxtdSGb1ebHrfWikx0qKR1oAEBCuf3nyfMiP6x1i')

comm.connect('custom room', {audio: false});

comm.on('connected', function(peer) {
   document.body.appendChild(peer.getVideo());
});

comm.on('local', function(peer) {
  localVideo.src = peer.stream;
});

comm.on('disconnect', function(peer) {
  document.getElementById(peer.ID).remove();
});
