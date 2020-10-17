import { style, animate, transition, trigger } from '@angular/animations';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { Cache } from '@app/classes/cache';
import { LikeKind } from '@app/enums/like-kind';
import { ApiResponse } from '@app/interfaces/api-response';
import { Category } from '@app/interfaces/category';
import { Dj } from '@app/interfaces/dj';
import { DjUser } from '@app/interfaces/dj-user';
import { Like } from '@app/interfaces/like';
import { Party } from '@app/interfaces/party';
import { PartyUser } from '@app/interfaces/party-user';
import { Song } from '@app/interfaces/song';
import { SongCategory } from '@app/interfaces/song-category';
import { User } from '@app/interfaces/user';
import { ApiService } from '@app/services/api.service';
import { AuthService } from '@app/services/auth.service';
import { LikeService } from '@app/services/like.service';
import { PartyService } from '@app/services/party.service';
import { PlayerService } from '@app/services/player.service';
import { PusherService } from '@app/services/pusher.service';
import { SongService } from '@app/services/song.service';
import { PlayerComponent } from '@app/shared/player/player.component';
import { SongModalComponent } from '@app/shared/song-modal/song-modal.component';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons/faEllipsisV';
import { faFolder } from '@fortawesome/free-solid-svg-icons/faFolder';
import { faHeadphones } from '@fortawesome/free-solid-svg-icons/faHeadphones';
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons/faSignOutAlt';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons/faUserPlus';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import Channel from 'pusher-js';

@Component({
  selector: 'app-party',
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.scss'],
  animations: [
    trigger('scaleInOut', [
      transition('* => void', [
        style({ opacity: '1', transform: 'scale(1)' }),
        animate('.15s ease-in-out', style({ opacity: '0', transform: 'scale(0)' })),
      ]),
      transition('void => *', [
        style({ opacity: '0', transform: 'scale(0)' }),
        animate('.15s ease-in-out', style({ opacity: '1', transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class PartyComponent implements OnInit, OnDestroy {

  readonly faPlay: IconDefinition = faPlay;
  readonly faDj: IconDefinition = faHeadphones;
  readonly faLike: IconDefinition = faHeart;
  readonly faLikeCategory: IconDefinition = faStar;
  readonly faKey: IconDefinition = faLock;
  readonly faJoin: IconDefinition = faUserPlus;
  readonly faLeave: IconDefinition = faSignOutAlt;
  readonly faSettings: IconDefinition = faCog;
  readonly faOptions: IconDefinition = faEllipsisV;
  readonly faCategory: IconDefinition = faFolder;
  readonly faArrowUp: IconDefinition = faArrowUp;

  /**
   * YouTube player instance
   */
  @ViewChild('player') player: PlayerComponent;

  /**
   * Element that is responsible for scrolling the whole view.
   */
  @ViewChild('scroller') scroller: ElementRef;

  /**
   * Element that is around party cover.
   */
  @ViewChild('partyWrapper') partyWrapper: ElementRef;

  /**
   * Determines whether or not to show scroll top button.
   */
  showScrollTop: boolean;

  /**
   * Cache data
   */
  cacheParty: Cache<Party>;
  cacheSongs: Cache<Song[]>;

  /**
   * Pusher channel
   */
  channel: Channel;

  /**
   * Authenticated user
   */
  user: User;

  /**
   * Party ID from param
   */
  partyId: string;

  /**
   * Party data
   */
  party: Party;

  /**
   * Party song count
   */
  partySongCount: number;

  /**
   * Party users (members) count
   */
  partyUserCount: number;

  /**
   * Song list of party
   */
  songs: Song[];

  /**
   * Song form
   */
  songForm: FormGroup;

  /**
   * Song model
   */
  songModal: BsModalRef;

  /**
   * User (member) list of party (PartyUser objects)
   */
  partyUsers: PartyUser[];

  /**
   * DJ list of party
   */
  djs: Dj[] = [];

  /**
   * DJ user (members connected to DJs) list of party (DjUser objects)
   */
  djUsers: DjUser[] = [];

  /**
   * API loading indicator
   */
  loading: boolean;

  /**
   * Is player playing
   */
  isPlaying = PlayerService.isPlaying;

  /**
   * @see SongService.getSongImage
   */
  getSongImage = SongService.getSongImage;

  constructor(public auth: AuthService,
              private api: ApiService,
              private route: ActivatedRoute,
              private router: Router,
              private formBuilder: FormBuilder,
              private modalService: BsModalService,
              private title: Title,
              private likeService: LikeService) {
  }

  /**
   * @returns Songs with category filter if selected
   */
  get songsFilter(): Song[] {
    if (this.categorySelected) {
      return this.songs.filter(song => {
        return song.categories.some(songCategory => {
          return (songCategory.category as Category).id === this.categorySelected.id;
        });
      });
    }
    return this.songs;
  }

  /**
   * @returns Selected category (for filtering)
   */
  get categorySelected(): Category {
    const CATEGORY_ID: number = Number(this.route.snapshot.queryParams.playlist);
    if (this.party && CATEGORY_ID) {
      return this.party.categories.find(category => category.id === CATEGORY_ID);
    }
    return null;
  }

  /**
   * @returns Party cover image if has one otherwise default image
   */
  get partyCover(): string {
    return `url(${this.party.cover || 'assets/party-cover.jpg'})`;
  }

  /**
   * @returns Authenticated user's DJ (object)
   */
  get dj(): Dj {
    return this.djs.find(dj => this.auth.isAuth() && dj.user === this.user.id);
  }

  /**
   * @returns Authenticated user's DJ User (object)
   */
  get djUser(): DjUser {
    return this.djUsers.find(djUser => this.user && djUser.user === this.user.id);
  }

  ngOnInit(): void {
    /**
     * Setup song form
     */
    this.songForm = this.formBuilder.group({
      source: [''],
    });
    /**
     * Get authenticated user data and watch for changes
     */
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    /**
     * Watch param changes
     */
    this.route.paramMap.subscribe((params: ParamMap): void => {
      if (!params.has('id')) {
        return;
      }
      /**
       * Unsubscribe from the channel
       */
      if (this.channel) {
        PusherService.unsubscribe(this.channel);
      }
      /**
       * Setup cache data
       */
      this.cacheParty = new Cache<Party>(`party-${params.get('id')}`);
      this.cacheSongs = new Cache<Song[]>(`songs-${params.get('id')}`);
      this.party = this.cacheParty.data;
      this.songs = this.cacheSongs.data;
      /**
       * If party ID changes
       */
      if (this.partyId !== params.get('id')) {
        /**
         * Reset data
         */
        if (this.party && this.party.id !== params.get('id')) {
          this.party = null;
          this.songs = null;
          this.partyUsers = null;
          this.partySongCount = null;
        }
        /**
         * Get party ID from params
         */
        this.partyId = params.get('id');
        /**
         * Load party data
         */
        this.loadParty(true);
      }
    });
    /**
     * Watch query param changes
     */
    this.route.queryParamMap.subscribe((): void => {
      this.updateTitle();
    });
  }

  ngOnDestroy(): void {
    /**
     * Unsubscribe from the channel
     */
    PusherService.unsubscribe(this.channel);
  }

  /**
   * Load party data for initial or refresh
   * @param initial First load
   */
  loadParty(initial: boolean = false) {
    this.api.party.retrieve(this.partyId).subscribe((data: Party): void => {
      this.party = data;
      /**
       * Update cache
       */
      this.cacheParty.data = data;
      /**
       * Update title
       */
      this.updateTitle();
      /**
       * Load other party data if it's first load (initial)
       */
      if (initial) {
        /**
         * Load party songs
         */
        this.loadSongs();
        /**
         * Load party members
         */
        this.loadUsers();
        /**
         * Load party DJs
         */
        this.loadDjs();
        /**
         * Load party User DJs
         */
        this.loadDjUsers();
        /**
         * Setup pusher channel
         */
        this.setupChannel();
      }
    });
  }

  /**
   * Update window title with party name and selected category
   */
  updateTitle(): void {
    if (this.party) {
      let title = `${this.party.name}`;
      if (this.categorySelected) {
        title = `${this.categorySelected.name} - ${title}`;
      }
      this.title.setTitle(`${title}${AppComponent.TITLE_SUFFIX}`);
    }
  }

  /**
   * Load songs of party
   */
  loadSongs(): void {
    this.api.song.list({ party: this.party.id }).subscribe((data: ApiResponse<Song>): void => {
      this.songs = data.results;
      /**
       * Update cache
       */
      this.cacheSongs.data = data.results;
      /**
       * Update party song count
       */
      this.partySongCount = data.count;
      /**
       * Set party of each song
       */
      for (const song of this.songs) {
        song.party = this.party;
      }
    });
  }

  /**
   * Load users (members) of party
   */
  loadUsers(): void {
    this.api.partyUser.list({ party: this.party.id }).subscribe(data => {
      this.partyUsers = data.results;
      this.partyUserCount = data.count;
    });
  }

  /**
   * Load DJs of this party
   */
  loadDjs(): void {
    this.api.dj.list({ party: this.party.id }).subscribe((data: ApiResponse<Dj>): void => {
      this.djs = data.results;
      this.setupDj();
    });
  }

  /**
   * Load DJ users of this party
   */
  loadDjUsers(): void {
    this.api.djUser.list({ party: this.party.id }).subscribe((data: ApiResponse<DjUser>): void => {
      this.djUsers = data.results;
      this.setupDj();
    });
  }

  /**
   * Subscribe to pusher channel for this party
   * Listen to changes and update the local data
   */
  setupChannel(): void {
    /**
     * Subscribe to channel of this party
     */
    this.channel = PusherService.subscribe(`party-${this.partyId}`);
    /**
     * Refresh songs on any song event
     */
    for (const event of ['song-create', 'song-delete', 'song-update']) {
      this.channel.bind(event, (): void => {
        this.loadSongs();
      });
    }
    /**
     * Refresh party on party update, any party category event and any user category event
     */
    for (const event of [
      'party-update',
      'partycategory-create',
      'partycategory-delete',
      'partycategory-update',
      'songcategory-create',
      'songcategory-delete',
      'songcategory-update',
    ]) {
      this.channel.bind(event, (): void => {
        this.loadParty();
      });
    }
    /**
     * Refresh users (party members) on any party user event (join or leave)
     */
    for (const event of ['partyuser-create', 'partyuser-delete']) {
      this.channel.bind(event, (): void => {
        this.loadUsers();
      });
    }
    /**
     * Redirect to dashboard with a message on party delete event
     */
    this.channel.bind('party-delete', (): void => {
      alert(`Party "${this.party.name}" has been deleted!`);
      this.router.navigateByUrl('/');
    });
    /**
     * Update likes of party, categories and song on any like event
     */
    for (const event of ['like-create', 'like-delete']) {
      this.channel.bind(event, (data: Like): void => {
        // Don't update likes if triggered by authenticated user
        if (this.auth.isAuth() && this.user.username === data.user) {
          return;
        }
        // Object that has been liked or disliked
        let object: Party | Category | Song;
        // Find the object based on like kind
        switch (data.kind) {
          case LikeKind.PARTY:
            object = this.party;
            break;
          case LikeKind.CATEGORY:
            object = this.party.categories.find(category => category.id === Number(data.like));
            break;
          case LikeKind.SONG:
            object = this.songs.find(song => song.id === Number(data.like));
            break;
        }
        // If object is liked or disliked
        if (event === 'like-create') {
          // Increase likes count
          object.likes++;
        } else {
          // Decrease likes count
          object.likes--;
        }
      });
    }
    /**
     * Handle all DJ events
     */
    this.channel.bind('dj-create', (data: Dj): void => {
      // Add the DJ to the list of DJs
      this.djs.push(data);
    });
    this.channel.bind('dj-update', (data: Dj): void => {
      // Find and update local version of DJ
      this.djs[this.djs.findIndex(dj => dj.id === data.id)] = data;
      // Check if this DJ is the DJ user is listening to
      if (this.djUser && this.djUser.dj === data.id) {
        PlayerService.updateDj(data, this.songs.find(song => song.id === data.song));
      }
    });
    this.channel.bind('dj-delete', (data: Dj): void => {
      // Find and delete the local version of DJ
      this.djs.splice(this.djs.findIndex(dj => dj.id === data.id), 1);
      // Check if this DJ is the DJ user is listening to
      if (this.dj && this.dj.id === data.id) {
        // Stop listening (disconnect from DJ)
        PlayerService.stopDj();
      }
    });
    /**
     * Handle all DJ user events
     */
    this.channel.bind('djuser-create', (data: DjUser): void => {
      // Add the DJ user to the list of DJ users
      this.djUsers.push(data);
      // Update current DJ
      this.setupDj();
    });
    this.channel.bind('djuser-update', (data: DjUser): void => {
      // Find and update local version of DJ user
      this.djUsers[this.djUsers.findIndex(item => item.id === data.id)] = data;
      // Update current DJ
      this.setupDj();
    });
    this.channel.bind('djuser-delete', (data: DjUser): void => {
      // Find and delete the local version of DJ user
      this.djUsers.splice(this.djUsers.findIndex(item => item.id === data.id), 1);
      // Check if this DJ user is from authenticated user
      if (this.user && this.djUser && this.djUser.user === this.user.id) {
        // Stop listening (disconnect from DJ)
        PlayerService.stopDj();
      }
    });
  }

  /**
   * Check list of DJs and DJ users and if user is
   * in a DJ user then connect to that DJ, then update it.
   *
   * This is used for both initial DJ setting and updating DJ setting.
   */
  setupDj(): void {
    if (this.djs && this.djs.length && this.djUser) {
      const djUserDj: Dj = this.getDj(this.djUser.dj);
      PlayerService.updateDj(djUserDj, this.songs.find(song => song.id === djUserDj.song));
    }
  }

  /**
   * Queue all party songs and play the song (if not set, play the first)
   * @param song Song to play (not provided when clicking "Play")
   */
  play(song?: Song): void {
    // Stop player (clear songs)
    PlayerService.stop();
    // If there are any party songs
    if (this.songsFilter.length) {
      // If song is not provided, start playing the first one
      if (!song) {
        song = this.songsFilter[0];
      }
      // Queue all songs
      for (const partySong of this.songsFilter) {
        PlayerService.queue(partySong);
      }
      // Play the song (first or selected)
      PlayerService.play(song);
      // If user is a dj
      if (this.isPartyDj()) {
        this.api.dj.update(this.dj.id, {
          song: song.id,
        }).subscribe();
      }
    }
  }

  /**
   * Toggle like song
   */
  toggleLikeSong(song: Song): void {
    // Alert if user unauthenticated
    if (!this.auth.isAuth()) {
      alert('Sign in to make your opinion count.');
      return;
    }
    this.loading = true;
    // If user didn't like this song, like this song. otherwise unlike this song!
    if (!song.like) {
      this.likeService.likeSong(song.id).subscribe((data: Like): void => {
        this.loading = false;
        song.like = data.id;
        song.likes++;
      });
    } else {
      // Unlike this song
      this.likeService.unlike(song.like).subscribe(() => {
        this.loading = false;
        song.like = 0;
        song.likes--;
      });
    }
  }

  /**
   * Toggle like party
   */
  toggleLikeParty(): void {
    // Alert if user unauthenticated
    if (!this.auth.isAuth()) {
      alert('Sign in to make your opinion count.');
      return;
    }
    this.loading = true;
    // If user didn't like this party, like this party. otherwise unlike this party!
    if (!this.party.like) {
      this.likeService.likeParty(this.party.id).subscribe((data: Like): void => {
        this.loading = false;
        this.party.like = data.id;
        this.party.likes++;
      });
    } else {
      // Unlike this party
      this.likeService.unlike(this.party.like).subscribe((): void => {
        this.loading = false;
        this.party.like = 0;
        this.party.likes--;
      });
    }
  }

  /**
   * Toggle like party
   */
  toggleLikeCategory(category: Category): void {
    // Alert if user unauthenticated
    if (!this.auth.isAuth()) {
      alert('Sign in to make your opinion count.');
      return;
    }
    this.loading = true;
    // If user didn't like this category, like this category. otherwise unlike this category!
    if (!category.like) {
      this.likeService.likeCategory(category.id).subscribe((data: Like): void => {
        this.loading = false;
        category.like = data.id;
        category.likes++;
      });
    } else {
      // Unlike this category
      this.likeService.unlike(category.like).subscribe(() => {
        this.loading = false;
        category.like = 0;
        category.likes--;
      });
    }
  }

  /**
   * Deselect current category
   * @param category Party category to check to clear
   */
  deselectCategory(category: Category): void {
    if (this.categorySelected === category) {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { playlist: null },
      });
    }
  }

  /**
   * @returns Song count of this category
   * @param category Party category to check
   */
  getCategorySongCount(category: Category): number {
    if (this.songs) {
      return this.songs.filter(song => {
        return song.categories.some(songCategory => (songCategory.category as Category).id === category.id);
      }).length;
    }
    return 0;
  }

  /**
   * @returns Whether user is a member of this party
   */
  isPartyMember(): boolean | void {
    if (!this.auth.isUser(this.party.user) && this.partyUsers) {
      const users: User[] = [];
      for (const partyUser of this.partyUsers) {
        users.push(partyUser.user);
      }
      return this.auth.isAnyUser(users);
    }
  }

  /**
   * @returns Whether user is a dj of this party
   */
  isPartyDj(): boolean {
    return this.user && this.djs && this.djs.some(dj => dj.user === this.user.id);
  }

  /**
   * Make authenticated user to join this party
   */
  joinParty(): void {
    this.api.partyUser.create({ party: this.party.id }).subscribe((): void => {
      this.loadUsers();
      PartyService.add(this.party);
    });
  }

  /**
   * Make authenticated user to leave this party
   */
  leaveParty(): void {
    const partyUser: PartyUser = this.partyUsers.find(item => item.user.id === this.user.id);
    this.api.partyUser.delete(partyUser.id).subscribe((): void => {
      this.loadUsers();
      PartyService.remove(this.party.id);
    });
  }

  /**
   * Delete a song from the party
   *
   * @param song Song to delete
   */
  deleteSong(song: Song): void {
    if (!this.hasSongPermission(song)) {
      alert('You do not have permission to delete this song.');
    }
    if (!confirm('Are you sure you want to delete this song?')) {
      return;
    }
    // API call
    this.api.song.delete(song.id).subscribe((): void => {
      // Remove song from the list
      this.songs.splice(this.songs.indexOf(song), 1);
    });
  }

  /**
   * Add a new song to this party
   */
  addSong(): void {
    if (this.isPartyMember() === false) {
      this.songForm.reset();
      return alert('You need to be a member of this party to add songs.');
    }
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.api.song.create({ party: this.party.id, ...this.songForm.value }).subscribe((data: Song): void => {
      this.loading = false;
      data.party = this.party;
      data.categories = [];
      this.songs.push(data);
      this.songForm.reset();
      /**
       * Add the song to selected category (if selected)
       */
      if (this.categorySelected) {
        this.api.songCategory.create({
          song: data.id,
          category: this.categorySelected.id,
        }).subscribe((songCategory: SongCategory): void => {
          songCategory.category = this.categorySelected;
          this.songs.find(item => item.id === data.id).categories.push(songCategory);
        });
      }
    });
  }

  /**
   * Edit category (show modal to select category for this song)
   *
   * @param song Song to edit
   */
  editSong(song: Song) {
    if (!this.hasSongPermission(song)) {
      alert('You do not have permission to edit this song.');
    }
    this.songModal = this.modalService.show(SongModalComponent, {
      initialState: { song, categories: this.party.categories },
    });
  }

  /**
   * Only member of the party who is either owner of party or song has permission
   * @param song Song to check permission for
   * @returns Whether user has permission over this song or not
   */
  hasSongPermission(song: Song): boolean {
    return !(this.isPartyMember() === false || !this.auth.isUser(song.user) && !this.auth.isUser(this.party.user));
  }

  /**
   * @returns Add new song input placeholder (add category name if selected)
   */
  getAddSongPlaceholder(): string {
    if (this.categorySelected) {
      return `Add new song to "${this.categorySelected.name}" (YouTube)`;
    }
    return `Add new song (YouTube)`;
  }

  /**
   * @returns Party user matching the user
   * @param id User ID
   */
  getPartyUser(id: number): PartyUser {
    return this.partyUsers.find(partyUser => partyUser.user.id === id);
  }

  /**
   * @returns DJ with this ID
   * @param id DJ ID to find
   */
  getDj(id: number): Dj {
    if (this.djs) {
      return this.djs.find(item => item.id === id);
    }
  }

  /**
   * Become a DJ of this party
   */
  toggleDj(): void {
    /**
     * Check membership
     */
    if (this.isPartyMember() === false) {
      alert('Only party members can be DJs!');
      return;
    }
    /**
     * Create a DJ for this party if user is DJ otherwise stop being a DJ
     */
    if (!this.isPartyDj()) {
      this.api.dj.create({ party: this.party.id }).subscribe();
      // Disconnect from any DJ
      if (this.djUser) {
        this.toggleConnectDj(this.getDj(this.djUser.dj));
      }
    } else {
      this.api.dj.delete(this.djs.find(dj => dj.user === this.user.id).id).subscribe();
    }
  }

  /**
   * Toggle connect to a DJ
   * @param dj DJ to (dis)connect
   */
  toggleConnectDj(dj: Dj): void {
    // Check if DJ is not self
    if (this.user && this.user.id === dj.user) {
      alert('You can not connect to yourself!');
      return;
    }
    // Check if user is connected to any JD or not
    if (!this.djUser) {
      // User is not connected, connect to this DJ
      this.api.djUser.create({ dj: dj.id }).subscribe();
      // Stop being a DJ if user is a DJ
      if (this.isPartyDj()) {
        this.toggleDj();
      }
    } else {
      // User is connected, disconnect from any DJ
      this.api.djUser.delete(this.djUser.id).subscribe();
    }
  }

  /**
   * On scroll auto show arrow button to scroll to top.
   *
   * @param event Scroll event.
   */
  onScroll(event: Event): void {
    this.showScrollTop = (event.target as HTMLDivElement).scrollTop >= 200;
  }

  /**
   * Scroll to top with smooth animation.
   */
  scrollToTop(): void {
    this.partyWrapper.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Copy party key to clipboard.
   *
   * @param partyKey Party key.
   */
  copyPartyKey(partyKey: string): void {
    navigator.clipboard.writeText(partyKey);
  }
}
