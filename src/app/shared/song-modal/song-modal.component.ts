import { Component, OnInit } from '@angular/core';
import { Category } from '@app/interfaces/category';
import { Song } from '@app/interfaces/song';
import { SongCategory } from '@app/interfaces/song-category';
import { ApiService } from '@app/services/api.service';
import { BsModalRef } from 'ngx-bootstrap';
import { FilterByPipe } from 'ngx-pipes';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-song-modal',
  templateUrl: './song-modal.component.html',
  styleUrls: ['./song-modal.component.scss'],
})
export class SongModalComponent implements OnInit {

  /**
   * Editing song
   */
  song: Song;

  /**
   * Categories of the party of this song
   */
  categories: Category[];

  /**
   * Filter categories
   */
  search: string;

  constructor(public modal: BsModalRef,
              private filterBy: FilterByPipe,
              private toast: ToastrService,
              private api: ApiService) {
  }

  /**
   * @returns Categories filtered
   */
  get categoriesFiltered(): Category[] {
    const fields: string[] = ['name'];
    return this.filterBy.transform<Category[]>(this.categories, fields, this.search);
  }

  ngOnInit(): void {
    /**
     * Update categories selected status
     */
    for (const category of this.categories) {
      const songCategory = this.song.categories.find(item => {
        return (item.category as Category).id === category.id;
      });
      category.selected = songCategory && category.id === (songCategory.category as Category).id;
    }
  }

  /**
   * Add song to all the selected categories and remove from the unselected
   */
  save(): void {
    for (const category of this.categories) {
      const songCategory = this.song.categories.find(item => {
        return (item.category as Category).id === category.id;
      });
      if (category.selected && !songCategory) {
        this.api.songCategory.create({
          song: this.song.id,
          category: category.id,
        }).subscribe((data: SongCategory): void => {
          data.category = category;
          this.song.categories.push(data);
        });
      } else if (!category.selected && songCategory) {
        this.api.songCategory.delete(songCategory.id).subscribe((): void => {
          this.song.categories.splice(this.song.categories.indexOf(songCategory), 1);
        });
      }
    }
    this.toast.info(`${this.song.name} has been updated successfully`);
    this.modal.hide();
  }
}
