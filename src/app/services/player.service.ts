import { Injectable } from '@angular/core';
import { PlayerRepeat } from '@app/enums/player-repeat';
import { Dj } from '@app/interfaces/dj';
import { Song } from '@app/interfaces/song';
import { ShufflePipe } from 'ngx-pipes';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {

  private static songsSubject: BehaviorSubject<Song[]> = new BehaviorSubject<Song[]>([]);
  private static playingSubject: BehaviorSubject<Song> = new BehaviorSubject<Song>(null);
  private static djSubject: BehaviorSubject<Dj> = new BehaviorSubject<Dj>(null);
  private static djConnectedSubject: BehaviorSubject<Dj> = new BehaviorSubject<Dj>(null);

  static songs: Observable<Song[]> = PlayerService.songsSubject.asObservable();
  static playing: Observable<Song> = PlayerService.playingSubject.asObservable();
  static dj: Observable<Dj> = PlayerService.djSubject.asObservable();
  static djConnected: Observable<Dj> = PlayerService.djConnectedSubject.asObservable();

  static repeat: PlayerRepeat = PlayerRepeat.DISABLE;
  static shuffle = false;

  /**
   * @returns The ID of the YouTube video URL
   *
   * @param url YouTube video URL
   */
  static getYouTubeVideoID(url: string): string {
    if (url.includes('?v=')) {
      return url.split('?v=')[1];
    }
    return url.split('be/')[1];
  }

  /**
   * Stop and clear player
   * @param noClear Stop playing but don't clear the list
   */
  static stop(noClear?: boolean): void {
    PlayerService.playingSubject.next(null);
    if (!noClear) {
      PlayerService.songsSubject.next([]);
    }
  }

  /**
   * Add a song into the list
   * @param song Song to add
   */
  static queue(song: Song): void {
    const songs: Song[] = PlayerService.songsSubject.value;
    songs.push(song);
    PlayerService.songsSubject.next(songs);
  }

  /**
   * Play a song and add it to queue if it's not there already
   * @param song Song to play
   */
  static play(song: Song): void {
    PlayerService.playingSubject.next(song);
    if (!PlayerService.isQueue(song)) {
      PlayerService.queue(song);
    }
  }

  /**
   * Play the next song (play the first if last song was playing)
   */
  static playNext(): void {
    const songs: Song[] = PlayerService.songsSubject.value;
    const playing: Song = PlayerService.playingSubject.value;
    const index: number = songs.indexOf(playing);
    if (PlayerService.repeat === PlayerRepeat.SINGLE) {
      PlayerService.play(songs[index]);
    } else {
      if (!PlayerService.isLastSong(playing)) {
        PlayerService.play(songs[index + 1]);
      } else {
        if (PlayerService.repeat === PlayerRepeat.DISABLE) {
          PlayerService.stop(true);
        } else {
          PlayerService.play(songs[0]);
        }
      }
    }
  }

  /**
   * Play the previous song (play the last if first song was playing)
   */
  static playPrevious() {
    const songs: Song[] = PlayerService.songsSubject.value;
    const playing: Song = PlayerService.playingSubject.value;
    const index: number = songs.indexOf(playing);

    if (!PlayerService.isFirstSong(playing)) {
      PlayerService.play(songs[index - 1]);
    } else {
      PlayerService.play(songs[songs.length - 1]);
    }
  }

  /**
   * Shuffle song list and make the current song the first
   * Un-shuffle if already shuffled (change songs order to original order)
   */
  static toggleShuffle(): void {
    // Get playing song
    const playing: Song = PlayerService.playingSubject.value;
    // Get songs except the one playing
    let songs: Song[] = PlayerService.songsSubject.value;
    // Check shuffle status, if shuffled, change to original order, otherwise shuffle
    if (!PlayerService.shuffle) {
      // Store original index for un-shuffling
      for (const song of songs) {
        song.index = songs.indexOf(song);
      }
      // Shuffle songs
      songs = new ShufflePipe().transform(songs.filter(item => item !== playing));
      // Make the playing song, the first one in the list
      songs.unshift(playing);
    } else {
      // Un-shuffle (change to original order)
      songs = songs.sort((a, b) => a.index - b.index);
    }
    // Update shuffle status
    PlayerService.shuffle = !PlayerService.shuffle;
    // Update songs
    this.songsSubject.next(songs);
  }

  /**
   * @returns Whether the song is in queue or not
   * @param song Song to check
   */
  static isQueue(song: Song): boolean {
    return PlayerService.songsSubject.value.includes(song);
  }

  /**
   * @returns Whether the song is playing or not
   * @param song Song to check
   */
  static isPlaying(song: Song): boolean {
    const playing: Song = PlayerService.playingSubject.value;
    return playing && song.id === PlayerService.playingSubject.value.id;
  }

  /**
   * @returns Whether the song is the last one in the list or not
   * @param song Song to check
   */
  static isLastSong(song: Song): boolean {
    const songs: Song[] = this.songsSubject.value;
    return songs.length === songs.indexOf(song) + 1;
  }

  /**
   * @returns Whether the song is the first one in the list or not
   * @param song Song to check
   */
  static isFirstSong(song: Song): boolean {
    return this.songsSubject.value.indexOf(song) === 0;
  }

  /**
   * Update DJ (that user is)
   *
   * @param dj DJ data
   */
  static updateDj(dj: Dj | Partial<Dj>): void {
    if (!dj) {
      this.djSubject.next(null);
      console.log('dj removed');
    } else {
      if (this.djSubject.value) {
        this.djSubject.next(Object.assign(this.djSubject.value, dj));
        console.log('dj updated', this.djSubject.value);
      } else {
        this.djSubject.next(dj as Dj);
        console.log('dj set', this.djSubject.value);
      }
    }
  }

  /**
   * Update the DJ user is connected to
   *
   * @param dj DJ data
   * @param song Song that DJ is playing
   */
  static updateDjConnected(dj: Dj, song?: Song): void {
    // Check if same DJ is updating or it's a new one that user is connecting to
    const currentDj: Dj = PlayerService.djConnectedSubject.value;
    // Check if same song is updating or it's a new one
    if (currentDj && currentDj.id === dj.id) {
      // Clear songs (stop)
      PlayerService.stop();
      // Update the DJ
      PlayerService.djConnectedSubject.next(dj);
      // Set the song (if it's not already playing)
      if (song) {
        PlayerService.play(song);
      }
    } else {
      // Clear songs (stop)
      PlayerService.stop();
      // Set the DJ
      PlayerService.djConnectedSubject.next(dj);
    }
  }

  /**
   * Clear the DJ user is connected to
   */
  static stopDjConnected(): void {
    PlayerService.djConnectedSubject.next(null);
  }
}
