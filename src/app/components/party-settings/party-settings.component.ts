import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponent } from '@app/app.component';
import { PartyStatus } from '@app/enums/party-status';
import { ApiError } from '@app/interfaces/api-error';
import { Category } from '@app/interfaces/category';
import { Party } from '@app/interfaces/party';
import { PartyUser } from '@app/interfaces/party-user';
import { ApiService } from '@app/services/api.service';
import { PartyService } from '@app/services/party.service';
import { CategoryModalComponent } from '@app/shared/category-modal/category-modal.component';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faEdit } from '@fortawesome/free-solid-svg-icons/faEdit';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faUserMinus } from '@fortawesome/free-solid-svg-icons/faUserMinus';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { FilterByPipe } from 'ngx-pipes';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-party-settings',
  templateUrl: './party-settings.component.html',
  styleUrls: ['./party-settings.component.scss'],
})
export class PartySettingsComponent implements OnInit {

  /**
   * Redirect to path after deletion
   */
  static readonly partyDeleteRedirect = '/dashboard';

  readonly faPlus: IconDefinition = faPlus;
  readonly edit: IconDefinition = faEdit;
  readonly trash: IconDefinition = faTrash;
  readonly userMinus: IconDefinition = faUserMinus;

  /**
   * @see PartyService.statuses
   */
  readonly partyStatuses: {
    id: PartyStatus;
    label: string;
  }[] = PartyService.statuses;

  /**
   * Filter members
   */
  searchPartyUsers: string;

  /**
   * Party ID from param
   */
  partyId: string;

  /**
   * User (member) list of party (PartyUser objects)
   */
  partyUsers: PartyUser [];

  /**
   * Party data
   */
  party: Party;

  /**
   * Party settings form
   */
  form: FormGroup;

  /**
   * Party form errors
   */
  partyErrors: ApiError = {};

  /**
   * Category model
   */
  categoryModal: BsModalRef;

  /**
   * Category form
   */
  categoryForm: FormGroup;

  /**
   * Category form errors
   */
  categoryErrors: ApiError = {};

  /**
   * API loading indicator
   */
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              private api: ApiService,
              private partyService: PartyService,
              private route: ActivatedRoute,
              private router: Router,
              private filterBy: FilterByPipe,
              private modalService: BsModalService,
              private title: Title,
              private toast: ToastrService) {
  }

  ngOnInit(): void {
    /**
     * Setup party form
     */
    this.form = this.formBuilder.group({
      status: [null],
      title: [''],
      cover: [''],
      image: [''],
      description: [''],
    });
    /**
     * Setup category form
     */
    this.categoryForm = this.formBuilder.group({
      name: [''],
    });
    /**
     * Watch param changes
     */
    this.route.paramMap.subscribe(params => {
      /**
       * Get party id from params
       */
      this.partyId = params.get('id');
      /**
       * Get party name and fill the form
       */
      this.api.party.retrieve(this.partyId).subscribe(party => {
        this.loading = false;
        this.party = party;
        /**
         * Load party members
         */
        this.loadPartyUsers();
        /**
         * Set up the party form with default values
         */
        this.form.patchValue({
          status: this.party.status,
          title: this.party.name,
          image: this.party.image,
          cover: this.party.cover,
          description: this.party.description,
        });
        /**
         * Update title
         */
        this.title.setTitle(`Settings - ${this.party.name}${AppComponent.TITLE_SUFFIX}`);
      });
    });
  }

  /**
   * @returns Party users filtered
   */
  get partyUsersFiltered(): PartyUser[] {
    const fields: string[] = ['user.username', 'user.account.display_name'];
    return this.filterBy.transform<PartyUser[]>(this.partyUsers, fields, this.searchPartyUsers);
  }

  /**
   * Submit party update form
   */
  submit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.partyService.update(this.party, this.form.value).subscribe((data: Party) => {
      this.loading = false;
      this.party.status = data.status;
      this.party.name = data.name;
      this.party.image = data.image;
      this.party.cover = data.cover;
      this.party.description = data.description;
      /**
       * Update the form with the new value
       */
      this.form.patchValue({
        status: this.party.status,
        title: this.party.name,
        image: this.party.image,
        cover: this.party.cover,
        description: this.party.description,
      });
      this.toast.info(`${data.name} party has been updated successfully`);
    }, error => {
      this.loading = false;
      this.partyErrors = error.error;
    });
  }

  /**
   * Delete party and redirect
   */
  deleteParty(): void {
    if (this.loading) {
      return;
    }
    if (prompt('Enter party ID to delete:') !== this.partyId) {
      return alert('Party deletion was not confirmed.');
    }
    this.loading = true;
    this.partyService.delete(this.party.id).subscribe(() => {
      this.toast.success(`${this.party.name} party has been deleted successfully`);
      this.router.navigate([PartySettingsComponent.partyDeleteRedirect]);
    });
  }

  /**
   * Submit category form
   */
  submitCategory(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.api.partyCategory.create({
      party: this.party.id,
      ...this.categoryForm.value,
    }).subscribe((data: Category): void => {
      this.loading = false;
      this.party.categories.push(data);
      this.categoryForm.reset();
      this.toast.success(`${data.name} playlist has been created successfully`);
    }, error => {
      this.loading = false;
      this.categoryErrors = error.error;
    });
  }

  /**
   * Update category
   */
  updateCategories(): void {
    for (let category of this.party.categories) {
      this.api.partyCategory.update(category.id, {
        name: category.name,
      }).subscribe((data: Category): void => {
        category = data;
      });
    }
    this.toast.info(`Playlists has been updated successfully`);
  }

  /**
   * Delete a category
   *
   * @param category Category to delete
   */
  deleteCategory(category: Category): void {
    if (this.loading || !confirm('Are you sure you want to delete this playlist?')) {
      return;
    }
    this.loading = true;
    this.api.partyCategory.delete(category.id).subscribe((): void => {
      this.loading = false;
      this.party.categories.splice(this.party.categories.indexOf(category), 1);
      this.toast.success(`${category.name} playlist has been deleted successfully`);
    });
  }

  /**
   * Load party users (party members)
   */
  loadPartyUsers(): void {
    this.api.partyUser.list({ party: this.party.id }).subscribe(data => {
      this.partyUsers = data.results;
    });
  }

  /**
   * Delete party user (kick party member)
   *
   * @param partyUser Party user ID
   */
  removePartyUser(partyUser: PartyUser): void {
    if (this.loading || !confirm(`Are you sure you want to kick ${partyUser.user.username}?`)) {
      return;
    }
    this.loading = true;
    this.api.partyUser.delete(partyUser.id).subscribe((): void => {
      this.loading = false;
      this.partyUsers.splice(this.partyUsers.indexOf(partyUser), 1);
      this.toast.success(`${partyUser.user.username} has been kicked from ${this.party.name} successfully`);
    });
  }

  /**
   * Edit category (show modal to select songs for this category)
   *
   * @param category Category to edit
   */
  editCategory(category: Category) {
    category.party = this.party.id;
    this.categoryModal = this.modalService.show(CategoryModalComponent, {
      initialState: { category },
    });
  }
}
