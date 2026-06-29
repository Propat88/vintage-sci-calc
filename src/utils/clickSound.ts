let player: any = null;

try {
  const { createAudioPlayer } = require('expo-audio');
  const source = require('../../assets/sounds/click.wav');
  player = createAudioPlayer(source);
} catch {}

export function playClick() {
  if (player) {
    player.seekTo(0);
    player.play();
  }
}
