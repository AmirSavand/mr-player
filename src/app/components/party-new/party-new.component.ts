import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PartyStatus } from '@app/enums/party-status';
import { ApiError } from '@app/interfaces/api-error';
import { Party } from '@app/interfaces/party';
import { ApiService } from '@app/services/api.service';
import { PartyService } from '@app/services/party.service';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-party-new',
  templateUrl: './party-new.component.html',
})
export class PartyNewComponent implements OnInit {

  /**
   * Path to go to after party creation (party ID needs to be added)
   */
  static readonly partyCreationRedirect: string = '/party';

  readonly faPlus: IconDefinition = faPlus;

  /**
   * @see PartyService.statuses
   */
  readonly partyStatuses: {
    id: PartyStatus;
    label: string;
  }[] = PartyService.statuses;

  /**
   * Party form
   */
  partyForm: FormGroup;

  /**
   * API loading indicator
   */
  loading: boolean;

  /**
   * Party form errors
   */
  errors: ApiError = {};

  constructor(protected googleAnalytics: GoogleAnalyticsService,
              private formBuilder: FormBuilder,
              private api: ApiService,
              private router: Router,
              private toast: ToastrService) {
  }

  ngOnInit(): void {
    /**
     * Setup party form
     */
    this.partyForm = this.formBuilder.group({
      status: [PartyStatus.PUBLIC],
      title: [''],
      description: [''],
      image: [''],
      cover: [''],
    });
  }

  /**
   * Create a new party
   */
  createParty(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.api.party.create(this.partyForm.value).subscribe((data: Party): void => {
      PartyService.add(data);
      this.toast.success(`${data.name} has been created successfully`);
      this.router.navigate([PartyNewComponent.partyCreationRedirect, data.id]);
      this.googleAnalytics.event('create_party', 'party', 'Party');
    }, error => {
      this.loading = false;
      this.errors = error.error;
    });
  }
}
