import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { PlayerRepeat } from '@app/enums/player-repeat';
import { Dj } from '@app/interfaces/dj';
import { Song } from '@app/interfaces/song';
import { PlayerService } from '@app/services/player.service';
import { SongService } from '@app/services/song.service';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faBackward } from '@fortawesome/free-solid-svg-icons/faBackward';
import { faExpand } from '@fortawesome/free-solid-svg-icons/faExpand';
import { faForward } from '@fortawesome/free-solid-svg-icons/faForward';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faRandom } from '@fortawesome/free-solid-svg-icons/faRandom';
import { faRetweet } from '@fortawesome/free-solid-svg-icons/faRetweet';
import { faVolumeMute } from '@fortawesome/free-solid-svg-icons/faVolumeMute';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons/faVolumeUp';
import { NgxY2PlayerComponent, NgxY2PlayerOptions } from 'ngx-y2-player';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {

  readonly backward: IconDefinition = faBackward;
  readonly faPause: IconDefinition = faPause;
  readonly faPlay: IconDefinition = faPlay;
  readonly forward: IconDefinition = faForward;
  readonly retweet: IconDefinition = faRetweet;
  readonly random: IconDefinition = faRandom;
  readonly faExpand: IconDefinition = faExpand;
  readonly volumeUp: IconDefinition = faVolumeUp;
  readonly volumeMute: IconDefinition = faVolumeMute;

  /**
   * YouTube player instance
   */
  @ViewChild('video') youtube: NgxY2PlayerComponent;

  /**
   * YouTube player options
   */
  readonly videoPlayerOptions: NgxY2PlayerOptions = {
    playerVars: {
      autoplay: 1,
      iv_load_policy: 0,
      controls: YT.Controls.Hide,
      disablekb: 1,
      rel: 0,
    },
  };

  /**
   * Timeline update interval time in ms
   */
  private readonly timelineUpdateTime = 250;

  /**
   * Player repeat modes
   */
  readonly playerRepeat: typeof PlayerRepeat = PlayerRepeat;

  /**
   * Player volume
   */
  volume = 100;

  /**
   * Song list in queue
   */
  songs: Song[];

  /**
   * Song currently playing (active) from the playlist
   */
  playing: Song;

  /**
   * DJ subscribed to
   */
  djConnected: Dj;

  /**
   * Song currently playing timeline
   */
  timeline: number;

  /**
   * Expand player
   */
  expand: boolean;

  /**
   * Queue status
   */
  queue: boolean;

  /**
   * @see SongService.getSongImage
   */
  getSongImage = SongService.getSongImage;

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2) {
    /**
     * Add keydown listener to SPACE and pause/resume playing song
     */
    this.renderer.listen(document, 'keydown.SPACE', (event: KeyboardEvent): void => {
      /**
       * Get active element's tag name
       */
      const tagName: string = window.document.activeElement.tagName;
      /**
       * If tag name is input, textarea or button then break code
       */
      if (tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'BUTTON') {
        return;
      }
      event.preventDefault();
      /**
       * Check if a song is being played
       */
      if (!this.playing) {
        return;
      }
      /**
       * Toggle player play/pause
       */
      if (this.isPaused()) {
        this.resume();
      } else {
        this.pause();
      }
    });
  }

  /**
   * @see PlayerService.play
   */
  play = PlayerService.play;

  /**
   * @returns Party cover image if has one otherwise default image
   */
  get playingPartyCover(): string {
    if (this.playing) {
      return `url(${this.playing.party.cover || 'assets/party-cover.jpg'})`;
    }
  }

  /**
   * @returns Player repeat
   */
  get repeat(): PlayerRepeat {
    return PlayerService.repeat;
  }

  /**
   * Set player repeat
   */
  set repeat(value: PlayerRepeat) {
    PlayerService.repeat = value;
  }

  /**
   * @returns Player shuffle status
   */
  get shuffle(): boolean {
    return PlayerService.shuffle;
  }

  /**
   * Seek to a time from the timeline
   *
   * @param event Mouse event
   */
  seek(event: MouseEvent): void {
    this.youtube.videoPlayer.seekTo(
      this.youtube.videoPlayer.getDuration() * (event.offsetX / window.innerWidth), true,
    );
    this.updateTimeline();
  }

  /**
   * Play the previous song
   */
  previous(): void {
    PlayerService.playPrevious();
  }

  /**
   * Pause the playing song
   */
  pause(): void {
    this.youtube.videoPlayer.pauseVideo();
  }

  /**
   * Resume the paused song
   */
  resume(): void {
    this.youtube.videoPlayer.playVideo();
  }

  /**
   * Play the next song
   */
  next(): void {
    PlayerService.playNext();
  }

  /**
   * Shuffle or un-shuffle song list
   */
  toggleShuffle(): void {
    PlayerService.toggleShuffle();
  }

  /**
   * Toggle mute player
   */
  toggleMute(): void {
    if (this.youtube.videoPlayer.getVolume() > 0) {
      this.volume = 0;
      this.youtube.videoPlayer.setVolume(0);
    } else {
      this.volume = 100;
      this.youtube.videoPlayer.setVolume(100);
    }
  }

  /**
   * @returns Whether the YouTube player is currently playing or not
   */
  isPaused(): boolean {
    const state: YT.PlayerState = this.youtube.videoPlayer.getPlayerState();
    return (
      state !== YT.PlayerState.PLAYING &&
      state !== YT.PlayerState.BUFFERING
    );
  }

  /**
   * @returns Whether the YouTube player is muted or not
   */
  isMute(): boolean {
    return this.youtube.videoPlayer.isMuted();
  }

  /**
   * Update the song currently playing timeline
   */
  updateTimeline(): void {
    if (this.youtube && this.youtube.videoPlayer && this.youtube.videoPlayer.getCurrentTime) {
      this.timeline = this.youtube.videoPlayer.getCurrentTime() / this.youtube.videoPlayer.getDuration() * 100;
    } else {
      this.timeline = 0;
    }
  }

  /**
   * Called when YouTube player is ready
   */
  onYouTubePlayerReady(): void {
    /**
     * Get songs and subscribe
     */
    PlayerService.songs.subscribe((data: Song[]): void => {
      this.songs = data;
    });
    /**
     * Get playing song and subscribe
     */
    PlayerService.playing.subscribe((playing: Song): void => {
      // If there's a song playing
      if (playing) {
        this.playing = playing;
        // If there's a DJ and a time, load the video with that starting time in seconds
        let start = 0;
        if (this.djConnected && this.djConnected.time) {
          start = Number(this.djConnected.time.split(':').reduce((acc: any, time: string): any => (60 * acc) + +time));
        }
        if (this.youtube) {
          this.youtube.videoPlayer.loadVideoById({
            videoId: PlayerService.getYouTubeVideoID(this.playing.source),
            startSeconds: start,
          });
        }
      } else {
        this.youtube.videoPlayer.seekTo(0, true);
        this.youtube.videoPlayer.pauseVideo();
      }
    });
    /**
     * Get connected dj and subscribe
     */
    PlayerService.djConnected.subscribe((dj: Dj): void => {
      this.djConnected = dj;
    });
    /**
     * Update timeline
     */
    setInterval((): void => this.updateTimeline(), this.timelineUpdateTime);
  }

  /**
   * Called when YouTube player has changed state
   */
  onYouTubePlayerChange(): void {
    /**
     * Play the next song if this song ended
     */
    if (this.youtube.videoPlayer.getPlayerState() === YT.PlayerState.ENDED) {
      PlayerService.playNext();
    }
    this.updateTimeline();
  }

  /**
   * On mouse wheel scroll
   */
  onVolumeChange(event: WheelEvent): void {
    let volumeNumber: number = this.volume;
    if (event.deltaY < 0) {
      volumeNumber = volumeNumber + 5;
    } else if (event.deltaY > 0) {
      volumeNumber = volumeNumber - 5;
    }
    this.volume = Math.min(Math.max(volumeNumber, 0), 100);
    this.youtube.videoPlayer.setVolume(this.volume);
    // for IE
    event.returnValue = false;
    // for Chrome and Firefox
    if (event.preventDefault) {
      event.preventDefault();
    }
  }
}
