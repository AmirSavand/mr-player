import { Component, OnInit } from '@angular/core';
import { ApiResponse } from '@app/interfaces/api-response';
import { Category } from '@app/interfaces/category';
import { Song } from '@app/interfaces/song';
import { SongCategory } from '@app/interfaces/song-category';
import { ApiService } from '@app/services/api.service';
import { BsModalRef } from 'ngx-bootstrap';
import { FilterByPipe } from 'ngx-pipes';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-category',
  templateUrl: './category-modal.component.html',
  styleUrls: ['./category-modal.component.scss'],
})
export class CategoryModalComponent implements OnInit {

  /**
   * Editing category
   */
  category: Category;

  /**
   * Songs of the party of this category
   */
  songs: Song[];

  /**
   * Filter songs
   */
  search: string;

  constructor(public modal: BsModalRef,
              private api: ApiService,
              private filterBy: FilterByPipe,
              private toast: ToastrService) {
  }

  /**
   * @returns Songs filtered
   */
  get songsFiltered(): Song[] {
    const fields: string[] = ['name'];
    return this.filterBy.transform<Song[]>(this.songs, fields, this.search);
  }

  ngOnInit(): void {
    /**
     * Get songs of the party of this category
     */
    this.api.song.list({ party: this.category.party }).subscribe((data: ApiResponse<Song>): void => {
      this.songs = data.results;
      /**
       * Update songs selected status
       */
      for (const song of this.songs) {
        song.selected = song.categories.some(songCategory => {
          return (songCategory.category as Category).id === this.category.id;
        });
      }
    });
    /**
     * Get category details
     * @todo Remove me when API returns category image with party
     */
    this.api.partyCategory.retrieve(this.category.id).subscribe((data: Category): void => {
      this.category = data;
    });
  }

  /**
   * Add selected songs to this category and remove the unselected
   *
   * Update category image
   */
  save(): void {
    // Update category image
    this.api.partyCategory.update(this.category.id, {
      image: this.category.image,
    }).subscribe((data: Category): void => {
      this.category = data;
    });
    // Add selected songs to this category and remove the unselected
    for (const song of this.songs) {
      const songCategory = song.categories.find(item => {
        return (item.category as Category).id === this.category.id;
      });
      if (song.selected && !songCategory) {
        this.api.songCategory.create({ song: song.id, category: this.category.id }).subscribe();
      } else if (!song.selected && songCategory) {
        this.api.songCategory.delete(songCategory.id).subscribe();
      }
    }
    this.toast.info(`${this.category.name} playlist has been updated successfully`);
    this.modal.hide();
  }
}
