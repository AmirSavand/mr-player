import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '@app/interfaces/category';
import { Party } from '@app/interfaces/party';
import { ApiService } from '@app/services/api/api-service.service';

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

  /**
   * Party ID from param
   */
  partyId: string;

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
   * API loading indicator
   */
  loading: boolean;

  constructor(private formBuilder: FormBuilder,
              private api: ApiService,
              private route: ActivatedRoute,
              private router: Router) {
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
         * Set up the party form with default values
         */
        this.form.patchValue({
          title: party.name,
        });
      });
    });
  }

  /**
   * Submit party update form
   */
  submit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.api.updateParty(this.party.id, this.form.value.title).subscribe(party => {
      this.loading = false;
      this.party = party;
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
    this.api.deleteParty(this.party.id).subscribe(() => {
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
      this.party.categories.splice(this.party.categories.indexOf(category), 1);
    });
  }
}
