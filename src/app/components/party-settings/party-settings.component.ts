import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditCategoryComponent } from '@app/components/edit-category/edit-category.component';
import { ApiError } from '@app/interfaces/api-error';
import { Category } from '@app/interfaces/category';
import { Party } from '@app/interfaces/party';
import { PartyUser } from '@app/interfaces/party-user';
import { ApiService } from '@app/services/api/api-service.service';
import { PartyService } from '@app/services/party/party.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { FilterByPipe } from 'ngx-pipes';

@Component({
  selector: 'app-party-settings',
  templateUrl: './party-settings.component.html',
  styleUrls: ['./party-settings.component.scss'],
})
export class PartySettingsComponent implements OnInit {

  bsModalRef: BsModalRef;

  /**
   * Redirect to path after deletion
   */
  static readonly partyDeleteRedirect = '/dashboard';

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
              private modalService: BsModalService) {
  }

  ngOnInit(): void {
    /**
     * Setup party form
     */
    this.form = this.formBuilder.group({
      title: [''],
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
      this.api.getParty(this.partyId).subscribe(party => {
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
          title: party.name,
        });
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
    this.partyService.update(this.party, this.form.value.title).subscribe(data => {
      this.loading = false;
      this.party.name = data.name;
      /**
       * Update the form with the new value
       */
      this.form.patchValue({
        title: this.party.name,
      });
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
    this.api.addCategory(this.party.id, this.categoryForm.value.name).subscribe(data => {
      this.loading = false;
      this.party.categories.push(data);
      this.categoryForm.reset();
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
      this.api.updateCategory(category.id, category.name).subscribe(data => {
        category = data;
      });
    }
  }

  /**
   * Delete a category
   *
   * @param category Category to delete
   */
  deleteCategory(category: Category): void {
    if (this.loading || !confirm('Are you sure you want to delete this category?')) {
      return;
    }
    this.loading = true;
    this.api.deleteCategory(category.id).subscribe(() => {
      this.loading = false;
      this.party.categories.splice(this.party.categories.indexOf(category), 1);
    });
  }

  /**
   * Load party users (party members)
   */
  loadPartyUsers(): void {
    this.api.getPartyUsers({ party: this.party.id }).subscribe(data => {
      this.partyUsers = data.results;
    });
  }

  /**
   * Delete party user (kick party member)
   *
   * @param partyUser Party user ID
   */
  removePartyUser(partyUser: PartyUser): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.api.deletePartyUser(partyUser.id).subscribe(() => {
      this.loading = false;
      this.partyUsers.splice(this.partyUsers.indexOf(partyUser), 1);
    });
  }

  /**
   * Edit category (show modal to select songs for this category)
   *
   * @param category Category to edit
   */
  editCategory(category: Category) {
    this.bsModalRef = this.modalService.show(EditCategoryComponent, {
      initialState: { category }
    });
    this.bsModalRef.content.closeBtnName = 'Close';
  }
}
